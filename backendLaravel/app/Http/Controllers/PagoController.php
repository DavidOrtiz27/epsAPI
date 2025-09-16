<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PagoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $pagos = Pago::with(['factura.paciente.user'])->get();
        } elseif ($user->hasRole('paciente')) {
            // Patients can only see their own payments
            $pagos = Pago::whereHas('factura', function ($query) use ($user) {
                $query->where('paciente_id', $user->paciente->id);
            })->with(['factura.paciente.user'])->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($pagos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'factura_id' => 'required|exists:facturas,id',
            'monto' => 'required|numeric|min:0',
            'fecha' => 'required|date',
            'metodo' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();

        // Check if user has permission to create payments for this invoice
        $factura = \App\Models\Factura::findOrFail($request->factura_id);

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            // Admins can create payments for any invoice
        } elseif ($user->hasRole('paciente') && $factura->paciente_id === $user->paciente->id) {
            // Patients can only create payments for their own invoices
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pago = Pago::create($request->all());

        return response()->json($pago->load(['factura.paciente.user']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $pago = Pago::with(['factura.paciente.user'])->findOrFail($id);

        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessPago($user, $pago)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($pago);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'monto' => 'sometimes|required|numeric|min:0',
            'fecha' => 'sometimes|required|date',
            'metodo' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pago = Pago::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessPago($user, $pago)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only admins can update payments
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pago->update($request->all());

        return response()->json($pago->load(['factura.paciente.user']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $pago = Pago::findOrFail($id);
        $user = Auth::user();

        // Check permissions
        if (!$this->canAccessPago($user, $pago)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only admins can delete payments
        if (!$user->hasRole('admin') && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pago->delete();

        return response()->json(['message' => 'Pago deleted successfully']);
    }

    /**
     * Check if user can access the payment
     */
    private function canAccessPago($user, $pago)
    {
        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            return true;
        }

        // Patients can only access their own payments
        return $user->paciente && $user->paciente->id == $pago->factura->paciente_id;
    }
}
