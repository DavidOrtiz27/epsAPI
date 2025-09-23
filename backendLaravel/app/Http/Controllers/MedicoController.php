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

        $user = Auth::user()->load('medico'); // Load medico relationship

        // Check if user has permission to view detailed doctor info
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') &&
            (!$user->hasRole('doctor') || !$user->medico || $user->medico->id != $id) &&
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

    /**
     * Get current doctor's profile
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('doctor') || !$user->medico) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $medico = $user->medico->load(['user', 'especialidades', 'horariosMedicos']);

        return response()->json($medico);
    }

    /**
     * Update current doctor's profile
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'registro_profesional' => 'nullable|string|max:100',
            'especialidad' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:50',
        ]);

        $user = $request->user();

        if (!$user->hasRole('doctor') || !$user->medico) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user->medico->update($request->only(['registro_profesional', 'especialidad', 'telefono']));

        return response()->json($user->medico->load(['user', 'especialidades']));
    }

    /**
     * Get doctor's reports and statistics
     */
    public function reportes(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('doctor') || !$user->medico) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $medicoId = $user->medico->id;

        try {
            // Basic appointment statistics
            $totalCitas = Cita::where('medico_id', $medicoId)->count();
            $citasPendientes = Cita::where('medico_id', $medicoId)->where('estado', 'pendiente')->count();
            $citasConfirmadas = Cita::where('medico_id', $medicoId)->where('estado', 'confirmada')->count();
            $citasCanceladas = Cita::where('medico_id', $medicoId)->where('estado', 'cancelada')->count();
            $citasRealizadas = Cita::where('medico_id', $medicoId)->where('estado', 'realizada')->count();

            // Time-based statistics
            $citasHoy = Cita::where('medico_id', $medicoId)->whereDate('fecha', today())->count();
            $citasSemana = Cita::where('medico_id', $medicoId)->whereBetween('fecha', [now()->startOfWeek(), now()->endOfWeek()])->count();
            $citasMes = Cita::where('medico_id', $medicoId)->whereMonth('fecha', now()->month)->whereYear('fecha', now()->year)->count();

            // Patient statistics - simplified
            $totalPacientes = Cita::where('medico_id', $medicoId)
                ->distinct('paciente_id')
                ->count('paciente_id');

            // Medical records statistics - simplified
            $pacienteIds = Cita::where('medico_id', $medicoId)
                ->pluck('paciente_id')
                ->unique()
                ->toArray();

            $totalRegistrosMedicos = \DB::table('historial_clinico')
                ->whereIn('paciente_id', $pacienteIds)
                ->count();

            // Treatments and prescriptions statistics - simplified
            $historialIds = \DB::table('historial_clinico')
                ->whereIn('paciente_id', $pacienteIds)
                ->pluck('id')
                ->toArray();

            $totalTratamientos = \DB::table('tratamientos')
                ->whereIn('historial_id', $historialIds)
                ->count();

            $tratamientoIds = \DB::table('tratamientos')
                ->whereIn('historial_id', $historialIds)
                ->pluck('id')
                ->toArray();

            $totalRecetas = \DB::table('receta_medica')
                ->whereIn('tratamiento_id', $tratamientoIds)
                ->count();

            // Recent activity (last 30 days) - simplified
            // Note: Since citas table doesn't have timestamps, we'll use fecha instead
            $actividadReciente = [
                'citas_realizadas' => Cita::where('medico_id', $medicoId)
                    ->where('estado', 'realizada')
                    ->where('fecha', '>=', now()->subDays(30))
                    ->count(),
                'registros_creados' => \DB::table('historial_clinico')
                    ->whereIn('paciente_id', $pacienteIds)
                    ->count(), // Remove time filter since we don't have timestamps
                'tratamientos_iniciados' => \DB::table('tratamientos')
                    ->whereIn('historial_id', $historialIds)
                    ->count(), // Remove time filter since we don't have timestamps
            ];

            // Monthly trend (last 6 months) - simplified
            $tendenciaMensual = [];
            for ($i = 5; $i >= 0; $i--) {
                $fecha = now()->subMonths($i);
                $citasCount = Cita::where('medico_id', $medicoId)
                    ->whereMonth('fecha', $fecha->month)
                    ->whereYear('fecha', $fecha->year)
                    ->count();

                $pacientesUnicos = Cita::where('medico_id', $medicoId)
                    ->whereMonth('fecha', $fecha->month)
                    ->whereYear('fecha', $fecha->year)
                    ->distinct('paciente_id')
                    ->count('paciente_id');

                $tendenciaMensual[] = [
                    'mes' => $fecha->format('M Y'),
                    'citas' => $citasCount,
                    'pacientes_unicos' => $pacientesUnicos,
                ];
            }

            $reportes = [
                // Appointment statistics
                'estadisticas_citas' => [
                    'total' => $totalCitas,
                    'pendientes' => $citasPendientes,
                    'confirmadas' => $citasConfirmadas,
                    'canceladas' => $citasCanceladas,
                    'realizadas' => $citasRealizadas,
                    'hoy' => $citasHoy,
                    'semana' => $citasSemana,
                    'mes' => $citasMes,
                ],

                // Patient and medical activity
                'estadisticas_pacientes' => [
                    'total_pacientes' => $totalPacientes,
                    'registros_medicos' => $totalRegistrosMedicos,
                    'tratamientos' => $totalTratamientos,
                    'recetas_medicas' => $totalRecetas,
                ],

                // Recent activity
                'actividad_reciente' => $actividadReciente,

                // Monthly trends
                'tendencia_mensual' => $tendenciaMensual,

                // Generated timestamp
                'generado_en' => now()->toISOString(),
            ];

            return response()->json($reportes);
        } catch (\Exception $e) {
            \Log::error('Error generating doctor reports: ' . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor'], 500);
        }
    }
}
