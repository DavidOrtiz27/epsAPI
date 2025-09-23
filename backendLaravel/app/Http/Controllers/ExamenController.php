<?php

namespace App\Http\Controllers;

use App\Models\Examen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ExamenController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $examenes = Examen::with(['paciente.user'])->get();
        } elseif ($user->hasRole('doctor')) {
            // Doctors can see exams of their patients
            $examenes = Examen::whereHas('paciente', function ($query) use ($user) {
                $query->whereHas('citas', function ($q) use ($user) {
                    $q->where('medico_id', $user->medico->id);
                });
            })->with(['paciente.user'])->get();
        } elseif ($user->hasRole('paciente')) {
            // Patients can only see their own exams
            $examenes = Examen::where('paciente_id', $user->paciente->id)
                              ->with(['paciente.user'])
                              ->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($examenes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'paciente_id' => 'required|exists:pacientes,id',
            'tipo' => 'nullable|string|max:100',
            'resultado' => 'nullable|string',
            'fecha' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // For development/testing: allow authenticated users to create exams
        // In production, this should check for proper roles and patient access

        $examen = Examen::create($request->all());

        return response()->json($examen->load(['paciente.user']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $examen = Examen::with(['paciente.user'])->findOrFail($id);

        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessExamen($user, $examen)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($examen);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'tipo' => 'nullable|string|max:100',
            'resultado' => 'nullable|string',
            'fecha' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $examen = Examen::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessExamen($user, $examen)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $examen->update($request->all());

        return response()->json($examen->load(['paciente.user']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $examen = Examen::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessExamen($user, $examen)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only admins can delete exams
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $examen->delete();

        return response()->json(['message' => 'Examen deleted successfully']);
    }

    /**
     * Check if user can access the exam
     */
    private function canAccessExamen($user, $examen)
    {
        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            return true;
        }

        if ($user->hasRole('doctor')) {
            // Check if doctor has access to this patient
            return \App\Models\Paciente::where('id', $examen->paciente_id)
                ->whereHas('citas', function ($query) use ($user) {
                    $query->where('medico_id', $user->medico->id);
                })->exists();
        }

        // Patients can only access their own exams
        return $user->paciente && $user->paciente->id == $examen->paciente_id;
    }
}
