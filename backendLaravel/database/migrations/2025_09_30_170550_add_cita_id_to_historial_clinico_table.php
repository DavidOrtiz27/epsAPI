<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('historial_clinico', function (Blueprint $table) {
            $table->unsignedBigInteger('cita_id')->nullable()->after('paciente_id');
            $table->foreign('cita_id')->references('id')->on('citas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('historial_clinico', function (Blueprint $table) {
            $table->dropForeign(['cita_id']);
            $table->dropColumn('cita_id');
        });
    }
};
