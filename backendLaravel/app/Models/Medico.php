<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Medico extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'especialidad',
        'registro_profesional',
        'telefono',
    ];

    /**
     * Get the user associated with the medico.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the citas for the medico.
     */
    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class);
    }

    /**
     * Get the especialidades for the medico.
     */
    public function especialidades(): BelongsToMany
    {
        return $this->belongsToMany(Especialidad::class, 'medico_especialidad');
    }

    /**
     * Get the horarios medicos for the medico.
     */
    public function horariosMedicos(): HasMany
    {
        return $this->hasMany(HorarioMedico::class);
    }
}
