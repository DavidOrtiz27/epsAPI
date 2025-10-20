<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;
use App\Models\Paciente;
use App\Models\Medico;
use App\Models\Especialidad;
use App\Models\Cita;
use App\Models\HistorialClinico;
use App\Models\Tratamiento;
use App\Models\Medicamento;
use App\Models\RecetaMedica;
use App\Models\Examen;
use App\Models\Factura;
use App\Models\Pago;
use App\Models\HorarioMedico;
use App\Models\Notificacion;
use App\Models\Auditoria;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Creando datos de prueba completos...');

        // =========================
        // 1. CREAR USUARIOS Y ROLES
        // =========================
        $this->command->info('👥 Creando usuarios...');
        
        // Admin
        $admin = User::create([
            'name' => 'Juan Carlos Administrador',
            'email' => 'admin@epsapi.com',
            'password' => Hash::make('admin123'),
            'status' => 'active',
        ]);
        $adminRole = Role::where('name', 'admin')->first();
        $admin->roles()->attach($adminRole);

        // Doctor 1 - Cardiología
        $doctor1 = User::create([
            'name' => 'Dra. Ana María González',
            'email' => 'ana.gonzalez@epsapi.com',
            'password' => Hash::make('doctor123'),
            'status' => 'active',
        ]);
        $doctorRole = Role::where('name', 'doctor')->first();
        $doctor1->roles()->attach($doctorRole);

        // Doctor 2 - Medicina General
        $doctor2 = User::create([
            'name' => 'Dr. Carlos Eduardo Ramírez',
            'email' => 'carlos.ramirez@epsapi.com',
            'password' => Hash::make('doctor123'),
            'status' => 'active',
        ]);
        $doctor2->roles()->attach($doctorRole);

        // Pacientes (5 pacientes de prueba)
        $pacienteRole = Role::where('name', 'paciente')->first();
        
        $pacienteUsers = [
            [
                'name' => 'María Elena Pérez',
                'email' => 'maria.perez@gmail.com',
                'documento' => '12345678',
                'telefono' => '555-0001',
                'direccion' => 'Calle 123 #45-67, Bogotá',
                'fecha_nacimiento' => '1985-03-15',
                'genero' => 'F'
            ],
            [
                'name' => 'Roberto José Silva',
                'email' => 'roberto.silva@gmail.com',
                'documento' => '87654321',
                'telefono' => '555-0002',
                'direccion' => 'Carrera 98 #12-34, Medellín',
                'fecha_nacimiento' => '1978-07-22',
                'genero' => 'M'
            ],
            [
                'name' => 'Carmen Rosa López',
                'email' => 'carmen.lopez@yahoo.com',
                'documento' => '11223344',
                'telefono' => '555-0003',
                'direccion' => 'Avenida 45 #78-90, Cali',
                'fecha_nacimiento' => '1992-11-08',
                'genero' => 'F'
            ],
            [
                'name' => 'José Luis Martínez',
                'email' => 'jose.martinez@hotmail.com',
                'documento' => '44332211',
                'telefono' => '555-0004',
                'direccion' => 'Calle 67 #23-45, Barranquilla',
                'fecha_nacimiento' => '1965-12-03',
                'genero' => 'M'
            ],
            [
                'name' => 'Laura Sofía Herrera',
                'email' => 'laura.herrera@gmail.com',
                'documento' => '55667788',
                'telefono' => '555-0005',
                'direccion' => 'Transversal 12 #34-56, Bucaramanga',
                'fecha_nacimiento' => '1990-01-25',
                'genero' => 'F'
            ]
        ];

        $pacientes = [];
        foreach ($pacienteUsers as $pacienteData) {
            $user = User::create([
                'name' => $pacienteData['name'],
                'email' => $pacienteData['email'],
                'password' => Hash::make('paciente123'),
                'status' => 'active',
            ]);
            $user->roles()->attach($pacienteRole);

            $paciente = Paciente::create([
                'user_id' => $user->id,
                'documento' => $pacienteData['documento'],
                'telefono' => $pacienteData['telefono'],
                'direccion' => $pacienteData['direccion'],
                'fecha_nacimiento' => $pacienteData['fecha_nacimiento'],
                'genero' => $pacienteData['genero'],
            ]);
            $pacientes[] = $paciente;
        }

        // =========================
        // 2. CREAR PERFILES MÉDICOS
        // =========================
        $this->command->info('👨‍⚕️ Creando perfiles médicos...');
        
        $cardiologia = Especialidad::where('nombre', 'Cardiología')->first();
        $medicinaGeneral = Especialidad::where('nombre', 'Medicina General')->first();

        $medico1 = Medico::create([
            'user_id' => $doctor1->id,
            'especialidad' => 'Cardiología',
            'registro_profesional' => 'MP-12345',
            'telefono' => '555-1001',
        ]);
        $medico1->especialidades()->attach($cardiologia);

        $medico2 = Medico::create([
            'user_id' => $doctor2->id,
            'especialidad' => 'Medicina General',
            'registro_profesional' => 'MP-67890',
            'telefono' => '555-1002',
        ]);
        $medico2->especialidades()->attach($medicinaGeneral);

        // =========================
        // 3. CREAR HORARIOS MÉDICOS
        // =========================
        $this->command->info('🕐 Creando horarios médicos...');
        
        // Horarios para médico 1
        $diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        foreach ($diasSemana as $dia) {
            HorarioMedico::create([
                'medico_id' => $medico1->id,
                'dia_semana' => $dia,
                'hora_inicio' => '08:00',
                'hora_fin' => '16:00',
            ]);
        }

        // Horarios para médico 2
        foreach ($diasSemana as $dia) {
            HorarioMedico::create([
                'medico_id' => $medico2->id,
                'dia_semana' => $dia,
                'hora_inicio' => '09:00',
                'hora_fin' => '17:00',
            ]);
        }

        // =========================
        // 4. CREAR MEDICAMENTOS
        // =========================
        $this->command->info('💊 Creando medicamentos...');
        
        $medicamentos = [
            ['nombre' => 'Paracetamol', 'presentacion' => 'Tableta 500mg', 'dosis_recomendada' => '500mg cada 8 horas'],
            ['nombre' => 'Ibuprofeno', 'presentacion' => 'Tableta 400mg', 'dosis_recomendada' => '400mg cada 6 horas'],
            ['nombre' => 'Losartán', 'presentacion' => 'Tableta 50mg', 'dosis_recomendada' => '50mg cada 24 horas'],
            ['nombre' => 'Atorvastatina', 'presentacion' => 'Tableta 20mg', 'dosis_recomendada' => '20mg cada 24 horas'],
            ['nombre' => 'Omeprazol', 'presentacion' => 'Cápsula 20mg', 'dosis_recomendada' => '20mg cada 24 horas'],
            ['nombre' => 'Metformina', 'presentacion' => 'Tableta 850mg', 'dosis_recomendada' => '850mg cada 12 horas'],
            ['nombre' => 'Amoxicilina', 'presentacion' => 'Cápsula 500mg', 'dosis_recomendada' => '500mg cada 8 horas'],
        ];

        $medicamentosCreados = [];
        foreach ($medicamentos as $medicamento) {
            $med = Medicamento::create($medicamento);
            $medicamentosCreados[] = $med;
        }

        // =========================
        // 5. CREAR CITAS MÉDICAS
        // =========================
        $this->command->info('📅 Creando citas médicas...');
        
        $citasData = [
            [
                'paciente_id' => $pacientes[0]->id,
                'medico_id' => $medico1->id,
                'fecha' => now()->addDays(1)->setTime(10, 0),
                'estado' => 'confirmada',
                'motivo' => 'Control de hipertensión arterial'
            ],
            [
                'paciente_id' => $pacientes[1]->id,
                'medico_id' => $medico2->id,
                'fecha' => now()->addDays(2)->setTime(14, 30),
                'estado' => 'pendiente',
                'motivo' => 'Consulta por dolor abdominal'
            ],
            [
                'paciente_id' => $pacientes[0]->id,
                'medico_id' => $medico1->id,
                'fecha' => now()->subDays(5)->setTime(9, 0),
                'estado' => 'realizada',
                'motivo' => 'Consulta cardiológica de rutina'
            ],
            [
                'paciente_id' => $pacientes[2]->id,
                'medico_id' => $medico2->id,
                'fecha' => now()->subDays(3)->setTime(11, 0),
                'estado' => 'realizada',
                'motivo' => 'Chequeo médico general'
            ],
            [
                'paciente_id' => $pacientes[3]->id,
                'medico_id' => $medico1->id,
                'fecha' => now()->subDays(1)->setTime(15, 30),
                'estado' => 'realizada',
                'motivo' => 'Seguimiento post-operatorio'
            ],
        ];

        $citas = [];
        foreach ($citasData as $citaData) {
            $cita = Cita::create($citaData);
            $citas[] = $cita;
        }

        // =========================
        // 6. CREAR HISTORIALES CLÍNICOS Y TRATAMIENTOS
        // =========================
        $this->command->info('📋 Creando historiales clínicos...');
        
        // Solo para las citas realizadas
        $citasRealizadas = array_filter($citas, function($cita) {
            return $cita->estado === 'realizada';
        });
        $citasRealizadas = array_values($citasRealizadas); // Reindexar array

        $historialesData = [
            [
                'cita' => $citasRealizadas[0],
                'diagnostico' => 'Hipertensión arterial grado I. Control adecuado con medicación actual.',
                'observaciones' => 'Paciente con buen control de presión arterial. Continuar con tratamiento. Próximo control en 3 meses.',
                'tratamiento' => 'Continuación de tratamiento antihipertensivo',
                'medicamentos' => [2, 3] // Losartán y Atorvastatina
            ],
            [
                'cita' => $citasRealizadas[1],
                'diagnostico' => 'Gastritis aguda. Síndrome dispéptico funcional.',
                'observaciones' => 'Paciente refiere mejoría de síntomas abdominales. Se recomienda dieta blanda y evitar irritantes gástricos.',
                'tratamiento' => 'Tratamiento para gastritis y protección gástrica',
                'medicamentos' => [4] // Omeprazol
            ],
            [
                'cita' => $citasRealizadas[2],
                'diagnostico' => 'Recuperación post-quirúrgica satisfactoria. Sin complicaciones.',
                'observaciones' => 'Herida quirúrgica en proceso de cicatrización normal. Sin signos de infección. Paciente puede retomar actividades normales gradualmente.',
                'tratamiento' => 'Cuidados post-operatorios y prevención de infecciones',
                'medicamentos' => [0, 6] // Paracetamol y Amoxicilina
            ]
        ];

        foreach ($historialesData as $index => $historialData) {
            $historial = HistorialClinico::create([
                'paciente_id' => $historialData['cita']->paciente_id,
                'cita_id' => $historialData['cita']->id,
                'diagnostico' => $historialData['diagnostico'],
                'observaciones' => $historialData['observaciones'],
                'created_at' => $historialData['cita']->fecha,
            ]);

            // Crear tratamiento
            $tratamiento = Tratamiento::create([
                'historial_id' => $historial->id,
                'descripcion' => $historialData['tratamiento'],
                'fecha_inicio' => $historialData['cita']->fecha->toDateString(),
                'fecha_fin' => $historialData['cita']->fecha->addDays(30)->toDateString(),
            ]);

            // Crear recetas médicas
            foreach ($historialData['medicamentos'] as $medicamentoIndex) {
                $medicamento = $medicamentosCreados[$medicamentoIndex];
                RecetaMedica::create([
                    'tratamiento_id' => $tratamiento->id,
                    'medicamento_id' => $medicamento->id,
                    'dosis' => $medicamento->dosis_recomendada,
                    'frecuencia' => 'Según indicación médica',
                    'duracion' => '30 días',
                ]);
            }
        }

        // =========================
        // 7. CREAR EXÁMENES
        // =========================
        $this->command->info('🔬 Creando exámenes...');
        
        $examenes = [
            [
                'paciente_id' => $pacientes[0]->id,
                'historial_id' => HistorialClinico::where('paciente_id', $pacientes[0]->id)->first()->id,
                'tipo' => 'Electrocardiograma',
                'resultado' => 'Ritmo sinusal normal. Sin alteraciones significativas.',
                'fecha' => now()->subDays(5)
            ],
            [
                'paciente_id' => $pacientes[2]->id,
                'historial_id' => HistorialClinico::where('paciente_id', $pacientes[2]->id)->first()->id,
                'tipo' => 'Endoscopia digestiva alta',
                'resultado' => 'Gastritis crónica leve. Mucosa gástrica con signos inflamatorios leves.',
                'fecha' => now()->subDays(3)
            ],
            [
                'paciente_id' => $pacientes[1]->id,
                'tipo' => 'Hemograma completo',
                'resultado' => 'Valores dentro de parámetros normales. Hb: 14.2 g/dL, Leucocitos: 7,200/μL',
                'fecha' => now()->subDays(7)
            ],
            [
                'paciente_id' => $pacientes[3]->id,
                'historial_id' => HistorialClinico::where('paciente_id', $pacientes[3]->id)->first()->id,
                'tipo' => 'Radiografía de tórax',
                'resultado' => 'Campos pulmonares limpios. Silueta cardiovascular normal.',
                'fecha' => now()->subDays(1)
            ],
        ];

        foreach ($examenes as $examenData) {
            Examen::create($examenData);
        }

        // =========================
        // 8. CREAR FACTURAS Y PAGOS
        // =========================
        $this->command->info('💰 Creando facturas y pagos...');
        
        foreach ($pacientes as $index => $paciente) {
            // Crear factura para cada paciente
            $factura = Factura::create([
                'paciente_id' => $paciente->id,
                'monto' => rand(50000, 300000), // Entre $50,000 y $300,000
                'fecha' => now()->subDays(rand(1, 10)),
                'estado' => $index < 3 ? 'pagada' : 'pendiente',
            ]);

            // Crear pago solo para facturas pagadas
            if ($factura->estado === 'pagada') {
                Pago::create([
                    'factura_id' => $factura->id,
                    'monto' => $factura->monto,
                    'fecha' => $factura->fecha->addDays(1),
                    'metodo' => ['efectivo', 'tarjeta_credito', 'transferencia'][rand(0, 2)],
                ]);
            }
        }

        // =========================
        // 9. CREAR NOTIFICACIONES
        // =========================
        $this->command->info('🔔 Creando notificaciones...');
        
        $notificaciones = [
            [
                'user_id' => $doctor1->id,
                'mensaje' => 'Tiene una cita programada mañana a las 10:00 AM con María Elena Pérez',
                'estado' => 'pendiente'
            ],
            [
                'user_id' => $doctor2->id,
                'mensaje' => 'Recordatorio: Cita pendiente pasado mañana a las 2:30 PM con Roberto José Silva',
                'estado' => 'pendiente'
            ],
            [
                'user_id' => $pacientes[0]->user_id,
                'mensaje' => 'Su cita con la Dra. Ana María González ha sido confirmada para mañana a las 10:00 AM',
                'estado' => 'enviado'
            ],
            [
                'user_id' => $pacientes[1]->user_id,
                'mensaje' => 'Recordatorio: Debe tomar sus medicamentos según la prescripción médica',
                'estado' => 'leido'
            ],
            [
                'user_id' => $admin->id,
                'mensaje' => 'Reporte mensual generado exitosamente. 15 citas realizadas este mes.',
                'estado' => 'leido'
            ],
        ];

        foreach ($notificaciones as $notificacionData) {
            Notificacion::create($notificacionData);
        }

        // =========================
        // 10. CREAR AUDITORÍAS
        // =========================
        $this->command->info('📝 Creando registros de auditoría...');
        
        $auditorias = [
            [
                'user_id' => $admin->id,
                'accion' => 'LOGIN',
                'descripcion' => 'Inicio de sesión exitoso desde IP 192.168.1.100',
                'fecha' => now()->subHours(2)
            ],
            [
                'user_id' => $doctor1->id,
                'accion' => 'CREATE_HISTORIAL',
                'descripcion' => 'Creó historial clínico para paciente María Elena Pérez',
                'fecha' => now()->subDays(5)
            ],
            [
                'user_id' => $doctor2->id,
                'accion' => 'UPDATE_CITA',
                'descripcion' => 'Actualizó estado de cita a "realizada"',
                'fecha' => now()->subDays(3)
            ],
            [
                'user_id' => $admin->id,
                'accion' => 'GENERATE_REPORT',
                'descripcion' => 'Generó reporte mensual de citas médicas',
                'fecha' => now()->subDays(1)
            ],
            [
                'user_id' => $pacientes[0]->user_id,
                'accion' => 'LOGIN',
                'descripcion' => 'Inicio de sesión desde aplicación móvil',
                'fecha' => now()->subMinutes(30)
            ]
        ];

        foreach ($auditorias as $auditoriaData) {
            Auditoria::create($auditoriaData);
        }

        // =========================
        // RESUMEN FINAL
        // =========================
        $this->command->info('');
        $this->command->info('✅ ¡Datos de prueba creados exitosamente!');
        $this->command->info('');
        $this->command->info('👥 USUARIOS CREADOS:');
        $this->command->info('   🔑 Admin: admin@epsapi.com / admin123');
        $this->command->info('   👨‍⚕️ Dr. Ana González: ana.gonzalez@epsapi.com / doctor123');
        $this->command->info('   👨‍⚕️ Dr. Carlos Ramírez: carlos.ramirez@epsapi.com / doctor123');
        $this->command->info('   👤 5 Pacientes: [email] / paciente123');
        $this->command->info('');
        $this->command->info('📊 DATOS CREADOS:');
        $this->command->info('   • 8 Usuarios (1 admin + 2 doctores + 5 pacientes)');
        $this->command->info('   • 2 Médicos con especialidades');
        $this->command->info('   • 10 Horarios médicos');
        $this->command->info('   • 7 Medicamentos');
        $this->command->info('   • 5 Citas médicas (3 realizadas, 1 confirmada, 1 pendiente)');
        $this->command->info('   • 3 Historiales clínicos con tratamientos');
        $this->command->info('   • 7 Recetas médicas');
        $this->command->info('   • 4 Exámenes médicos');
        $this->command->info('   • 5 Facturas (3 pagadas, 2 pendientes)');
        $this->command->info('   • 3 Pagos realizados');
        $this->command->info('   • 5 Notificaciones');
        $this->command->info('   • 5 Registros de auditoría');
        $this->command->info('');
        $this->command->info('🎯 ¡El sistema está listo para pruebas completas!');
    }
}
