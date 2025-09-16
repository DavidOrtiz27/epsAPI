<?php

namespace App\Http\Controllers;

use App\Models\Tratamiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TratamientoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $tratamientos = Tratamiento::with(['historialClinico.paciente.user', 'recetaMedica.medicamento'])->get();
        } elseif ($user->hasRole('doctor')) {
            // Doctors can see treatments for their patients
            $tratamientos = Tratamiento::whereHas('historialClinico.paciente', function ($query) use ($user) {
                $query->whereHas('citas', function ($q) use ($user) {
                    $q->where('medico_id', $user->medico->id);
                });
            })->with(['historialClinico.paciente.user', 'recetaMedica.medicamento'])->get();
        } elseif ($user->hasRole('paciente')) {
            // Patients can only see their own treatments
            $tratamientos = Tratamiento::whereHas('historialClinico', function ($query) use ($user) {
                $query->where('paciente_id', $user->paciente->id);
            })->with(['historialClinico.paciente.user', 'recetaMedica.medicamento'])->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($tratamientos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'historial_id' => 'required|exists:historial_clinico,id',
            'descripcion' => 'required|string',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only doctors and admins can create treatments
        if (!$user->hasRole('doctor') && !$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // If doctor, check if they have access to this patient's medical history
        if ($user->hasRole('doctor')) {
            $hasAccess = \App\Models\HistorialClinico::where('id', $request->historial_id)
                ->whereHas('paciente', function ($query) use ($user) {
                    $query->whereHas('citas', function ($q) use ($user) {
                        $q->where('medico_id', $user->medico->id);
                    });
                })->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Unauthorized to access this medical history'], 403);
            }
        }

        $tratamiento = Tratamiento::create($request->all());

        return response()->json($tratamiento->load(['historialClinico.paciente.user', 'recetaMedica.medicamento']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $tratamiento = Tratamiento::with(['historialClinico.paciente.user', 'recetaMedica.medicamento'])->findOrFail($id);

        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessTratamiento($user, $tratamiento)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($tratamiento);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'descripcion' => 'sometimes|required|string',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tratamiento = Tratamiento::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessTratamiento($user, $tratamiento)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tratamiento->update($request->all());

        return response()->json($tratamiento->load(['historialClinico.paciente.user', 'recetaMedica.medicamento']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $tratamiento = Tratamiento::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessTratamiento($user, $tratamiento)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only admins can delete treatments
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tratamiento->delete();

        return response()->json(['message' => 'Tratamiento deleted successfully']);
    }

    /**
     * Check if user can access the treatment
     */
    private function canAccessTratamiento($user, $tratamiento)
    {
        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            return true;
        }

        if ($user->hasRole('doctor')) {
            // Check if doctor has access to this treatment's patient
            return \App\Models\HistorialClinico::where('id', $tratamiento->historial_id)
                ->whereHas('paciente', function ($query) use ($user) {
                    $query->whereHas('citas', function ($q) use ($user) {
                        $q->where('medico_id', $user->medico->id);
                    });
                })->exists();
        }

        // Patients can only access their own treatments
        return $user->paciente && $user->paciente->id == $tratamiento->historialClinico->paciente_id;
    }
}
