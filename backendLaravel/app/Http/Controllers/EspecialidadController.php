<?php

namespace App\Http\Controllers;

use App\Models\Especialidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class EspecialidadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        // Any authenticated user can view specialties
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $especialidades = Especialidad::all();
        return response()->json($especialidades);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100|unique:especialidades',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only admins can create specialties
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $especialidad = Especialidad::create($request->all());

        return response()->json($especialidad, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $especialidad = Especialidad::with(['medicos.user'])->findOrFail($id);

        return response()->json($especialidad);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:100|unique:especialidades,nombre,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only admins can update specialties
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $especialidad = Especialidad::findOrFail($id);
        $especialidad->update($request->all());

        return response()->json($especialidad);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();

        // Only admins can delete specialties
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $especialidad = Especialidad::findOrFail($id);
        $especialidad->delete();

        return response()->json(['message' => 'Especialidad deleted successfully']);
    }

}
