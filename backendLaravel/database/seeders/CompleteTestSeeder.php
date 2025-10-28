<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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

class CompleteTestSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 INICIANDO SEEDER COMPLETO DE PRUEBA...');
        
        // Limpiar datos existentes (opcional)
        $this->command->info('🗑️ Limpiando datos existentes...');
        $this->clearExistingData();

        // Ejecutar seeders en orden
        $this->seedRoles();
        $this->seedEspecialidades();
        $this->seedUsers();
        $this->seedMedicos();
        $this->seedPacientes();
        $this->seedHorariosMedicos();
        $this->seedMedicamentos();
        $this->seedCitas();
        $this->seedHistoriales();
        $this->seedExamenes();
        $this->seedFacturas();
        $this->seedNotificaciones();
        $this->seedAuditorias();

        $this->showFinalSummary();
    }

    private function clearExistingData()
    {
        // Desactivar verificación de llaves foráneas temporalmente
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Truncar tablas en orden inverso de dependencias
        DB::table('auditorias')->truncate();
        DB::table('notificaciones')->truncate();
        DB::table('pagos')->truncate();
        DB::table('facturas')->truncate();
        DB::table('examenes')->truncate();
        DB::table('receta_medica')->truncate();
        DB::table('tratamientos')->truncate();
        DB::table('historial_clinico')->truncate();
        DB::table('citas')->truncate();
        DB::table('horarios_medicos')->truncate();
        DB::table('medicamentos')->truncate();
        DB::table('medico_especialidad')->truncate();
        DB::table('medicos')->truncate();
        DB::table('pacientes')->truncate();
        DB::table('user_roles')->truncate();
        DB::table('users')->truncate();
        // No truncar roles ni especialidades para mantener datos base
        
        // Reactivar verificación de llaves foráneas
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    private function seedRoles()
    {
        $this->command->info('👥 Creando roles...');
        
        $roles = [
            ['name' => 'admin'],
            ['name' => 'doctor'],
            ['name' => 'paciente'],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate($roleData);
        }
    }

    private function seedEspecialidades()
    {
        $this->command->info('🏥 Creando especialidades médicas...');
        
        $especialidades = [
            'Medicina General',
            'Cardiología', 
            'Dermatología',
            'Ginecología',
            'Oftalmología',
            'Pediatría',
            'Psiquiatría',
            'Radiología',
            'Traumatología',
            'Urología',
            'Neurología',
            'Endocrinología'
        ];

        foreach ($especialidades as $especialidad) {
            Especialidad::firstOrCreate(['nombre' => $especialidad]);
        }
    }

    private function seedUsers()
    {
        $this->command->info('👤 Creando usuarios...');
        
        // Admin
        $admin = User::create([
            'name' => 'Juan Carlos Administrador',
            'email' => 'admin@epsapi.com',
            'password' => Hash::make('admin123'),
            'status' => 'active',
        ]);
        $admin->roles()->attach(Role::where('name', 'admin')->first());

        // Doctores
        $doctores = [
            [
                'name' => 'Dra. Ana María González',
                'email' => 'ana.gonzalez@epsapi.com',
                'especialidad' => 'Cardiología',
                'registro' => 'MP-12345'
            ],
            [
                'name' => 'Dr. Carlos Eduardo Ramírez',
                'email' => 'carlos.ramirez@epsapi.com',
                'especialidad' => 'Medicina General',
                'registro' => 'MP-67890'
            ],
            [
                'name' => 'Dra. Laura Patricia Silva',
                'email' => 'laura.silva@epsapi.com',
                'especialidad' => 'Pediatría',
                'registro' => 'MP-11223'
            ]
        ];

        $doctorRole = Role::where('name', 'doctor')->first();
        foreach ($doctores as $doctorData) {
            $doctor = User::create([
                'name' => $doctorData['name'],
                'email' => $doctorData['email'],
                'password' => Hash::make('doctor123'),
                'status' => 'active',
            ]);
            $doctor->roles()->attach($doctorRole);
            $doctor->doctorData = $doctorData; // Para usar después
            $this->doctores[] = $doctor;
        }

        // Pacientes
        $pacientes = [
            [
                'name' => 'María Elena Pérez',
                'email' => 'maria.perez@gmail.com',
                'password' => '12345678', // Contraseña fácil de recordar
                'documento' => '12345678',
                'telefono' => '555-0001',
                'direccion' => 'Calle 123 #45-67, Bogotá',
                'fecha_nacimiento' => '1985-03-15',
                'genero' => 'F'
            ],
            [
                'name' => 'Roberto José Silva',
                'email' => 'roberto.silva@gmail.com',
                'password' => '87654321', // Usa el mismo documento como contraseña
                'documento' => '87654321',
                'telefono' => '555-0002',
                'direccion' => 'Carrera 98 #12-34, Medellín',
                'fecha_nacimiento' => '1978-07-22',
                'genero' => 'M'
            ],
            [
                'name' => 'Carmen Rosa López',
                'email' => 'carmen.lopez@yahoo.com',
                'password' => '11223344', // Usa el mismo documento como contraseña
                'documento' => '11223344',
                'telefono' => '555-0003',
                'direccion' => 'Avenida 45 #78-90, Cali',
                'fecha_nacimiento' => '1992-11-08',
                'genero' => 'F'
            ],
            [
                'name' => 'José Luis Martínez',
                'email' => 'jose.martinez@hotmail.com',
                'password' => '44332211', // Usa el mismo documento como contraseña
                'documento' => '44332211',
                'telefono' => '555-0004',
                'direccion' => 'Calle 67 #23-45, Barranquilla',
                'fecha_nacimiento' => '1965-12-03',
                'genero' => 'M'
            ],
            [
                'name' => 'Laura Sofía Herrera',
                'email' => 'laura.herrera@gmail.com',
                'password' => '55667788', // Usa el mismo documento como contraseña
                'documento' => '55667788',
                'telefono' => '555-0005',
                'direccion' => 'Transversal 12 #34-56, Bucaramanga',
                'fecha_nacimiento' => '1990-01-25',
                'genero' => 'F'
            ]
        ];

        $pacienteRole = Role::where('name', 'paciente')->first();
        foreach ($pacientes as $pacienteData) {
            $user = User::create([
                'name' => $pacienteData['name'],
                'email' => $pacienteData['email'],
                'password' => Hash::make($pacienteData['password']), // Usar la contraseña del array
                'status' => 'active',
            ]);
            $user->roles()->attach($pacienteRole);
            $user->pacienteData = $pacienteData; // Para usar después
            $this->pacientes[] = $user;
        }
    }

    private function seedMedicos()
    {
        $this->command->info('👨‍⚕️ Creando perfiles médicos...');
        
        foreach ($this->doctores as $doctor) {
            $especialidad = Especialidad::where('nombre', $doctor->doctorData['especialidad'])->first();
            
            $medico = Medico::create([
                'user_id' => $doctor->id,
                'especialidad' => $doctor->doctorData['especialidad'],
                'registro_profesional' => $doctor->doctorData['registro'],
                'telefono' => '555-' . rand(1000, 9999),
            ]);
            
            if ($especialidad) {
                $medico->especialidades()->attach($especialidad);
            }
        }
    }

    private function seedPacientes()
    {
        $this->command->info('🏥 Creando perfiles de pacientes...');
        
        foreach ($this->pacientes as $user) {
            Paciente::create([
                'user_id' => $user->id,
                'documento' => $user->pacienteData['documento'],
                'telefono' => $user->pacienteData['telefono'],
                'direccion' => $user->pacienteData['direccion'],
                'fecha_nacimiento' => $user->pacienteData['fecha_nacimiento'],
                'genero' => $user->pacienteData['genero'],
            ]);
        }
    }

    private function seedHorariosMedicos()
    {
        $this->command->info('🕐 Creando horarios médicos...');
        
        $medicos = Medico::all();
        $diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        
        foreach ($medicos as $medico) {
            foreach ($diasSemana as $dia) {
                HorarioMedico::create([
                    'medico_id' => $medico->id,
                    'dia_semana' => $dia,
                    'hora_inicio' => '08:00',
                    'hora_fin' => '17:00',
                ]);
            }
        }
    }

    private function seedMedicamentos()
    {
        $this->command->info('💊 Creando medicamentos...');
        
        $medicamentos = [
            ['nombre' => 'Paracetamol', 'presentacion' => 'Tableta 500mg', 'dosis_recomendada' => '500mg cada 8 horas'],
            ['nombre' => 'Ibuprofeno', 'presentacion' => 'Tableta 400mg', 'dosis_recomendada' => '400mg cada 6 horas'],
            ['nombre' => 'Losartán', 'presentacion' => 'Tableta 50mg', 'dosis_recomendada' => '50mg cada 24 horas'],
            ['nombre' => 'Atorvastatina', 'presentacion' => 'Tableta 20mg', 'dosis_recomendada' => '20mg cada 24 horas'],
            ['nombre' => 'Omeprazol', 'presentacion' => 'Cápsula 20mg', 'dosis_recomendada' => '20mg cada 24 horas'],
            ['nombre' => 'Metformina', 'presentacion' => 'Tableta 850mg', 'dosis_recomendada' => '850mg cada 12 horas'],
            ['nombre' => 'Amoxicilina', 'presentacion' => 'Cápsula 500mg', 'dosis_recomendada' => '500mg cada 8 horas'],
            ['nombre' => 'Aspirina', 'presentacion' => 'Tableta 100mg', 'dosis_recomendada' => '100mg cada 24 horas'],
        ];

        foreach ($medicamentos as $medicamento) {
            Medicamento::create($medicamento);
        }
    }

    private function seedCitas()
    {
        $this->command->info('📅 Creando citas médicas...');
        
        $pacientes = Paciente::all();
        $medicos = Medico::all();
        
        $citasData = [
            // Citas futuras
            [
                'paciente_id' => $pacientes[0]->id,
                'medico_id' => $medicos[0]->id,
                'fecha' => now()->addDays(1)->setTime(10, 0),
                'estado' => 'confirmada',
                'motivo' => 'Control de hipertensión arterial'
            ],
            [
                'paciente_id' => $pacientes[1]->id,
                'medico_id' => $medicos[1]->id,
                'fecha' => now()->addDays(2)->setTime(14, 30),
                'estado' => 'pendiente',
                'motivo' => 'Consulta por dolor abdominal'
            ],
            [
                'paciente_id' => $pacientes[2]->id,
                'medico_id' => $medicos[2]->id,
                'fecha' => now()->addDays(3)->setTime(9, 0),
                'estado' => 'confirmada',
                'motivo' => 'Control pediátrico'
            ],
            // Citas pasadas (realizadas)
            [
                'paciente_id' => $pacientes[0]->id,
                'medico_id' => $medicos[0]->id,
                'fecha' => now()->subDays(5)->setTime(9, 0),
                'estado' => 'realizada',
                'motivo' => 'Consulta cardiológica de rutina'
            ],
            [
                'paciente_id' => $pacientes[3]->id,
                'medico_id' => $medicos[1]->id,
                'fecha' => now()->subDays(3)->setTime(11, 0),
                'estado' => 'realizada',
                'motivo' => 'Chequeo médico general'
            ],
            [
                'paciente_id' => $pacientes[4]->id,
                'medico_id' => $medicos[0]->id,
                'fecha' => now()->subDays(1)->setTime(15, 30),
                'estado' => 'realizada',
                'motivo' => 'Seguimiento post-operatorio'
            ],
        ];

        foreach ($citasData as $citaData) {
            Cita::create($citaData);
        }
    }

    private function seedHistoriales()
    {
        $this->command->info('📋 Creando historiales clínicos...');
        
        $citasRealizadas = Cita::where('estado', 'realizada')->get();
        $medicamentos = Medicamento::all();
        
        foreach ($citasRealizadas as $index => $cita) {
            $historial = HistorialClinico::create([
                'paciente_id' => $cita->paciente_id,
                'cita_id' => $cita->id,
                'diagnostico' => $this->getDiagnosticoByCita($index),
                'observaciones' => $this->getObservacionesByCita($index),
                'created_at' => $cita->fecha,
            ]);

            // Crear tratamiento
            $tratamiento = Tratamiento::create([
                'historial_id' => $historial->id,
                'descripcion' => $this->getTratamientoByCita($index),
                'fecha_inicio' => $cita->fecha->toDateString(),
                'fecha_fin' => $cita->fecha->addDays(30)->toDateString(),
            ]);

            // Crear recetas médicas
            $medicamentosParaTratamiento = $medicamentos->random(rand(1, 3));
            foreach ($medicamentosParaTratamiento as $medicamento) {
                RecetaMedica::create([
                    'tratamiento_id' => $tratamiento->id,
                    'medicamento_id' => $medicamento->id,
                    'dosis' => $medicamento->dosis_recomendada,
                    'frecuencia' => 'Según indicación médica',
                    'duracion' => '30 días',
                ]);
            }
        }
    }

    private function seedExamenes()
    {
        $this->command->info('🔬 Creando exámenes...');
        
        $pacientes = Paciente::all();
        $historiales = HistorialClinico::all();
        
        $examenes = [
            [
                'paciente_id' => $pacientes[0]->id,
                'historial_id' => $historiales->first()->id ?? null,
                'tipo' => 'Electrocardiograma',
                'resultado' => 'Ritmo sinusal normal. Sin alteraciones significativas.',
                'fecha' => now()->subDays(5)
            ],
            [
                'paciente_id' => $pacientes[1]->id,
                'tipo' => 'Hemograma completo',
                'resultado' => 'Valores dentro de parámetros normales. Hb: 14.2 g/dL',
                'fecha' => now()->subDays(7)
            ],
            [
                'paciente_id' => $pacientes[2]->id,
                'tipo' => 'Radiografía de tórax',
                'resultado' => 'Campos pulmonares limpios. Silueta cardiovascular normal.',
                'fecha' => now()->subDays(3)
            ],
        ];

        foreach ($examenes as $examenData) {
            Examen::create($examenData);
        }
    }

    private function seedFacturas()
    {
        $this->command->info('💰 Creando facturas y pagos...');
        
        $pacientes = Paciente::all();
        
        foreach ($pacientes as $index => $paciente) {
            $factura = Factura::create([
                'paciente_id' => $paciente->id,
                'monto' => rand(50000, 300000),
                'fecha' => now()->subDays(rand(1, 10)),
                'estado' => $index < 3 ? 'pagada' : 'pendiente',
            ]);

            if ($factura->estado === 'pagada') {
                Pago::create([
                    'factura_id' => $factura->id,
                    'monto' => $factura->monto,
                    'fecha' => $factura->fecha->addDays(1),
                    'metodo' => ['efectivo', 'tarjeta_credito', 'transferencia'][rand(0, 2)],
                ]);
            }
        }
    }

    private function seedNotificaciones()
    {
        $this->command->info('🔔 Creando notificaciones...');
        
        $users = User::all();
        
        $notificaciones = [
            [
                'user_id' => $users->where('email', 'ana.gonzalez@epsapi.com')->first()->id,
                'mensaje' => 'Tiene una cita programada mañana a las 10:00 AM',
                'estado' => 'pendiente'
            ],
            [
                'user_id' => $users->where('email', 'maria.perez@gmail.com')->first()->id,
                'mensaje' => 'Su cita ha sido confirmada para mañana a las 10:00 AM',
                'estado' => 'enviado'
            ],
            [
                'user_id' => $users->where('email', 'admin@epsapi.com')->first()->id,
                'mensaje' => 'Reporte mensual generado exitosamente',
                'estado' => 'leido'
            ],
        ];

        foreach ($notificaciones as $notificacionData) {
            Notificacion::create($notificacionData);
        }
    }

    private function seedAuditorias()
    {
        $this->command->info('📝 Creando registros de auditoría...');
        
        $users = User::all();
        
        $auditorias = [
            [
                'user_id' => $users->where('email', 'admin@epsapi.com')->first()->id,
                'accion' => 'LOGIN',
                'descripcion' => 'Inicio de sesión exitoso',
                'fecha' => now()->subHours(2)
            ],
            [
                'user_id' => $users->where('email', 'ana.gonzalez@epsapi.com')->first()->id,
                'accion' => 'CREATE_HISTORIAL',
                'descripcion' => 'Creó historial clínico para paciente',
                'fecha' => now()->subDays(1)
            ],
        ];

        foreach ($auditorias as $auditoriaData) {
            Auditoria::create($auditoriaData);
        }
    }

    private function showFinalSummary()
    {
        $this->command->info('');
        $this->command->info('✅ ¡SEEDER COMPLETO EJECUTADO EXITOSAMENTE!');
        $this->command->info('');
        $this->command->info('👥 CREDENCIALES DE ACCESO:');
        $this->command->info('   🔑 Admin: admin@epsapi.com / admin123');
        $this->command->info('   👨‍⚕️ Doctores: [email]@epsapi.com / doctor123');
        $this->command->info('   👤 Pacientes: [email] / [su documento] (ejemplo: maria.perez@gmail.com / 12345678)');
        $this->command->info('');
        $this->command->info('📋 CREDENCIALES ESPECÍFICAS DE PACIENTES:');
        $this->command->info('   • maria.perez@gmail.com / 12345678');
        $this->command->info('   • roberto.silva@gmail.com / 87654321');
        $this->command->info('   • carmen.lopez@yahoo.com / 11223344');
        $this->command->info('   • jose.martinez@hotmail.com / 44332211');
        $this->command->info('   • laura.herrera@gmail.com / 55667788');
        $this->command->info('');
        $this->command->info('📊 DATOS CREADOS:');
        $this->command->info('   • ' . User::count() . ' usuarios');
        $this->command->info('   • ' . Medico::count() . ' médicos');
        $this->command->info('   • ' . Paciente::count() . ' pacientes');
        $this->command->info('   • ' . Especialidad::count() . ' especialidades');
        $this->command->info('   • ' . HorarioMedico::count() . ' horarios médicos');
        $this->command->info('   • ' . Medicamento::count() . ' medicamentos');
        $this->command->info('   • ' . Cita::count() . ' citas médicas');
        $this->command->info('   • ' . HistorialClinico::count() . ' historiales clínicos');
        $this->command->info('   • ' . Examen::count() . ' exámenes');
        $this->command->info('   • ' . Factura::count() . ' facturas');
        $this->command->info('   • ' . Notificacion::count() . ' notificaciones');
        $this->command->info('');
        $this->command->info('🎯 ¡Sistema listo para pruebas!');
    }

    // Métodos auxiliares para datos dinámicos
    private function getDiagnosticoByCita($index)
    {
        $diagnosticos = [
            'Hipertensión arterial grado I. Control adecuado.',
            'Gastritis aguda. Síndrome dispéptico funcional.',
            'Recuperación post-quirúrgica satisfactoria.',
        ];
        return $diagnosticos[$index] ?? 'Consulta médica general.';
    }

    private function getObservacionesByCita($index)
    {
        $observaciones = [
            'Paciente con buen control. Continuar tratamiento.',
            'Mejoría de síntomas. Recomendaciones dietéticas.',
            'Sin complicaciones. Puede retomar actividades normales.',
        ];
        return $observaciones[$index] ?? 'Paciente en buen estado general.';
    }

    private function getTratamientoByCita($index)
    {
        $tratamientos = [
            'Continuación de tratamiento antihipertensivo',
            'Tratamiento para gastritis y protección gástrica',
            'Cuidados post-operatorios y prevención de infecciones',
        ];
        return $tratamientos[$index] ?? 'Tratamiento médico general';
    }

    // Arrays para almacenar datos durante el proceso
    private $doctores = [];
    private $pacientes = [];
}