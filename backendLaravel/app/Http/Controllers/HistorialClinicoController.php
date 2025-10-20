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
        $validatedData = $request->validate([
            'paciente_id' => 'required|exists:pacientes,id',
            'cita_id' => 'nullable|exists:citas,id',
            'diagnostico' => 'nullable|string',
            'observaciones' => 'nullable|string',
        ]);

        $user = Auth::user();

        // For development/testing: allow authenticated users to create medical history
        // In production, this should check for proper roles and patient access

        // Add created_at timestamp manually since we disabled timestamps
        $validatedData['created_at'] = now();

        $historial = HistorialClinico::create($validatedData);

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
                                          ->with([
                                              'tratamientos.recetaMedica.medicamento', 
                                              'cita.medico.user'
                                          ])
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
                            'medicamentos' => $tratamiento->recetaMedica ? $tratamiento->recetaMedica->map(function ($receta) {
                                return [
                                    'id' => $receta->medicamento->id,
                                    'nombre' => $receta->medicamento->nombre,
                                    'presentacion' => $receta->medicamento->presentacion,
                                    'dosis' => $receta->dosis,
                                    'frecuencia' => $receta->frecuencia,
                                    'duracion' => $receta->duracion,
                                ];
                            }) : [],
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
     * Create sample medical history data for testing (ONLY FOR DEVELOPMENT)
     */
    public function createSampleData(Request $request)
    {
        if (!app()->environment(['local', 'development'])) {
            return response()->json(['message' => 'This endpoint is only available in development'], 403);
        }

        $user = $request->user();
        if (!$user->paciente) {
            return response()->json(['message' => 'Paciente profile not found'], 404);
        }

        try {
            // Get a completed appointment for this patient
            $cita = \App\Models\Cita::where('paciente_id', $user->paciente->id)
                                    ->where('estado', 'realizada')
                                    ->first();

            if (!$cita) {
                // Create a sample completed appointment
                $medico = \App\Models\Medico::first();
                if (!$medico) {
                    return response()->json(['message' => 'No doctors found in system'], 404);
                }

                $cita = \App\Models\Cita::create([
                    'paciente_id' => $user->paciente->id,
                    'medico_id' => $medico->id,
                    'fecha' => now()->subDays(7)->format('Y-m-d H:i:s'),
                    'estado' => 'realizada',
                    'motivo' => 'Consulta general de control'
                ]);
            }

            // Create medical history record
            $historial = \App\Models\HistorialClinico::create([
                'paciente_id' => $user->paciente->id,
                'cita_id' => $cita->id,
                'diagnostico' => 'Hipertensión arterial leve. Paciente presenta valores de presión arterial ligeramente elevados. Se recomienda tratamiento farmacológico y cambios en el estilo de vida.',
                'observaciones' => 'Paciente colaborador, cumple tratamiento anterior. Presión arterial: 140/90 mmHg.',
                'created_at' => now()
            ]);

            // Create medications
            $medicamentos = [
                [
                    'nombre' => 'Enalapril',
                    'presentacion' => 'Tabletas 10mg',
                    'dosis_recomendada' => '10mg cada 12 horas'
                ],
                [
                    'nombre' => 'Hidroclorotiazida',
                    'presentacion' => 'Tabletas 25mg',
                    'dosis_recomendada' => '25mg una vez al día'
                ],
                [
                    'nombre' => 'Ácido Acetilsalicílico',
                    'presentacion' => 'Tabletas 100mg',
                    'dosis_recomendada' => '100mg una vez al día'
                ]
            ];

            foreach ($medicamentos as $medData) {
                \App\Models\Medicamento::firstOrCreate(
                    ['nombre' => $medData['nombre']],
                    $medData
                );
            }

            // Create treatments
            $tratamiento1 = \App\Models\Tratamiento::create([
                'historial_id' => $historial->id,
                'descripcion' => 'Tratamiento antihipertensivo con IECA y diurético tiazídico',
                'fecha_inicio' => now()->format('Y-m-d'),
                'fecha_fin' => now()->addMonths(3)->format('Y-m-d')
            ]);

            $tratamiento2 = \App\Models\Tratamiento::create([
                'historial_id' => $historial->id,
                'descripcion' => 'Antiagregación plaquetaria para prevención cardiovascular',
                'fecha_inicio' => now()->format('Y-m-d'),
                'fecha_fin' => now()->addMonths(6)->format('Y-m-d')
            ]);

            // Create prescriptions (receta médica)
            $enalapril = \App\Models\Medicamento::where('nombre', 'Enalapril')->first();
            $hidroclorotiazida = \App\Models\Medicamento::where('nombre', 'Hidroclorotiazida')->first();
            $aspirina = \App\Models\Medicamento::where('nombre', 'Ácido Acetilsalicílico')->first();

            // Prescription for treatment 1
            \App\Models\RecetaMedica::create([
                'tratamiento_id' => $tratamiento1->id,
                'medicamento_id' => $enalapril->id,
                'dosis' => '10mg',
                'frecuencia' => 'Cada 12 horas',
                'duracion' => '3 meses'
            ]);

            \App\Models\RecetaMedica::create([
                'tratamiento_id' => $tratamiento1->id,
                'medicamento_id' => $hidroclorotiazida->id,
                'dosis' => '25mg',
                'frecuencia' => 'Una vez al día por la mañana',
                'duracion' => '3 meses'
            ]);

            // Prescription for treatment 2
            \App\Models\RecetaMedica::create([
                'tratamiento_id' => $tratamiento2->id,
                'medicamento_id' => $aspirina->id,
                'dosis' => '100mg',
                'frecuencia' => 'Una vez al día después del desayuno',
                'duracion' => '6 meses'
            ]);

            return response()->json([
                'message' => 'Sample medical history data created successfully',
                'historial_id' => $historial->id,
                'tratamientos_count' => 2,
                'medicamentos_count' => 3
            ]);

        } catch (\Exception $e) {
            \Log::error('Error creating sample data: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating sample data'], 500);
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
                                      ->with([
                                        'paciente.user', 
                                        'tratamientos.recetaMedica.medicamento',
                                        'cita'
                                      ])
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
