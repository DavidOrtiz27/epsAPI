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
        Schema::create('horarios_medicos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('medico_id');
            $table->enum('dia_semana', ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']);
            $table->time('hora_inicio')->nullable();
            $table->time('hora_fin')->nullable();
            $table->foreign('medico_id')->references('id')->on('medicos')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('horarios_medicos');
    }
};
