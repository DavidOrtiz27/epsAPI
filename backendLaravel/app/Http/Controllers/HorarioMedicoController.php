<?php

namespace App\Http\Controllers;

use App\Models\HorarioMedico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class HorarioMedicoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $horarios = HorarioMedico::with(['medico.user'])->get();
        } elseif ($user->hasRole('doctor')) {
            // Doctors can see their own schedules
            $horarios = HorarioMedico::where('medico_id', $user->medico->id)
                                    ->with(['medico.user'])
                                    ->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($horarios);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medico_id' => 'required|exists:medicos,id',
            'dia_semana' => 'required|in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Check permissions
        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            // Admins can create schedules for any doctor
        } elseif ($user->hasRole('doctor') && $user->medico->id == $request->medico_id) {
            // Doctors can only create their own schedules
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $horario = HorarioMedico::create($request->all());

        return response()->json($horario->load(['medico.user']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $horario = HorarioMedico::with(['medico.user'])->findOrFail($id);

        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessHorario($user, $horario)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($horario);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'dia_semana' => 'sometimes|required|in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
            'hora_inicio' => 'sometimes|required|date_format:H:i',
            'hora_fin' => 'sometimes|required|date_format:H:i|after:hora_inicio',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $horario = HorarioMedico::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessHorario($user, $horario)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $horario->update($request->all());

        return response()->json($horario->load(['medico.user']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $horario = HorarioMedico::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessHorario($user, $horario)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $horario->delete();

        return response()->json(['message' => 'Horario deleted successfully']);
    }

    /**
     * Get available time slots for a doctor on a specific date
     */
    public function availableSlots(Request $request, string $medicoId)
    {
        $request->validate([
            'fecha' => 'required|date|after_or_equal:today',
        ]);

        $fecha = $request->fecha;
        $diaSemana = strtolower(date('l', strtotime($fecha)));

        // Map English day names to Spanish
        $dayMap = [
            'monday' => 'lunes',
            'tuesday' => 'martes',
            'wednesday' => 'miercoles',
            'thursday' => 'jueves',
            'friday' => 'viernes',
            'saturday' => 'sabado',
            'sunday' => 'domingo',
        ];

        $diaSemanaEspanol = $dayMap[$diaSemana] ?? $diaSemana;

        // Get doctor's schedule for this day
        $horarios = HorarioMedico::where('medico_id', $medicoId)
            ->where('dia_semana', $diaSemanaEspanol)
            ->get();

        if ($horarios->isEmpty()) {
            return response()->json(['available_slots' => []]);
        }

        $availableSlots = [];

        foreach ($horarios as $horario) {
            $horaInicio = strtotime($horario->hora_inicio);
            $horaFin = strtotime($horario->hora_fin);

            // Generate 30-minute slots
            for ($time = $horaInicio; $time < $horaFin; $time += 1800) { // 30 minutes = 1800 seconds
                $slotTime = date('H:i', $time);
                $slotDateTime = $fecha . ' ' . $slotTime . ':00';

                // Check if slot is already booked
                $isBooked = \App\Models\Cita::where('medico_id', $medicoId)
                    ->where('fecha', $slotDateTime)
                    ->where('estado', '!=', 'cancelada')
                    ->exists();

                if (!$isBooked) {
                    $availableSlots[] = $slotTime;
                }
            }
        }

        return response()->json(['available_slots' => $availableSlots]);
    }

    /**
     * Check if user can access the schedule
     */
    private function canAccessHorario($user, $horario)
    {
        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            return true;
        }

        // Doctors can only access their own schedules
        return $user->hasRole('doctor') && $user->medico && $user->medico->id == $horario->medico_id;
    }
}
