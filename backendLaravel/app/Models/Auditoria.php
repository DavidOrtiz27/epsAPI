<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Auditoria extends Model
{
    use HasFactory;

    protected $table = 'auditorias';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'accion',
        'descripcion',
        'fecha',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'datetime',
        ];
    }

    /**
     * Get the user associated with the auditoria.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
