<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PacienteController;
use App\Http\Controllers\MedicoController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\HistorialClinicoController;
use App\Http\Controllers\TratamientoController;
use App\Http\Controllers\MedicamentoController;
use App\Http\Controllers\RecetaMedicaController;
use App\Http\Controllers\ExamenController;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\EspecialidadController;
use App\Http\Controllers\HorarioMedicoController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\AuditoriaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// Auth routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// ==========================================
// AUTHENTICATED ROUTES (Require Sanctum token)
// ==========================================

Route::middleware('auth:sanctum')->group(function () {

    // User info
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // ==========================================
    // PATIENT ROUTES (paciente role)
    // ==========================================

    Route::middleware('role:paciente')->group(function () {
        // Patients can view/update their own profile
        Route::get('/pacientes/profile', [PacienteController::class, 'profile']);
        Route::put('/pacientes/profile', [PacienteController::class, 'updateProfile']);

        // Patients can view their own appointments
        Route::get('/pacientes/citas', [CitaController::class, 'misCitas']);
        Route::post('/pacientes/citas', [CitaController::class, 'store']);
        Route::post('/pacientes/citas/{id}/cancelar', [CitaController::class, 'cancelarCita']);

        // Patients can view their own medical history
        Route::get('/pacientes/historial', [HistorialClinicoController::class, 'miHistorial']);

        // Patients can view their own invoices
        Route::get('/pacientes/facturas', [FacturaController::class, 'misFacturas']);
    });

    // ==========================================
    // DOCTOR ROUTES (doctor role)
    // ==========================================

    Route::middleware('role:doctor')->group(function () {
        // Doctors can manage their patients
        Route::get('/medicos/pacientes', [MedicoController::class, 'misPacientes']);
        Route::get('/medicos/pacientes/{pacienteId}/historial', [HistorialClinicoController::class, 'historialPaciente']);

        // Doctors can manage appointments
        Route::get('/medicos/citas', [CitaController::class, 'misCitas']);
        Route::put('/medicos/citas/{id}/estado', [CitaController::class, 'actualizarEstado']);

        // Doctor profile
        Route::get('/medicos/profile', [MedicoController::class, 'profile']);
        Route::put('/medicos/profile', [MedicoController::class, 'updateProfile']);

        // Doctor reports
        Route::get('/medicos/reportes', [MedicoController::class, 'reportes']);

        // Doctor schedules
        Route::apiResource('/medicos/horarios', HorarioMedicoController::class);
    });

    // ==========================================
    // MEDICAL OPERATIONS (authenticated users for development)
    // ==========================================

    // Allow authenticated users to perform medical operations for development/testing
    Route::middleware('auth:sanctum')->group(function () {
        // Medical operations (temporarily open for development)
        Route::post('/citas', [CitaController::class, 'store']);
        Route::get('/citas', [CitaController::class, 'index']);
        Route::get('/citas/{id}', [CitaController::class, 'show']);
        Route::put('/citas/{id}', [CitaController::class, 'update']);
        Route::delete('/citas/{id}', [CitaController::class, 'destroy']);

        // Medical records and treatments (open for development)
        Route::post('/medicos/historial-clinico', [HistorialClinicoController::class, 'store']);
        Route::post('/medicos/tratamientos', [TratamientoController::class, 'store']);
        Route::post('/medicos/recetas-medicas', [RecetaMedicaController::class, 'store']);
        Route::post('/medicos/examenes', [ExamenController::class, 'store']);

        Route::get('/tratamientos', [TratamientoController::class, 'index']);
    });

    // ==========================================
    // ADMIN ROUTES (admin role)
    // ==========================================

    Route::middleware('role:admin')->group(function () {
        // Admin dashboard and reports
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/reportes', [AdminController::class, 'reportes']);

        // Full CRUD for all entities
        Route::apiResource('pacientes', PacienteController::class);
        Route::apiResource('medicos', MedicoController::class);
        Route::apiResource('historial-clinico', HistorialClinicoController::class);
        Route::apiResource('tratamientos', TratamientoController::class);
        Route::apiResource('medicamentos', MedicamentoController::class);
        Route::apiResource('recetas-medicas', RecetaMedicaController::class);
        Route::apiResource('examenes', ExamenController::class);
        Route::apiResource('facturas', FacturaController::class);
        Route::apiResource('pagos', PagoController::class);
        Route::apiResource('especialidades', EspecialidadController::class);
        Route::apiResource('horarios-medicos', HorarioMedicoController::class);
        Route::apiResource('notificaciones', NotificacionController::class);

        // Legacy admin routes (keeping for compatibility)
        Route::get('/admin/dashboard/stats', [PacienteController::class, 'dashboardStats']);
        Route::get('/admin/reportes/citas', [CitaController::class, 'reportes']);
        Route::get('/admin/reportes/facturas', [FacturaController::class, 'reportes']);

        // Create doctors
        Route::post('/admin/create-doctor', [AuthController::class, 'createDoctor']);
    });


    // ==========================================
    // SHARED ROUTES (Multiple roles can access)
    // ==========================================

    // Any authenticated user can view their notifications
    Route::get('/notificaciones', [NotificacionController::class, 'misNotificaciones']);
    Route::put('/notificaciones/{id}/read', [NotificacionController::class, 'markAsRead']);

    // Any authenticated user can view specialties and doctors
    Route::get('/especialidades', [EspecialidadController::class, 'index']);
    Route::get('/medicos', [MedicoController::class, 'index']);

    // Any authenticated user can view available doctor slots (for appointment booking)
    Route::get('/medicos/{medicoId}/horarios/disponibles', [HorarioMedicoController::class, 'availableSlots']);

    // Doctors and admins can view medications
    Route::get('/medicamentos', [MedicamentoController::class, 'index']);

    // Doctors and admins can view medications
    Route::middleware('role:doctor,admin,superadmin')->group(function () {
        Route::get('/medicamentos/search', [MedicamentoController::class, 'search']);
    });

    // ==========================================
    // LEGACY/COMPATIBILITY ROUTES
    // ==========================================

    // Keep some routes for backward compatibility (will be deprecated)
    Route::get('/pacientes/{id}/historial', [PacienteController::class, 'historial'])->middleware('role:doctor,admin,superadmin');
    Route::get('/pacientes/{id}/citas', [PacienteController::class, 'citas'])->middleware('role:doctor,admin,superadmin');
    Route::get('/medicos/{id}/citas', [MedicoController::class, 'citas'])->middleware('role:doctor,admin,superadmin');
    Route::get('/medicos/{id}/pacientes', [MedicoController::class, 'pacientes'])->middleware('role:doctor,admin,superadmin');
});
