<?php

namespace App\Http\Controllers;

use App\Models\RecetaMedica;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class RecetaMedicaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $recetas = RecetaMedica::with(['tratamiento.historialClinico.paciente.user', 'medicamento'])->get();
        } elseif ($user->hasRole('doctor')) {
            // Doctors can see prescriptions for their patients
            $recetas = RecetaMedica::whereHas('tratamiento.historialClinico.paciente', function ($query) use ($user) {
                $query->whereHas('citas', function ($q) use ($user) {
                    $q->where('medico_id', $user->medico->id);
                });
            })->with(['tratamiento.historialClinico.paciente.user', 'medicamento'])->get();
        } elseif ($user->hasRole('paciente')) {
            // Patients can only see their own prescriptions
            $recetas = RecetaMedica::whereHas('tratamiento.historialClinico', function ($query) use ($user) {
                $query->where('paciente_id', $user->paciente->id);
            })->with(['tratamiento.historialClinico.paciente.user', 'medicamento'])->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($recetas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tratamiento_id' => 'required|exists:tratamientos,id',
            'medicamento_id' => 'required|exists:medicamentos,id',
            'dosis' => 'nullable|string|max:100',
            'frecuencia' => 'nullable|string|max:100',
            'duracion' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only doctors and admins can create prescriptions
        if (!$user->hasRole('doctor') && !$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // If doctor, check if they have access to this treatment's patient
        if ($user->hasRole('doctor')) {
            $hasAccess = \App\Models\Tratamiento::where('id', $request->tratamiento_id)
                ->whereHas('historialClinico.paciente', function ($query) use ($user) {
                    $query->whereHas('citas', function ($q) use ($user) {
                        $q->where('medico_id', $user->medico->id);
                    });
                })->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Unauthorized to access this treatment'], 403);
            }
        }

        $receta = RecetaMedica::create($request->all());

        return response()->json($receta->load(['tratamiento.historialClinico.paciente.user', 'medicamento']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $receta = RecetaMedica::with(['tratamiento.historialClinico.paciente.user', 'medicamento'])->findOrFail($id);

        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessReceta($user, $receta)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($receta);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'dosis' => 'nullable|string|max:100',
            'frecuencia' => 'nullable|string|max:100',
            'duracion' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $receta = RecetaMedica::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessReceta($user, $receta)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $receta->update($request->all());

        return response()->json($receta->load(['tratamiento.historialClinico.paciente.user', 'medicamento']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $receta = RecetaMedica::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessReceta($user, $receta)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only admins can delete prescriptions
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $receta->delete();

        return response()->json(['message' => 'Receta medica deleted successfully']);
    }

    /**
     * Check if user can access the prescription
     */
    private function canAccessReceta($user, $receta)
    {
        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            return true;
        }

        if ($user->hasRole('doctor')) {
            // Check if doctor has access to this prescription's patient
            return \App\Models\Tratamiento::where('id', $receta->tratamiento_id)
                ->whereHas('historialClinico.paciente', function ($query) use ($user) {
                    $query->whereHas('citas', function ($q) use ($user) {
                        $q->where('medico_id', $user->medico->id);
                    });
                })->exists();
        }

        // Patients can only access their own prescriptions
        return $user->paciente && $user->paciente->id == $receta->tratamiento->historialClinico->paciente_id;
    }
}
