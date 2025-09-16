<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'factura_id',
        'monto',
        'fecha',
        'metodo',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'monto' => 'decimal:2',
        ];
    }

    /**
     * Get the factura associated with the pago.
     */
    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class);
    }
}
