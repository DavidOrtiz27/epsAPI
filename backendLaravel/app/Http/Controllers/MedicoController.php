<?php

namespace App\Http\Controllers;

use App\Models\Medico;
use App\Models\Paciente;
use App\Models\Cita;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MedicoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $medicos = Medico::with('user')->get();
        } else {
            // Regular users can only see basic doctor info
            $medicos = Medico::with(['user:id,name,email', 'especialidades'])->get();
        }

        return response()->json($medicos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id|unique:medicos',
            'especialidad' => 'nullable|string|max:100',
            'registro_profesional' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:50',
        ]);

        $user = Auth::user();

        // Only admins can create doctors
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $medico = Medico::create($request->all());

        return response()->json($medico, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $medico = Medico::with(['user', 'especialidades', 'horariosMedicos'])->findOrFail($id);

        $user = Auth::user();

        // Check if user has permission to view detailed doctor info
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') &&
            (!$user->hasRole('doctor') || $user->medico->id != $id) &&
            (!$user->paciente)) {
            // Return limited info for regular patients
            $medico = Medico::with(['user:id,name,email', 'especialidades'])->findOrFail($id);
        }

        return response()->json($medico);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'especialidad' => 'nullable|string|max:100',
            'registro_profesional' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:50',
        ]);

        $medico = Medico::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') &&
            (!$user->hasRole('doctor') || $user->medico->id != $id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $medico->update($request->all());

        return response()->json($medico);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $medico = Medico::findOrFail($id);
        $user = Auth::user();

        // Only admins can delete doctors
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $medico->delete();

        return response()->json(['message' => 'Medico deleted successfully']);
    }

    /**
     * Get doctor's patients
     */
    public function misPacientes(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('doctor') || !$user->medico) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pacientes = Paciente::whereHas('citas', function ($query) use ($user) {
            $query->where('medico_id', $user->medico->id);
        })->with(['user', 'citas' => function ($query) use ($user) {
            $query->where('medico_id', $user->medico->id);
        }])->distinct()->get();

        return response()->json($pacientes);
    }

    /**
     * Get doctor's appointments
     */
    public function misCitas(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('doctor') || !$user->medico) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $citas = Cita::where('medico_id', $user->medico->id)
                    ->with(['paciente.user', 'medico.user'])
                    ->orderBy('fecha', 'desc')
                    ->get();

        return response()->json($citas);
    }

    /**
     * Get specific doctor's patients (for admins)
     */
    public function pacientes(string $id)
    {
        $user = Auth::user();

        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pacientes = Paciente::whereHas('citas', function ($query) use ($id) {
            $query->where('medico_id', $id);
        })->with(['user', 'citas' => function ($query) use ($id) {
            $query->where('medico_id', $id);
        }])->distinct()->get();

        return response()->json($pacientes);
    }

    /**
     * Get specific doctor's appointments (for admins)
     */
    public function citas(string $id)
    {
        $user = Auth::user();

        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $citas = Cita::where('medico_id', $id)
                    ->with(['paciente.user', 'medico.user'])
                    ->orderBy('fecha', 'desc')
                    ->get();

        return response()->json($citas);
    }
}
