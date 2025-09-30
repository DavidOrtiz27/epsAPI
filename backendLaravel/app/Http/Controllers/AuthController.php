<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
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



}
