<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use App\Models\User;

class ValidActiveUserEmail implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Verificar que el valor no esté vacío
        if (empty($value)) {
            $fail('El correo electrónico es obligatorio.');
            return;
        }

        // Normalizar el email
        $email = strtolower(trim($value));

        // Verificar formato básico de email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $fail('El formato del correo electrónico no es válido.');
            return;
        }

        // Verificar longitud máxima
        if (strlen($email) > 255) {
            $fail('El correo electrónico no puede tener más de 255 caracteres.');
            return;
        }

        // Verificaciones adicionales de formato
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            $fail('El formato del correo electrónico no es válido.');
            return;
        }

        [$localPart, $domain] = $parts;

        // Verificar parte local (antes del @)
        if (empty($localPart) || strlen($localPart) > 64) {
            $fail('La parte local del correo electrónico no es válida.');
            return;
        }

        // Verificar dominio
        if (empty($domain) || strlen($domain) > 253) {
            $fail('El dominio del correo electrónico no es válido.');
            return;
        }

        // Verificar que el dominio tiene al menos un punto
        if (!str_contains($domain, '.')) {
            $fail('El dominio del correo electrónico debe contener al menos un punto.');
            return;
        }

        // Verificar que el usuario existe y está activo
        if (!User::isValidEmailForReset($email)) {
            $fail('Este correo electrónico no está registrado en nuestro sistema o la cuenta está inactiva.');
            return;
        }
    }
}
