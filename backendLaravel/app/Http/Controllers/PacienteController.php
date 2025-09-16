<?php

namespace App\Http\Controllers;

use App\Models\Paciente;
use App\Models\Medico;
use App\Models\Cita;
use App\Models\Factura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PacienteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $pacientes = Paciente::with('user')->get();
        } elseif ($user->hasRole('doctor')) {
            // Doctors can see patients they have appointments with
            $pacientes = Paciente::whereHas('citas', function ($query) use ($user) {
                $query->where('medico_id', $user->medico->id);
            })->with('user')->get();
        } else {
            // Patients can only see their own profile
            $pacientes = Paciente::where('user_id', $user->id)->with('user')->get();
        }

        return response()->json($pacientes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id|unique:pacientes',
            'documento' => 'required|string|max:50|unique:pacientes',
            'telefono' => 'nullable|string|max:50',
            'direccion' => 'nullable|string|max:255',
            'fecha_nacimiento' => 'nullable|date',
            'genero' => 'nullable|in:M,F,O',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only admins can create patients
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $paciente = Paciente::create($request->all());

        return response()->json($paciente, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $paciente = Paciente::with(['user', 'citas', 'historialClinico', 'examenes', 'facturas'])->findOrFail($id);

        $user = Auth::user();

        // Check if user has permission to view this patient
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') &&
            !$user->hasRole('doctor') && $paciente->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($paciente);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'documento' => 'sometimes|required|string|max:50|unique:pacientes,documento,' . $id,
            'telefono' => 'nullable|string|max:50',
            'direccion' => 'nullable|string|max:255',
            'fecha_nacimiento' => 'nullable|date',
            'genero' => 'nullable|in:M,F,O',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $paciente = Paciente::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') && $paciente->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $paciente->update($request->all());

        return response()->json($paciente);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $paciente = Paciente::findOrFail($id);
        $user = Auth::user();

        // Only admins can delete patients
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $paciente->delete();

        return response()->json(['message' => 'Paciente deleted successfully']);
    }

    /**
     * Get current patient's profile
     */
    public function profile(Request $request)
    {
        $paciente = $request->user()->paciente;
        if (!$paciente) {
            return response()->json(['message' => 'Paciente profile not found'], 404);
        }

        return response()->json($paciente->load(['user', 'citas', 'historialClinico', 'examenes', 'facturas']));
    }

    /**
     * Update current patient's profile
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'telefono' => 'nullable|string|max:50',
            'direccion' => 'nullable|string|max:255',
            'fecha_nacimiento' => 'nullable|date',
            'genero' => 'nullable|in:M,F,O',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $paciente = $request->user()->paciente;
        if (!$paciente) {
            return response()->json(['message' => 'Paciente profile not found'], 404);
        }

        $paciente->update($request->all());

        return response()->json($paciente);
    }

    /**
     * Get dashboard statistics for admin
     */
    public function dashboardStats()
    {
        $stats = [
            'total_pacientes' => Paciente::count(),
            'total_medicos' => Medico::count(),
            'total_citas' => Cita::count(),
            'citas_pendientes' => Cita::where('estado', 'pendiente')->count(),
            'citas_hoy' => Cita::whereDate('fecha', today())->count(),
            'facturas_pendientes' => Factura::where('estado', 'pendiente')->count(),
        ];

        return response()->json($stats);
    }
}
