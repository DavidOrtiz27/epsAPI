<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacion extends Model
{
    use HasFactory;

    protected $table = 'notificaciones';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'mensaje',
        'estado',
    ];

    /**
     * Get the user associated with the notificacion.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
