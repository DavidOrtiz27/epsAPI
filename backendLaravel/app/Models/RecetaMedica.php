<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecetaMedica extends Model
{
    use HasFactory;

    protected $table = 'receta_medica';

    public $timestamps = false;

    protected $fillable = [
        'tratamiento_id',
        'medicamento_id',
        'dosis',
        'frecuencia',
        'duracion',
    ];

    /**
     * Get the tratamiento associated with the receta medica.
     */
    public function tratamiento(): BelongsTo
    {
        return $this->belongsTo(Tratamiento::class);
    }

    /**
     * Get the medicamento associated with the receta medica.
     */
    public function medicamento(): BelongsTo
    {
        return $this->belongsTo(Medicamento::class);
    }
}
