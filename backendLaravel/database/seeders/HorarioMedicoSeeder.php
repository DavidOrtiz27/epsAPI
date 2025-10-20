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
            // Check if this doctor already has schedules
            if ($doctor->horariosMedicos()->count() > 0) {
                $this->command->info("Doctor {$doctor->user->name} already has schedules. Skipping...");
                continue;
            }

            // Create schedules for 4 specific days only
            $weekdays = ['lunes', 'martes', 'jueves', 'domingo'];

            foreach ($weekdays as $day) {
                HorarioMedico::create([
                    'medico_id' => $doctor->id,
                    'dia_semana' => $day,
                    'hora_inicio' => '08:00',
                    'hora_fin' => '17:00',
                ]);
            }

            $this->command->info("Created 4 schedules for doctor: {$doctor->user->name}");
        }
    }
}
