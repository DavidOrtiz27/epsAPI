<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Cita;

class NotificationController extends Controller
{
    /**
     * Enviar notificación push usando Expo Push Notifications
     */
    public function sendPushNotification(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'title' => 'required|string|max:255',
                'body' => 'required|string|max:500',
                'data' => 'sometimes|array'
            ]);

            $user = User::find($request->user_id);
            
            if (!$user || !$user->expo_push_token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado o sin token de notificaciones'
                ], 404);
            }

            // Preparar el mensaje para Expo Push API
            $message = [
                'to' => $user->expo_push_token,
                'title' => $request->title,
                'body' => $request->body,
                'sound' => 'default',
                'channelId' => 'medical-urgent',
                'priority' => 'high',
                'data' => $request->data ?? []
            ];

            // Enviar a Expo Push API
            $response = Http::post('https://exp.host/--/api/v2/push/send', $message);

            if ($response->successful()) {
                Log::info('Notificación push enviada exitosamente', [
                    'user_id' => $user->id,
                    'title' => $request->title,
                    'response' => $response->json()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Notificación enviada exitosamente',
                    'expo_response' => $response->json()
                ]);
            } else {
                Log::error('Error enviando notificación push', [
                    'user_id' => $user->id,
                    'response' => $response->body()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Error enviando notificación',
                    'error' => $response->body()
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Excepción enviando notificación push', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enviar notificación cuando se crea una nueva cita
     */
    public function notifyNewAppointment(Request $request)
    {
        try {
            $request->validate([
                'cita_id' => 'required|exists:citas,id'
            ]);

            $cita = Cita::with(['paciente', 'medico'])->find($request->cita_id);
            
            if (!$cita) {
                return response()->json(['success' => false, 'message' => 'Cita no encontrada'], 404);
            }

            // Notificar al paciente
            if ($cita->paciente && $cita->paciente->expo_push_token) {
                $patientMessage = [
                    'to' => $cita->paciente->expo_push_token,
                    'title' => '✅ Cita Confirmada',
                    'body' => "Tu cita con {$cita->medico->nombre} ha sido confirmada para el " . 
                             date('d/m/Y H:i', strtotime($cita->fecha)),
                    'sound' => 'default',
                    'channelId' => 'appointments',
                    'data' => [
                        'type' => 'appointment',
                        'action' => 'confirmed',
                        'cita_id' => $cita->id
                    ]
                ];

                Http::post('https://exp.host/--/api/v2/push/send', $patientMessage);
            }

            // Notificar al médico
            if ($cita->medico && $cita->medico->expo_push_token) {
                $doctorMessage = [
                    'to' => $cita->medico->expo_push_token,
                    'title' => '📅 Nueva Cita Asignada',
                    'body' => "Nueva cita con {$cita->paciente->nombre} para el " . 
                             date('d/m/Y H:i', strtotime($cita->fecha)),
                    'sound' => 'default',
                    'channelId' => 'medical-urgent',
                    'data' => [
                        'type' => 'appointment',
                        'action' => 'new_assignment',
                        'cita_id' => $cita->id
                    ]
                ];

                Http::post('https://exp.host/--/api/v2/push/send', $doctorMessage);
            }

            return response()->json([
                'success' => true,
                'message' => 'Notificaciones de nueva cita enviadas'
            ]);

        } catch (\Exception $e) {
            Log::error('Error enviando notificaciones de nueva cita', [
                'error' => $e->getMessage(),
                'cita_id' => $request->cita_id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error enviando notificaciones'
            ], 500);
        }
    }

    /**
     * Enviar recordatorio de cita próxima
     */
    public function sendAppointmentReminder(Request $request)
    {
        try {
            $request->validate([
                'cita_id' => 'required|exists:citas,id'
            ]);

            $cita = Cita::with(['paciente', 'medico'])->find($request->cita_id);
            
            if (!$cita || !$cita->paciente || !$cita->paciente->expo_push_token) {
                return response()->json(['success' => false, 'message' => 'Cita o paciente no encontrado'], 404);
            }

            $reminderMessage = [
                'to' => $cita->paciente->expo_push_token,
                'title' => '⏰ Recordatorio de Cita',
                'body' => "Tienes una cita con {$cita->medico->nombre} en 1 hora (" . 
                         date('H:i', strtotime($cita->fecha)) . ")",
                'sound' => 'default',
                'channelId' => 'appointments',
                'data' => [
                    'type' => 'appointment',
                    'action' => 'reminder',
                    'cita_id' => $cita->id
                ]
            ];

            $response = Http::post('https://exp.host/--/api/v2/push/send', $reminderMessage);

            return response()->json([
                'success' => true,
                'message' => 'Recordatorio de cita enviado',
                'expo_response' => $response->json()
            ]);

        } catch (\Exception $e) {
            Log::error('Error enviando recordatorio de cita', [
                'error' => $e->getMessage(),
                'cita_id' => $request->cita_id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error enviando recordatorio'
            ], 500);
        }
    }

    /**
     * Registrar token de notificaciones push del usuario
     */
    public function registerPushToken(Request $request)
    {
        try {
            $request->validate([
                'expo_push_token' => 'required|string'
            ]);

            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'No autenticado'], 401);
            }

            $user->expo_push_token = $request->expo_push_token;
            $user->save();

            Log::info('Token de notificaciones registrado', [
                'user_id' => $user->id,
                'token' => substr($request->expo_push_token, 0, 20) . '...'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Token de notificaciones registrado exitosamente'
            ]);

        } catch (\Exception $e) {
            Log::error('Error registrando token de notificaciones', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error registrando token'
            ], 500);
        }
    }
}