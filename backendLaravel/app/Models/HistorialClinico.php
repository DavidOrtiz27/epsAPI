<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HistorialClinico extends Model
{
    use HasFactory;

    protected $table = 'historial_clinico';

    public $timestamps = false;

    protected $fillable = [
        'paciente_id',
        'cita_id',
        'diagnostico',
        'observaciones',
        'created_at',
    ];

    /**
     * Get the paciente associated with the historial clinico.
     */
    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    /**
     * Get the cita associated with the historial clinico.
     */
    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class);
    }

    /**
     * Get the tratamientos for the historial clinico.
     */
    public function tratamientos(): HasMany
    {
        return $this->hasMany(Tratamiento::class, 'historial_id');
    }

    /**
     * Get the examenes for the historial clinico.
     */
    public function examenes(): HasMany
    {
        return $this->hasMany(Examen::class, 'historial_id');
    }
}
