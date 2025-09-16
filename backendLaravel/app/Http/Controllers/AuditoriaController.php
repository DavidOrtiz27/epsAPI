<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuditoriaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        // Only superadmins can view audit logs
        if (!$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $auditorias = Auditoria::with('user')
                              ->orderBy('fecha', 'desc')
                              ->get();

        return response()->json($auditorias);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'nullable|exists:users,id',
            'accion' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only superadmins can create audit logs manually
        if (!$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $auditoria = Auditoria::create([
            'user_id' => $request->user_id,
            'accion' => $request->accion,
            'descripcion' => $request->descripcion,
            'fecha' => now(),
        ]);

        return response()->json($auditoria->load('user'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();

        // Only superadmins can view audit logs
        if (!$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $auditoria = Auditoria::with('user')->findOrFail($id);

        return response()->json($auditoria);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'accion' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only superadmins can update audit logs
        if (!$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $auditoria = Auditoria::findOrFail($id);
        $auditoria->update($request->all());

        return response()->json($auditoria->load('user'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();

        // Only superadmins can delete audit logs
        if (!$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $auditoria = Auditoria::findOrFail($id);
        $auditoria->delete();

        return response()->json(['message' => 'Auditoria deleted successfully']);
    }

    /**
     * Get audit logs for a specific user
     */
    public function userAudits(Request $request, string $userId)
    {
        $user = Auth::user();

        // Only superadmins can view user audit logs
        if (!$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $auditorias = Auditoria::where('user_id', $userId)
                              ->with('user')
                              ->orderBy('fecha', 'desc')
                              ->get();

        return response()->json($auditorias);
    }

    /**
     * Get audit logs by action type
     */
    public function byAction(Request $request, string $action)
    {
        $user = Auth::user();

        // Only superadmins can filter audit logs
        if (!$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $auditorias = Auditoria::where('accion', $action)
                              ->with('user')
                              ->orderBy('fecha', 'desc')
                              ->get();

        return response()->json($auditorias);
    }
}
