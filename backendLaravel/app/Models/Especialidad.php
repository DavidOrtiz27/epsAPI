<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Especialidad extends Model
{
    use HasFactory;

    protected $table = 'especialidades';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
    ];

    /**
     * Get the medicos associated with the especialidad.
     */
    public function medicos(): BelongsToMany
    {
        return $this->belongsToMany(Medico::class, 'medico_especialidad');
    }
}
