<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CitaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $citas = Cita::with(['paciente.user', 'medico.user'])->get();
        } elseif ($user->hasRole('doctor')) {
            $citas = Cita::where('medico_id', $user->medico->id)
                        ->with(['paciente.user', 'medico.user'])
                        ->get();
        } else {
            // Patients can see their own appointments
            $paciente = $user->paciente;
            if ($paciente) {
                $citas = Cita::where('paciente_id', $paciente->id)
                            ->with(['paciente.user', 'medico.user'])
                            ->get();
            } else {
                $citas = collect();
            }
        }

        return response()->json($citas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'paciente_id' => 'required|exists:pacientes,id',
            'medico_id' => 'required|exists:medicos,id',
            'fecha' => 'required|date',
            'motivo' => 'nullable|string',
        ]);

        // Custom validation for appointment date
        $appointmentDate = Carbon::parse($request->fecha);
        $now = Carbon::now();
        
        if ($appointmentDate->isPast()) {
            return response()->json([
                'errors' => [
                    'fecha' => ['La fecha de la cita debe ser futura. Fecha seleccionada: ' . $appointmentDate->format('Y-m-d H:i') . ', Hora actual: ' . $now->format('Y-m-d H:i')]
                ]
            ], 422);
        }

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Check if user can create appointments
        if ($user->hasRole('paciente')) {
            // Patients can only create appointments for themselves
            $paciente = $user->paciente;
            if (!$paciente || $request->paciente_id != $paciente->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif (!$user->hasRole('admin') && !$user->hasRole('superadmin') && !$user->hasRole('doctor')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Debug logging for date handling
        \Log::info('Creating appointment with data:', ['data' => $request->all()]);
        \Log::info('Received fecha: ' . $request->fecha);
        \Log::info('Server timezone: ' . config('app.timezone'));
        \Log::info('Current server time: ' . now());

        $cita = Cita::create($request->all());

        \Log::info('Saved appointment fecha in database: ' . $cita->fecha);
        \Log::info('Fecha formatted as ISO: ' . $cita->fecha->toISOString());

        return response()->json($cita->load(['paciente.user', 'medico.user']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $cita = Cita::with(['paciente.user', 'medico.user'])->findOrFail($id);

        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessCita($user, $cita)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($cita);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'paciente_id' => 'sometimes|exists:pacientes,id',
            'medico_id' => 'sometimes|exists:medicos,id',
            'fecha' => 'sometimes|date',
            'estado' => 'sometimes|in:pendiente,confirmada,cancelada,realizada',
            'motivo' => 'nullable|string',
        ]);

        // Custom validation for appointment date (only if fecha is being updated)
        if ($request->has('fecha')) {
            $appointmentDate = Carbon::parse($request->fecha);
            $now = Carbon::now();
            
            if ($appointmentDate->isPast()) {
                return response()->json([
                    'errors' => [
                        'fecha' => ['La fecha de la cita debe ser futura. Fecha seleccionada: ' . $appointmentDate->format('Y-m-d H:i') . ', Hora actual: ' . $now->format('Y-m-d H:i')]
                    ]
                ], 422);
            }
        }

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cita = Cita::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessCita($user, $cita)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only doctors and admins can update status
        if ($request->has('estado') && !$user->hasRole('doctor') && !$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized to update status'], 403);
        }

        $cita->update($request->all());

        return response()->json($cita->load(['paciente.user', 'medico.user']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $cita = Cita::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessCita($user, $cita)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only admins can delete appointments
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cita->delete();

        return response()->json(['message' => 'Cita deleted successfully']);
    }

    /**
     * Check if user can access the cita
     */
    private function canAccessCita($user, $cita)
    {
        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            return true;
        }

        if ($user->hasRole('doctor') && $user->medico && $user->medico->id == $cita->medico_id) {
            return true;
        }

        if ($user->paciente && $user->paciente->id == $cita->paciente_id) {
            return true;
        }

        return false;
    }

    /**
     * Get current user's appointments (for patients and doctors)
     */
    public function misCitas(Request $request)
    {
        $user = $request->user();

        if ($user->hasRole('doctor')) {
            $citas = Cita::where('medico_id', $user->medico->id)
                        ->with(['paciente.user', 'medico.user'])
                        ->orderBy('fecha', 'desc')
                        ->get();
        } elseif ($user->paciente) {
            $citas = Cita::where('paciente_id', $user->paciente->id)
                        ->with(['paciente.user', 'medico.user'])
                        ->orderBy('fecha', 'desc')
                        ->get();
        } else {
            $citas = collect();
        }

        // Debug logging for returned appointments
        if ($citas->isNotEmpty()) {
            \Log::info('Returning appointments to frontend:');
            foreach ($citas->take(3) as $cita) {
                \Log::info("Appointment ID {$cita->id}:");
                \Log::info("  - Raw fecha from DB: {$cita->getRawOriginal('fecha')}");
                \Log::info("  - Processed fecha: {$cita->fecha}");
                \Log::info("  - ISO format: {$cita->fecha->toISOString()}");
                \Log::info("  - JSON format: " . json_encode($cita->fecha));
            }
        }

        return response()->json($citas);
    }

    /**
     * Update appointment status (for doctors)
     */
    public function actualizarEstado(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:pendiente,confirmada,cancelada,realizada',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cita = Cita::findOrFail($id);
        $user = $request->user();

        // Only doctors assigned to this appointment can update status
        if (!$user->hasRole('doctor') || !$user->medico || $user->medico->id != $cita->medico_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $cita->update(['estado' => $request->estado]);

        return response()->json($cita->load(['paciente.user', 'medico.user']));
    }

    /**
     * Cancel appointment (for patients)
     */
    public function cancelarCita(Request $request, string $id)
    {
        $cita = Cita::findOrFail($id);
        $user = $request->user();

        // Check if user is a patient and owns this appointment
        if (!$user->hasRole('paciente') || !$user->paciente || $user->paciente->id != $cita->paciente_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if appointment can be cancelled (not already cancelled or completed)
        if ($cita->estado === 'cancelada') {
            return response()->json(['message' => 'La cita ya está cancelada'], 400);
        }

        if ($cita->estado === 'realizada') {
            return response()->json(['message' => 'No se puede cancelar una cita ya realizada'], 400);
        }

        // Update appointment status
        $cita->update(['estado' => 'cancelada']);

        return response()->json([
            'message' => 'Cita cancelada exitosamente',
            'cita' => $cita->load(['paciente.user', 'medico.user'])
        ]);
    }

    /**
     * Get appointment reports (for admins)
     */
    public function reportes(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reportes = [
            'total_citas' => Cita::count(),
            'citas_pendientes' => Cita::where('estado', 'pendiente')->count(),
            'citas_confirmadas' => Cita::where('estado', 'confirmada')->count(),
            'citas_canceladas' => Cita::where('estado', 'cancelada')->count(),
            'citas_realizadas' => Cita::where('estado', 'realizada')->count(),
            'citas_hoy' => Cita::whereDate('fecha', today())->count(),
            'citas_semana' => Cita::whereBetween('fecha', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'citas_mes' => Cita::whereMonth('fecha', now()->month)->count(),
        ];

        return response()->json($reportes);
    }
}
