<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;
use App\Models\Especialidad;

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
            'name' => 'Administrador',
            'password' => Hash::make('admin123'),
        ]);
        if (!$admin->hasRole('admin')) {
            $admin->roles()->attach(Role::where('name', 'admin')->first());
        }

        // =========================
        // ESPECIALIDADES MÉDICAS
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
    }
}
