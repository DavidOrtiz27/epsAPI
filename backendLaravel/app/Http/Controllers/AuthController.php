<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Rules\ValidActiveUserEmail;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Validación básica primero
        $basicValidator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string',
            'documento' => 'required|string|max:20',
            'telefono' => 'required|string|max:20',
            'direccion' => 'required|string|max:255',
            'fecha_nacimiento' => 'required|date|before:today',
            'genero' => 'required|in:M,F',
        ]);

        if ($basicValidator->fails()) {
            return response()->json([
                'message' => 'Faltan datos requeridos o son inválidos',
                'errors' => $basicValidator->errors()
            ], 422);
        }

        // Validación personalizada de contraseña para registro
        $password = $request->password;
        $passwordErrors = [];
        $passwordRequirements = [];

        // Verificar longitud mínima
        if (strlen($password) < 8) {
            $passwordErrors[] = 'La contraseña debe tener al menos 8 caracteres';
            $passwordRequirements[] = '❌ Mínimo 8 caracteres (actual: ' . strlen($password) . ')';
        } else {
            $passwordRequirements[] = '✅ Mínimo 8 caracteres';
        }

        // Verificar letra minúscula
        if (!preg_match('/[a-z]/', $password)) {
            $passwordErrors[] = 'La contraseña debe contener al menos una letra minúscula (a-z)';
            $passwordRequirements[] = '❌ Al menos una letra minúscula (a-z)';
        } else {
            $passwordRequirements[] = '✅ Contiene letra minúscula';
        }

        // Verificar letra mayúscula
        if (!preg_match('/[A-Z]/', $password)) {
            $passwordErrors[] = 'La contraseña debe contener al menos una letra MAYÚSCULA (A-Z)';
            $passwordRequirements[] = '❌ Al menos una letra MAYÚSCULA (A-Z)';
        } else {
            $passwordRequirements[] = '✅ Contiene letra mayúscula';
        }

        // Verificar número
        if (!preg_match('/\d/', $password)) {
            $passwordErrors[] = 'La contraseña debe contener al menos un número (0-9)';
            $passwordRequirements[] = '❌ Al menos un número (0-9)';
        } else {
            $passwordRequirements[] = '✅ Contiene número';
        }

        if (!empty($passwordErrors)) {
            return response()->json([
                'message' => 'La contraseña no cumple con los requisitos de seguridad',
                'errors' => [
                    'password' => $passwordErrors
                ],
                'password_requirements' => $passwordRequirements,
                'suggestions' => [
                    'Ejemplo de contraseña válida: "MiClave123"',
                    'Asegúrate de incluir: letras minúsculas, MAYÚSCULAS y números',
                    'Evita usar solo minúsculas o solo números'
                ]
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'active',
        ]);

        // New users automatically get the "paciente" role
        $pacienteRole = \App\Models\Role::where('name', 'paciente')->first();
        if ($pacienteRole) {
            $user->roles()->attach($pacienteRole);
        }

        // Create paciente profile for the new user
        \App\Models\Paciente::create([
            'user_id' => $user->id,
            'documento' => $request->documento,
            'telefono' => $request->telefono,
            'direccion' => $request->direccion,
            'fecha_nacimiento' => $request->fecha_nacimiento,
            'genero' => $request->genero,
        ]);

        // Log the registration
        \App\Models\Auditoria::create([
            'user_id' => $user->id,
            'accion' => 'Registro de usuario',
            'descripcion' => "Nuevo usuario registrado: {$user->name} ({$user->email})",
        ]);

        $token = $user->createToken('API Token')->plainTextToken;

        // Load paciente relationship for the new patient
        $user->load('paciente');

        return response()->json([
            'user' => $user->load('roles'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('API Token')->plainTextToken;

        // Load paciente relationship for patients
        if ($user->hasRole('paciente')) {
            $user->load('paciente');
        }

        return response()->json([
            'user' => $user->load('roles'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('roles'));
    }

    /**
     * Update user email
     */
    public function updateEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255|unique:users,email,' . $request->user()->id,
            'password' => 'required|string', // Current password confirmation
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Contraseña actual incorrecta'], 422);
        }

        $user->update(['email' => $request->email]);

        // Log the email change
        \App\Models\Auditoria::create([
            'user_id' => $user->id,
            'accion' => 'Cambio de email',
            'descripcion' => "Email cambiado de {$user->getOriginal('email')} a {$request->email}",
        ]);

        return response()->json([
            'message' => 'Email actualizado correctamente',
            'user' => $user->load('roles')
        ]);
    }

    /**
     * Update user password
     */
    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Contraseña actual incorrecta'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        // Log the password change
        \App\Models\Auditoria::create([
            'user_id' => $user->id,
            'accion' => 'Cambio de contraseña',
            'descripcion' => 'Contraseña actualizada',
        ]);

        return response()->json(['message' => 'Contraseña actualizada correctamente']);
    }

    /**
     * Create a new doctor (only for admins and superadmins)
     */
    public function createDoctor(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'especialidad' => 'nullable|string|max:100',
            'registro_profesional' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $currentUser = Auth::user();

        // Only admins can create doctors
        if (!$currentUser->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'active',
        ]);

        // Assign doctor role
        $doctorRole = \App\Models\Role::where('name', 'doctor')->first();
        if ($doctorRole) {
            $user->roles()->attach($doctorRole);
        }

        // Create doctor profile
        \App\Models\Medico::create([
            'user_id' => $user->id,
            'especialidad' => $request->especialidad,
            'registro_profesional' => $request->registro_profesional,
            'telefono' => $request->telefono,
        ]);

        // Log the doctor creation
        \App\Models\Auditoria::create([
            'user_id' => $currentUser->id,
            'accion' => 'Creación de doctor',
            'descripcion' => "Doctor creado: {$user->name} ({$user->email}) por {$currentUser->name}",
        ]);

        return response()->json([
            'user' => $user->load('roles'),
            'message' => 'Doctor created successfully'
        ], 201);
    }

    /**
     * Send password reset link to user's email
     */
    public function forgotPassword(Request $request)
    {
        // Validaciones mejoradas con regla personalizada
        $validator = Validator::make($request->all(), [
            'email' => [
                'required',
                'string',
                new ValidActiveUserEmail()
            ]
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        // Normalizar el email (convertir a minúsculas y quitar espacios)
        $email = strtolower(trim($request->email));
        
        // Verificar que el usuario existe y está activo
        $user = User::where('email', $email)
                   ->where('status', 'active') // Solo usuarios activos
                   ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Este correo electrónico no está registrado o la cuenta está inactiva'
            ], 422);
        }

        // Verificar que no se han enviado demasiados emails recientemente (rate limiting)
        $recentTokens = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('created_at', '>', Carbon::now()->subMinutes(5)) // Últimos 5 minutos
            ->count();

        if ($recentTokens >= 3) {
            return response()->json([
                'message' => 'Has solicitado demasiados códigos de recuperación. Espera 5 minutos antes de solicitar otro.'
            ], 429); // Too Many Requests
        }

        // Delete any existing tokens for this email (usar el email normalizado)
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Generate a random token
        $token = Str::random(64);

        // Store the token in the database (usar email normalizado)
        DB::table('password_reset_tokens')->insert([
            'email' => $email,
            'token' => Hash::make($token),
            'created_at' => Carbon::now()
        ]);

        // Send email with the reset link
        try {
            Mail::send('emails.password-reset', [
                'token' => $token,
                'user' => $user,
                'email' => $email
            ], function ($message) use ($email, $user) {
                $message->to($email);
                $message->subject('Recuperación de Contraseña - EPS ' . config('app.name'));
                $message->from(config('mail.from.address'), config('mail.from.name'));
            });

            // Log the password reset request
            \App\Models\Auditoria::create([
                'user_id' => $user->id,
                'accion' => 'Solicitud de recuperación de contraseña',
                'descripcion' => "Solicitud de recuperación de contraseña para: {$user->email}",
            ]);

            return response()->json([
                'message' => 'Se ha enviado un enlace de recuperación a tu correo electrónico'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar el correo electrónico',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset password using token
     */
    public function resetPassword(Request $request)
    {
        // Validación básica primero
        $basicValidator = Validator::make($request->all(), [
            'email' => [
                'required',
                'string',
                new ValidActiveUserEmail()
            ],
            'token' => [
                'required',
                'string',
                'size:64'
            ],
            'password' => 'required|string',
            'password_confirmation' => 'required|string'
        ]);

        if ($basicValidator->fails()) {
            return response()->json([
                'message' => 'Faltan datos requeridos',
                'errors' => $basicValidator->errors()
            ], 422);
        }

        // Validación personalizada de contraseña con mensajes detallados
        $password = $request->password;
        $passwordErrors = [];
        $passwordRequirements = [];

        // Verificar longitud mínima
        if (strlen($password) < 8) {
            $passwordErrors[] = 'La contraseña debe tener al menos 8 caracteres';
            $passwordRequirements[] = '❌ Mínimo 8 caracteres (actual: ' . strlen($password) . ')';
        } else {
            $passwordRequirements[] = '✅ Mínimo 8 caracteres';
        }

        // Verificar longitud máxima
        if (strlen($password) > 128) {
            $passwordErrors[] = 'La contraseña no puede tener más de 128 caracteres';
            $passwordRequirements[] = '❌ Máximo 128 caracteres (actual: ' . strlen($password) . ')';
        } else {
            $passwordRequirements[] = '✅ Máximo 128 caracteres';
        }

        // Verificar letra minúscula
        if (!preg_match('/[a-z]/', $password)) {
            $passwordErrors[] = 'La contraseña debe contener al menos una letra minúscula (a-z)';
            $passwordRequirements[] = '❌ Al menos una letra minúscula (a-z)';
        } else {
            $passwordRequirements[] = '✅ Contiene letra minúscula';
        }

        // Verificar letra mayúscula
        if (!preg_match('/[A-Z]/', $password)) {
            $passwordErrors[] = 'La contraseña debe contener al menos una letra MAYÚSCULA (A-Z)';
            $passwordRequirements[] = '❌ Al menos una letra MAYÚSCULA (A-Z)';
        } else {
            $passwordRequirements[] = '✅ Contiene letra mayúscula';
        }

        // Verificar número
        if (!preg_match('/\d/', $password)) {
            $passwordErrors[] = 'La contraseña debe contener al menos un número (0-9)';
            $passwordRequirements[] = '❌ Al menos un número (0-9)';
        } else {
            $passwordRequirements[] = '✅ Contiene número';
        }

        // Verificar confirmación de contraseña
        if ($password !== $request->password_confirmation) {
            $passwordErrors[] = 'Las contraseñas no coinciden';
            $passwordRequirements[] = '❌ Las contraseñas deben coincidir';
        } else {
            $passwordRequirements[] = '✅ Las contraseñas coinciden';
        }

        if (!empty($passwordErrors)) {
            return response()->json([
                'message' => 'La contraseña no cumple con los requisitos de seguridad',
                'errors' => [
                    'password' => $passwordErrors
                ],
                'password_requirements' => $passwordRequirements,
                'suggestions' => [
                    'Ejemplo de contraseña válida: "MiClave123"',
                    'Asegúrate de incluir: letras minúsculas, MAYÚSCULAS y números',
                    'Evita usar solo minúsculas o solo números'
                ]
            ], 422);
        }

        // Normalizar el email
        $email = strtolower(trim($request->email));
        
        // Verificar que el usuario existe y está activo
        $user = User::where('email', $email)
                   ->where('status', 'active')
                   ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Este correo electrónico no está registrado o la cuenta está inactiva'
            ], 422);
        }

        // Check if token exists and is valid (usar email normalizado)
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'message' => 'Código de verificación inválido o expirado'
            ], 422);
        }

        // Check if token matches
        if (!Hash::check(trim($request->token), $resetRecord->token)) {
            return response()->json([
                'message' => 'Token inválido'
            ], 422);
        }

        // Check if token is not older than 60 minutes
        $tokenCreatedAt = Carbon::parse($resetRecord->created_at);
        if ($tokenCreatedAt->addMinutes(60)->isPast()) {
            // Delete expired token
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            
            return response()->json([
                'message' => 'Código de verificación expirado. Solicita un nuevo código de recuperación'
            ], 422);
        }

        // Verificar que la nueva contraseña no sea igual a la actual
        if (Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'La nueva contraseña debe ser diferente a la contraseña actual'
            ], 422);
        }

        // Update user password
        $user->update(['password' => Hash::make($request->password)]);

        // Delete the token
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Log the password reset
        \App\Models\Auditoria::create([
            'user_id' => $user->id,
            'accion' => 'Contraseña restablecida',
            'descripcion' => "Contraseña restablecida exitosamente para: {$user->email}",
        ]);

        return response()->json([
            'message' => 'Contraseña restablecida exitosamente'
        ]);
    }

}
