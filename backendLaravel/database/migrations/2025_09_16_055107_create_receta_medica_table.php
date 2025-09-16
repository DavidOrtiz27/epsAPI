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
        Schema::create('receta_medica', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tratamiento_id');
            $table->unsignedBigInteger('medicamento_id');
            $table->string('dosis', 100)->nullable();
            $table->string('frecuencia', 100)->nullable();
            $table->string('duracion', 100)->nullable();
            $table->foreign('tratamiento_id')->references('id')->on('tratamientos')->onDelete('cascade');
            $table->foreign('medicamento_id')->references('id')->on('medicamentos')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receta_medica');
    }
};
