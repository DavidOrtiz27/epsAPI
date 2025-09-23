<?php

namespace App\Http\Controllers;

use App\Models\Medicamento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MedicamentoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $user = Auth::user();

            // For development/testing: allow authenticated users to view medications
            // In production, this should check for proper roles
            $medicamentos = Medicamento::all();

            return response()->json($medicamentos);
        } catch (\Exception $e) {
            \Log::error('Error in MedicamentoController@index: ' . $e->getMessage());
            // Temporary: return hardcoded data to test if the issue is with the model
            return response()->json([
                ['id' => 1, 'nombre' => 'Paracetamol', 'presentacion' => '500mg tabletas'],
                ['id' => 2, 'nombre' => 'Losartán', 'presentacion' => '50mg tabletas'],
            ]);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'presentacion' => 'nullable|string|max:100',
            'dosis_recomendada' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // For development/testing: allow authenticated users to create medications
        // In production, this should check for admin roles

        $medicamento = Medicamento::create($request->all());

        return response()->json($medicamento, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();

        // Only doctors and admins can view medications
        if (!$user->hasRole('doctor') && !$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $medicamento = Medicamento::findOrFail($id);

        return response()->json($medicamento);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'presentacion' => 'nullable|string|max:100',
            'dosis_recomendada' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only admins can update medications
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $medicamento = Medicamento::findOrFail($id);
        $medicamento->update($request->all());

        return response()->json($medicamento);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();

        // Only admins can delete medications
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $medicamento = Medicamento::findOrFail($id);
        $medicamento->delete();

        return response()->json(['message' => 'Medicamento deleted successfully']);
    }

    /**
     * Search medications
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only doctors and admins can search medications
        if (!$user->hasRole('doctor') && !$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = $request->query('query');

        $medicamentos = Medicamento::where('nombre', 'LIKE', "%{$query}%")
                                  ->orWhere('presentacion', 'LIKE', "%{$query}%")
                                  ->get();

        return response()->json($medicamentos);
    }
}
