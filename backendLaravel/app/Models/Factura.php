<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Factura extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'paciente_id',
        'monto',
        'fecha',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'monto' => 'decimal:2',
        ];
    }

    /**
     * Get the paciente associated with the factura.
     */
    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    /**
     * Get the pagos for the factura.
     */
    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }
}
