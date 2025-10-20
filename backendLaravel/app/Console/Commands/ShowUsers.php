<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class ShowUsers extends Command
{
    protected $signature = 'show:users';
    protected $description = 'Show all users with their roles';

    public function handle()
    {
        $this->info('=== USUARIOS CREADOS ===');
        $this->newLine();

        $users = User::with('roles')->get();

        foreach ($users as $user) {
            $roles = $user->roles->pluck('name')->join(', ');
            $this->line("📧 {$user->email}");
            $this->line("   👤 {$user->name}");
            $this->line("   🎭 {$roles}");
            $this->line("   🔑 Contraseña por defecto según rol");
            $this->newLine();
        }

        $this->info('📋 CONTRASEÑAS POR DEFECTO:');
        $this->line('   🔑 Admin: admin123');
        $this->line('   👨‍⚕️ Doctores: doctor123');
        $this->line('   👤 Pacientes: paciente123');
        $this->newLine();

        $this->info('✅ Total de usuarios: ' . $users->count());
    }
}