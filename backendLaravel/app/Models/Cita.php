<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cita extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'paciente_id',
        'medico_id',
        'fecha',
        'estado',
        'motivo',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'datetime',
        ];
    }

    /**
     * Get the paciente associated with the cita.
     */
    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    /**
     * Get the medico associated with the cita.
     */
    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class);
    }
}
