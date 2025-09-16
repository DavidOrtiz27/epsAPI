<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Paciente extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'documento',
        'telefono',
        'direccion',
        'fecha_nacimiento',
        'genero',
    ];

    protected function casts(): array
    {
        return [
            'fecha_nacimiento' => 'date',
        ];
    }

    /**
     * Get the user associated with the paciente.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the citas for the paciente.
     */
    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class);
    }

    /**
     * Get the historial clinico for the paciente.
     */
    public function historialClinico(): HasMany
    {
        return $this->hasMany(HistorialClinico::class);
    }

    /**
     * Get the examenes for the paciente.
     */
    public function examenes(): HasMany
    {
        return $this->hasMany(Examen::class);
    }

    /**
     * Get the facturas for the paciente.
     */
    public function facturas(): HasMany
    {
        return $this->hasMany(Factura::class);
    }
}
