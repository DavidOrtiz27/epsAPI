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
        Schema::table('examenes', function (Blueprint $table) {
            $table->unsignedBigInteger('historial_id')->nullable()->after('paciente_id');
            $table->foreign('historial_id')->references('id')->on('historial_clinico')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('examenes', function (Blueprint $table) {
            $table->dropForeign(['historial_id']);
            $table->dropColumn('historial_id');
        });
    }
};
