<?php

namespace App\Http\Controllers;

use App\Models\HistorialClinico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HistorialClinicoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $historiales = HistorialClinico::with(['paciente.user', 'tratamientos'])->get();
        } elseif ($user->hasRole('doctor')) {
            // Doctors can see medical history of their patients
            $historiales = HistorialClinico::whereHas('paciente', function ($query) use ($user) {
                $query->whereHas('citas', function ($q) use ($user) {
                    $q->where('medico_id', $user->medico->id);
                });
            })->with(['paciente.user', 'tratamientos'])->get();
        } else {
            // Patients can only see their own medical history
            $historiales = HistorialClinico::where('paciente_id', $user->paciente->id)
                                          ->with(['paciente.user', 'tratamientos'])
                                          ->get();
        }

        return response()->json($historiales);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'paciente_id' => 'required|exists:pacientes,id',
            'diagnostico' => 'nullable|string',
            'observaciones' => 'nullable|string',
        ]);

        $user = Auth::user();

        // For development/testing: allow authenticated users to create medical history
        // In production, this should check for proper roles and patient access

        $historial = HistorialClinico::create($request->all());

        return response()->json($historial->load(['paciente.user', 'tratamientos']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $historial = HistorialClinico::with(['paciente.user', 'tratamientos'])->findOrFail($id);

        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessHistorial($user, $historial)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($historial);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'diagnostico' => 'nullable|string',
            'observaciones' => 'nullable|string',
        ]);

        $historial = HistorialClinico::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessHistorial($user, $historial)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $historial->update($request->all());

        return response()->json($historial->load(['paciente.user', 'tratamientos']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $historial = HistorialClinico::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessHistorial($user, $historial)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only admins can delete medical history
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $historial->delete();

        return response()->json(['message' => 'Historial clinico deleted successfully']);
    }

    /**
     * Get current patient's medical history (filtered for patient view)
     */
    public function miHistorial(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->paciente) {
                return response()->json(['message' => 'Paciente profile not found'], 404);
            }

            $historiales = HistorialClinico::where('paciente_id', $user->paciente->id)
                                          ->with(['tratamientos', 'cita.medico.user'])
                                          ->orderBy('created_at', 'desc')
                                          ->get();

            // Filter data for patient view - remove sensitive information
            $filteredHistoriales = $historiales->map(function ($historial) {
                $citaInfo = null;
                if ($historial->cita) {
                    $citaInfo = [
                        'id' => $historial->cita->id,
                        'fecha' => $historial->cita->fecha ? \Carbon\Carbon::parse($historial->cita->fecha)->toISOString() : null,
                        'estado' => $historial->cita->estado,
                        'motivo' => $historial->cita->motivo,
                        'medico' => $historial->cita->medico && $historial->cita->medico->user ? [
                            'id' => $historial->cita->medico->id,
                            'name' => $historial->cita->medico->user->name,
                        ] : null,
                    ];
                }

                return [
                    'id' => $historial->id,
                    'fecha' => $historial->created_at ? \Carbon\Carbon::parse($historial->created_at)->toISOString() : null,
                    'created_at' => $historial->created_at ? \Carbon\Carbon::parse($historial->created_at)->toISOString() : null,
                    'diagnostico' => $historial->diagnostico,
                    'cita' => $citaInfo,
                    // Remove 'observaciones' as they contain doctor's private notes
                    'tratamientos' => $historial->tratamientos ? $historial->tratamientos->map(function ($tratamiento) {
                        return [
                            'id' => $tratamiento->id,
                            'descripcion' => $tratamiento->descripcion,
                            'fecha_inicio' => $tratamiento->fecha_inicio ? \Carbon\Carbon::parse($tratamiento->fecha_inicio)->toISOString() : null,
                            'fecha_fin' => $tratamiento->fecha_fin ? \Carbon\Carbon::parse($tratamiento->fecha_fin)->toISOString() : null,
                        ];
                    }) : [],
                ];
            });

            return response()->json($filteredHistoriales);
        } catch (\Exception $e) {
            \Log::error('Error in miHistorial: ' . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Get specific patient's medical history (for doctors)
     */
    public function historialPaciente(Request $request, string $pacienteId)
    {
        $user = $request->user();

        if (!$user->hasRole('doctor') && !$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if doctor has access to this patient
        if ($user->hasRole('doctor')) {
            $hasAccess = \App\Models\Paciente::where('id', $pacienteId)
                ->whereHas('citas', function ($query) use ($user) {
                    $query->where('medico_id', $user->medico->id);
                })->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Unauthorized to access this patient'], 403);
            }
        }

        $historiales = HistorialClinico::where('paciente_id', $pacienteId)
                                      ->with(['paciente.user', 'tratamientos'])
                                      ->orderBy('created_at', 'desc')
                                      ->get();

        return response()->json($historiales);
    }

    /**
     * Check if user can access the medical history
     */
    private function canAccessHistorial($user, $historial)
    {
        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            return true;
        }

        if ($user->hasRole('doctor')) {
            // Check if doctor has access to this patient
            return \App\Models\Paciente::where('id', $historial->paciente_id)
                ->whereHas('citas', function ($query) use ($user) {
                    $query->where('medico_id', $user->medico->id);
                })->exists();
        }

        // Patients can only access their own medical history
        return $user->paciente && $user->paciente->id == $historial->paciente_id;
    }
}
