<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\HorarioMedico;
use App\Models\Medico;

class HorarioMedicoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all doctors
        $doctors = Medico::all();

        if ($doctors->isEmpty()) {
            $this->command->info('No doctors found. Please create doctors first.');
            return;
        }

        foreach ($doctors as $doctor) {
            // Create schedules for weekdays (Monday to Friday)
            $weekdays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

            foreach ($weekdays as $day) {
                HorarioMedico::create([
                    'medico_id' => $doctor->id,
                    'dia_semana' => $day,
                    'hora_inicio' => '08:00',
                    'hora_fin' => '17:00',
                ]);
            }

            // Saturday schedule (shorter hours)
            HorarioMedico::create([
                'medico_id' => $doctor->id,
                'dia_semana' => 'sabado',
                'hora_inicio' => '09:00',
                'hora_fin' => '13:00',
            ]);

            $this->command->info("Created schedule for doctor: {$doctor->user->name}");
        }
    }
}
