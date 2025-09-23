<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Paciente;
use App\Models\Medico;
use App\Models\Cita;
use App\Models\HistorialClinico;
use App\Models\Tratamiento;
use App\Models\RecetaMedica;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get admin dashboard statistics
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            // Basic counts
            $totalPacientes = Paciente::count();
            $totalDoctores = Medico::count();
            $totalCitas = Cita::count();
            $citasPendientes = Cita::where('estado', 'pendiente')->count();
            $citasConfirmadas = Cita::where('estado', 'confirmada')->count();
            $citasRealizadas = Cita::where('estado', 'realizada')->count();
            $citasCanceladas = Cita::where('estado', 'cancelada')->count();

            // Time-based statistics
            $citasHoy = Cita::whereDate('fecha', today())->count();
            $citasSemana = Cita::whereBetween('fecha', [now()->startOfWeek(), now()->endOfWeek()])->count();
            $citasMes = Cita::whereMonth('fecha', now()->month)
                ->whereYear('fecha', now()->year)
                ->count();

            // Medical activity
            $totalRegistrosMedicos = HistorialClinico::count();
            $totalTratamientos = Tratamiento::count();
            $totalRecetas = RecetaMedica::count();

            // User statistics
            $totalUsuarios = User::count();
            $usuariosActivos = User::where('created_at', '>=', now()->subDays(30))->count();

            // Recent activity (last 7 days)
            // Note: citas table doesn't have timestamps, so we use fecha instead
            // tratamientos table uses fecha_inicio instead of created_at
            $actividadReciente = [
                'citas_creadas' => Cita::where('fecha', '>=', now()->subDays(7)->toDateString())->count(),
                'pacientes_registrados' => Paciente::where('created_at', '>=', now()->subDays(7))->count(),
                'registros_medicos' => HistorialClinico::where('created_at', '>=', now()->subDays(7))->count(),
                'tratamientos_iniciados' => Tratamiento::where('fecha_inicio', '>=', now()->subDays(7)->toDateString())->count(),
            ];

            // Monthly trends (last 6 months)
            $tendenciaMensual = [];
            for ($i = 5; $i >= 0; $i--) {
                $fecha = now()->subMonths($i);
                $tendenciaMensual[] = [
                    'mes' => $fecha->format('M Y'),
                    'citas' => Cita::whereMonth('fecha', $fecha->month)
                        ->whereYear('fecha', $fecha->year)
                        ->count(),
                    'pacientes_nuevos' => Paciente::whereMonth('created_at', $fecha->month)
                        ->whereYear('created_at', $fecha->year)
                        ->count(),
                    'registros_medicos' => HistorialClinico::whereMonth('created_at', $fecha->month)
                        ->whereYear('created_at', $fecha->year)
                        ->count(),
                    'tratamientos' => Tratamiento::whereMonth('fecha_inicio', $fecha->month)
                        ->whereYear('fecha_inicio', $fecha->year)
                        ->count(),
                ];
            }

            // System health
            $saludSistema = [
                'total_usuarios' => $totalUsuarios,
                'usuarios_activos_30_dias' => $usuariosActivos,
                'tasa_ocupacion_citas' => $totalCitas > 0 ? round(($citasRealizadas / $totalCitas) * 100, 1) : 0,
                'promedio_citas_por_dia' => round($citasMes / now()->day, 1),
            ];

            $estadisticas = [
                // Basic statistics
                'estadisticas_basicas' => [
                    'total_pacientes' => $totalPacientes,
                    'total_doctores' => $totalDoctores,
                    'total_citas' => $totalCitas,
                    'citas_pendientes' => $citasPendientes,
                    'citas_confirmadas' => $citasConfirmadas,
                    'citas_realizadas' => $citasRealizadas,
                    'citas_canceladas' => $citasCanceladas,
                ],

                // Time-based statistics
                'estadisticas_tiempo' => [
                    'citas_hoy' => $citasHoy,
                    'citas_semana' => $citasSemana,
                    'citas_mes' => $citasMes,
                ],

                // Medical activity
                'actividad_medica' => [
                    'registros_medicos' => $totalRegistrosMedicos,
                    'tratamientos' => $totalTratamientos,
                    'recetas_medicas' => $totalRecetas,
                ],

                // Recent activity
                'actividad_reciente' => $actividadReciente,

                // Monthly trends
                'tendencia_mensual' => $tendenciaMensual,

                // System health
                'salud_sistema' => $saludSistema,

                // Generated timestamp
                'generado_en' => now()->toISOString(),
            ];

            return response()->json($estadisticas);
        } catch (\Exception $e) {
            \Log::error('Error generating admin dashboard: ' . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Get detailed reports for admin
     */
    public function reportes(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            // Comprehensive system report
            $reporteCompleto = [
                'resumen_general' => [
                    'total_usuarios' => User::count(),
                    'total_pacientes' => Paciente::count(),
                    'total_doctores' => Medico::count(),
                    'total_citas' => Cita::count(),
                    'total_registros_medicos' => HistorialClinico::count(),
                    'total_tratamientos' => Tratamiento::count(),
                    'total_recetas' => RecetaMedica::count(),
                ],

                'estado_citas' => [
                    'pendientes' => Cita::where('estado', 'pendiente')->count(),
                    'confirmadas' => Cita::where('estado', 'confirmada')->count(),
                    'realizadas' => Cita::where('estado', 'realizada')->count(),
                    'canceladas' => Cita::where('estado', 'cancelada')->count(),
                ],

                'actividad_por_mes' => $this->getMonthlyActivity(),
                'top_doctores' => $this->getTopDoctors(),
                'estadisticas_sistema' => $this->getSystemStats(),

                'generado_en' => now()->toISOString(),
            ];

            return response()->json($reporteCompleto);
        } catch (\Exception $e) {
            \Log::error('Error generating admin reports: ' . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Get monthly activity data
     */
    private function getMonthlyActivity()
    {
        $actividad = [];
        for ($i = 11; $i >= 0; $i--) {
            $fecha = now()->subMonths($i);
            $actividad[] = [
                'mes' => $fecha->format('M Y'),
                'citas' => Cita::whereMonth('fecha', $fecha->month)
                    ->whereYear('fecha', $fecha->year)
                    ->count(),
                'pacientes_nuevos' => Paciente::whereMonth('created_at', $fecha->month)
                    ->whereYear('created_at', $fecha->year)
                    ->count(),
                'registros_medicos' => HistorialClinico::whereMonth('created_at', $fecha->month)
                    ->whereYear('created_at', $fecha->year)
                    ->count(),
                'tratamientos' => Tratamiento::whereMonth('fecha_inicio', $fecha->month)
                    ->whereYear('fecha_inicio', $fecha->year)
                    ->count(),
            ];
        }
        return $actividad;
    }

    /**
     * Get top performing doctors
     */
    private function getTopDoctors()
    {
        return DB::table('medicos')
            ->join('users', 'medicos.user_id', '=', 'users.id')
            ->leftJoin('citas', 'medicos.id', '=', 'citas.medico_id')
            ->select(
                'medicos.id',
                'users.name',
                'medicos.especialidad',
                DB::raw('COUNT(citas.id) as total_citas'),
                DB::raw('COUNT(CASE WHEN citas.estado = "realizada" THEN 1 END) as citas_realizadas')
            )
            ->groupBy('medicos.id', 'users.name', 'medicos.especialidad')
            ->orderBy('citas_realizadas', 'desc')
            ->limit(10)
            ->get();
    }

    /**
     * Get system statistics
     */
    private function getSystemStats()
    {
        $totalCitas = Cita::count();
        $citasRealizadas = Cita::where('estado', 'realizada')->count();

        return [
            'tasa_exito_citas' => $totalCitas > 0 ? round(($citasRealizadas / $totalCitas) * 100, 1) : 0,
            'promedio_citas_por_paciente' => Paciente::count() > 0 ? round($totalCitas / Paciente::count(), 1) : 0,
            'promedio_registros_por_paciente' => Paciente::count() > 0 ? round(HistorialClinico::count() / Paciente::count(), 1) : 0,
            'usuarios_activos' => User::where('updated_at', '>=', now()->subDays(30))->count(),
        ];
    }
}
