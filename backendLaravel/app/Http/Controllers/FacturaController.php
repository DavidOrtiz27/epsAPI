<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FacturaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $facturas = Factura::with(['paciente.user', 'pagos'])->get();
        } else {
            // Patients can only see their own invoices
            $facturas = Factura::where('paciente_id', $user->paciente->id)
                              ->with(['paciente.user', 'pagos'])
                              ->get();
        }

        return response()->json($facturas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'paciente_id' => 'required|exists:pacientes,id',
            'monto' => 'required|numeric|min:0',
            'fecha' => 'required|date',
            'estado' => 'in:pendiente,pagada,anulada',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Only admins can create invoices
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $factura = Factura::create($request->all());

        return response()->json($factura->load(['paciente.user', 'pagos']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $factura = Factura::with(['paciente.user', 'pagos'])->findOrFail($id);

        $user = Auth::user();

        // Check permissions
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin') &&
            (!$user->paciente || $user->paciente->id != $factura->paciente_id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($factura);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'monto' => 'sometimes|numeric|min:0',
            'fecha' => 'sometimes|date',
            'estado' => 'sometimes|in:pendiente,pagada,anulada',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $factura = Factura::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $factura->update($request->all());

        return response()->json($factura->load(['paciente.user', 'pagos']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $factura = Factura::findOrFail($id);
        $user = Auth::user();

        // Only admins can delete invoices
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $factura->delete();

        return response()->json(['message' => 'Factura deleted successfully']);
    }

    /**
     * Get current patient's invoices
     */
    public function misFacturas(Request $request)
    {
        $user = $request->user();

        if (!$user->paciente) {
            return response()->json(['message' => 'Paciente profile not found'], 404);
        }

        $facturas = Factura::where('paciente_id', $user->paciente->id)
                          ->with(['paciente.user', 'pagos'])
                          ->orderBy('fecha', 'desc')
                          ->get();

        return response()->json($facturas);
    }

    /**
     * Get invoice reports (for admins)
     */
    public function reportes(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reportes = [
            'total_facturas' => Factura::count(),
            'facturas_pendientes' => Factura::where('estado', 'pendiente')->count(),
            'facturas_pagadas' => Factura::where('estado', 'pagada')->count(),
            'facturas_anuladas' => Factura::where('estado', 'anulada')->count(),
            'ingresos_totales' => Factura::where('estado', 'pagada')->sum('monto'),
            'ingresos_mes' => Factura::where('estado', 'pagada')
                                    ->whereMonth('fecha', now()->month)
                                    ->sum('monto'),
            'ingresos_hoy' => Factura::where('estado', 'pagada')
                                    ->whereDate('fecha', today())
                                    ->sum('monto'),
        ];

        return response()->json($reportes);
    }
}
