<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class NotificacionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $notificaciones = Notificacion::with('user')->get();
        } else {
            // Regular users can only see their own notifications
            $notificaciones = Notificacion::where('user_id', $user->id)
                                        ->with('user')
                                        ->orderBy('created_at', 'desc')
                                        ->get();
        }

        return response()->json($notificaciones);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'mensaje' => 'required|string',
            'estado' => 'in:enviado,pendiente,leido',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only admins can create notifications for others
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') && $request->user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notificacion = Notificacion::create($request->all());

        return response()->json($notificacion->load('user'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $notificacion = Notificacion::with('user')->findOrFail($id);

        $user = Auth::user();

        // Check permissions
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') && $notificacion->user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($notificacion);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'mensaje' => 'sometimes|required|string',
            'estado' => 'sometimes|in:enviado,pendiente,leido',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $notificacion = Notificacion::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') && $notificacion->user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notificacion->update($request->all());

        return response()->json($notificacion->load('user'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $notificacion = Notificacion::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') && $notificacion->user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notificacion->delete();

        return response()->json(['message' => 'Notificacion deleted successfully']);
    }

    /**
     * Get current user's notifications
     */
    public function misNotificaciones(Request $request)
    {
        $user = $request->user();

        $notificaciones = Notificacion::where('user_id', $user->id)
                                    ->with('user')
                                    ->orderBy('created_at', 'desc')
                                    ->get();

        return response()->json($notificaciones);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, string $id)
    {
        $notificacion = Notificacion::findOrFail($id);
        $user = $request->user();

        // Check permissions
        if ($notificacion->user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notificacion->update(['estado' => 'leido']);

        return response()->json($notificacion->load('user'));
    }
}
