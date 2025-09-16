<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HorarioMedico extends Model
{
    use HasFactory;

    protected $table = 'horarios_medicos';

    public $timestamps = false;

    protected $fillable = [
        'medico_id',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
    ];

    protected function casts(): array
    {
        return [
            'hora_inicio' => 'datetime:H:i',
            'hora_fin' => 'datetime:H:i',
        ];
    }

    /**
     * Get the medico associated with the horario medico.
     */
    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class);
    }
}
