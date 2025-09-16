<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tratamiento extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'historial_id',
        'descripcion',
        'fecha_inicio',
        'fecha_fin',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
        ];
    }

    /**
     * Get the historial clinico associated with the tratamiento.
     */
    public function historialClinico(): BelongsTo
    {
        return $this->belongsTo(HistorialClinico::class, 'historial_id');
    }

    /**
     * Get the paciente associated with the tratamiento through historial clinico.
     */
    public function paciente()
    {
        return $this->hasOneThrough(
            Paciente::class,
            HistorialClinico::class,
            'id', // Foreign key on historial_clinico table
            'id', // Foreign key on pacientes table
            'historial_id', // Local key on tratamientos table
            'paciente_id' // Local key on historial_clinico table
        );
    }

    /**
     * Get the receta medica for the tratamiento.
     */
    public function recetaMedica(): HasMany
    {
        return $this->hasMany(RecetaMedica::class);
    }
}
