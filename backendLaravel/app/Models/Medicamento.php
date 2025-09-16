<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Medicamento extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'presentacion',
        'dosis_recomendada',
        'stock',
    ];

    /**
     * Get the receta medica for the medicamento.
     */
    public function recetaMedica(): HasMany
    {
        return $this->hasMany(RecetaMedica::class);
    }
}
