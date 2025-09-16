<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Examen extends Model
{
    use HasFactory;

    protected $table = 'examenes';

    public $timestamps = false;

    protected $fillable = [
        'paciente_id',
        'tipo',
        'resultado',
        'fecha',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
        ];
    }

    /**
     * Get the paciente associated with the examen.
     */
    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }
}
