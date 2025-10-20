<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Get the paciente associated with the user.
     */
    public function paciente(): HasOne
    {
        return $this->hasOne(Paciente::class);
    }

    /**
     * Get the medico associated with the user.
     */
    public function medico(): HasOne
    {
        return $this->hasOne(Medico::class);
    }

    /**
     * Get the roles associated with the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    /**
     * Check if the user has a specific role.
     */
    public function hasRole(string $role): bool
    {
        return $this->roles()->where('name', $role)->exists();
    }

    /**
     * Check if the user has any of the given roles.
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->roles()->whereIn('name', $roles)->exists();
    }

    /**
     * Check if email is valid and exists in the database
     */
    public static function isValidEmailForReset(string $email): bool
    {
        // Normalizar email
        $email = strtolower(trim($email));
        
        // Verificar formato básico
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        
        // Verificar que existe en la base de datos y está activo
        return self::where('email', $email)
                  ->where('status', 'active')
                  ->exists();
    }

    /**
     * Get active user by email
     */
    public static function getActiveUserByEmail(string $email): ?self
    {
        $email = strtolower(trim($email));
        
        return self::where('email', $email)
                  ->where('status', 'active')
                  ->first();
    }

    /**
     * Scope para filtrar solo usuarios activos
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
