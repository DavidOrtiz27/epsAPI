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
     * Get the tratamientos for the historial clinico.
     */
    public function tratamientos(): HasMany
    {
        return $this->hasMany(Tratamiento::class, 'historial_id');
    }
}
