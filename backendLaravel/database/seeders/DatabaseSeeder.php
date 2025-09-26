<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Role;
use App\Models\Paciente;
use App\Models\Medico;
use App\Models\Cita;
use App\Models\Medicamento;
use App\Models\Factura;
use App\Models\Pago;
use App\Models\HistorialClinico;
use App\Models\Tratamiento;
use App\Models\RecetaMedica;
use App\Models\Examen;
use App\Models\Especialidad;
use App\Models\HorarioMedico;
use App\Models\Notificacion;
use App\Models\Auditoria;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // =========================
        // ROLES
        // =========================
        $roles = [
            ['name' => 'admin'],
            ['name' => 'doctor'],
            ['name' => 'paciente'],
        ];
        foreach ($roles as $r) {
            Role::firstOrCreate($r);
        }

        // =========================
        // ADMIN
        // =========================
        $admin = User::firstOrCreate([
            'email' => 'admin@sistema.com',
        ], [
            'name' => 'Admin General',
            'password' => Hash::make('admin123'),
        ]);
        if (!$admin->hasRole('admin')) {
            $admin->roles()->attach(Role::where('name', 'admin')->first());
        }

        // =========================
        // DOCTOR
        // =========================
        $doctor = User::firstOrCreate([
            'email' => 'maria.gonzalez@hospital.com',
        ], [
            'name' => 'Dra. María González',
            'password' => Hash::make('password123'),
        ]);
        if (!$doctor->hasRole('doctor')) {
            $doctor->roles()->attach(Role::where('name', 'doctor')->first());
        }

        Medico::firstOrCreate([
            'user_id' => $doctor->id,
        ], [
            'especialidad' => 'Cardiología',
            'registro_profesional' => 'CARD-123456',
            'telefono' => '3012345678',
        ]);

        // =========================
        // PACIENTES
        // =========================
        $paciente1 = User::firstOrCreate([
            'email' => 'juan.perez@email.com',
        ], [
            'name' => 'Juan Pérez García',
            'password' => Hash::make('password123'),
        ]);
        if (!$paciente1->hasRole('paciente')) {
            $paciente1->roles()->attach(Role::where('name', 'paciente')->first());
        }

        Paciente::firstOrCreate([
            'user_id' => $paciente1->id,
        ], [
            'documento' => '1234567890',
            'telefono' => '3001234567',
            'direccion' => 'Calle 123 #45-67, Bogotá',
            'fecha_nacimiento' => '1990-05-15',
            'genero' => 'M',
        ]);

        $paciente2 = User::firstOrCreate([
            'email' => 'laura.martinez@email.com',
        ], [
            'name' => 'Laura Martínez',
            'password' => Hash::make('password123'),
        ]);
        if (!$paciente2->hasRole('paciente')) {
            $paciente2->roles()->attach(Role::where('name', 'paciente')->first());
        }

        Paciente::firstOrCreate([
            'user_id' => $paciente2->id,
        ], [
            'documento' => '9876543210',
            'telefono' => '3209876543',
            'direccion' => 'Carrera 45 #12-34, Medellín',
            'fecha_nacimiento' => '1995-08-20',
            'genero' => 'F',
        ]);

        // =========================
        // CITAS
        // =========================
        Cita::create([
            'paciente_id' => 1,
            'medico_id' => 1,
            'fecha' => '2025-09-20 10:00:00',
            'estado' => 'pendiente',
        ]);

        Cita::create([
            'paciente_id' => 2,
            'medico_id' => 1,
            'fecha' => '2025-09-21 14:00:00',
            'estado' => 'confirmada',
        ]);

        // =========================
        // HISTORIAL MÉDICO
        // =========================
        $historial = HistorialClinico::firstOrCreate([
            'paciente_id' => 1,
            'diagnostico' => 'Hipertensión arterial',
        ], [
            'observaciones' => 'Se recomienda control cada 3 meses.',
            'created_at' => now(),
        ]);

        // =========================
        // TRATAMIENTO
        // =========================
        $tratamiento = Tratamiento::firstOrCreate([
            'historial_id' => $historial->id,
            'descripcion' => 'Tratamiento con medicamentos antihipertensivos',
        ], [
            'fecha_inicio' => '2025-09-16',
            'fecha_fin' => '2025-12-16',
        ]);

        // =========================
        // MEDICAMENTOS
        // =========================
        $med1 = Medicamento::firstOrCreate([
            'nombre' => 'Losartán',
        ], [
            'presentacion' => '50mg tabletas',
            'dosis_recomendada' => '1 tableta diaria',
        ]);

        $med2 = Medicamento::firstOrCreate([
            'nombre' => 'Paracetamol',
        ], [
            'presentacion' => '500mg tabletas',
            'dosis_recomendada' => '1 tableta cada 8 horas',
        ]);

        // =========================
        // RECETA MÉDICA
        // =========================
        RecetaMedica::create([
            'tratamiento_id' => $tratamiento->id,
            'medicamento_id' => $med1->id,
            'dosis' => '1 tableta',
            'frecuencia' => 'Cada 12 horas',
            'duracion' => '30 días',
        ]);

        // =========================
        // EXAMEN
        // =========================
        Examen::create([
            'paciente_id' => 1,
            'tipo' => 'Electrocardiograma',
            'resultado' => 'Resultados normales',
            'fecha' => '2025-09-10',
        ]);

        // =========================
        // FACTURAS
        // =========================
        $factura1 = Factura::create([
            'paciente_id' => 1,
            'monto' => 150000,
            'estado' => 'pagada',
            'fecha' => '2025-09-12',
        ]);

        $factura2 = Factura::create([
            'paciente_id' => 2,
            'monto' => 200000,
            'estado' => 'pendiente',
            'fecha' => '2025-09-15',
        ]);

        // =========================
        // PAGOS
        // =========================
        Pago::create([
            'factura_id' => $factura1->id,
            'monto' => 150000,
            'fecha' => '2025-09-12',
            'metodo' => 'Tarjeta de crédito',
        ]);

        // =========================
        // ESPECIALIDADES
        // =========================
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
        ];

        foreach ($especialidades as $especialidad) {
            Especialidad::firstOrCreate([
                'nombre' => $especialidad,
            ]);
        }

        // =========================
        // HORARIOS MÉDICOS
        // =========================
        $this->call(HorarioMedicoSeeder::class);

        // =========================
        // NOTIFICACIONES
        // =========================
        Notificacion::create([
            'user_id' => $paciente1->id,
            'mensaje' => 'Su cita ha sido confirmada para el 20 de septiembre a las 10:00',
            'estado' => 'pendiente',
        ]);

        Notificacion::create([
            'user_id' => $paciente2->id,
            'mensaje' => 'Recordatorio: Tiene una cita programada para mañana',
            'estado' => 'pendiente',
        ]);

        Notificacion::create([
            'user_id' => $doctor->id,
            'mensaje' => 'Nuevo paciente registrado en el sistema',
            'estado' => 'leido',
        ]);

        // =========================
        // AUDITORÍAS
        // =========================
        Auditoria::create([
            'user_id' => $admin->id,
            'accion' => 'CREATE_USER',
            'descripcion' => 'Creó usuario paciente: Juan Pérez García',
            'fecha' => now(),
        ]);

        Auditoria::create([
            'user_id' => $doctor->id,
            'accion' => 'CREATE_CITA',
            'descripcion' => 'Agendó cita para paciente Juan Pérez García',
            'fecha' => now(),
        ]);

        Auditoria::create([
            'user_id' => $admin->id,
            'accion' => 'LOGIN',
            'descripcion' => 'Inicio de sesión exitoso',
            'fecha' => now(),
        ]);

        // =========================
        // RELACIONES MÉDICO-ESPECIALIDAD
        // =========================
        $cardiologia = Especialidad::where('nombre', 'Cardiología')->first();
        if ($cardiologia) {
            DB::table('medico_especialidad')->insert([
                'medico_id' => 1,
                'especialidad_id' => $cardiologia->id,
            ]);
        }
    }
}
