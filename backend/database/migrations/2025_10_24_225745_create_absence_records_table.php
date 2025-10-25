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
        Schema::create('absence_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apprenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('seance_id')->constrained()->onDelete('cascade');
            $table->enum('statut', ['en_attente', 'justifié', 'non_justifié'])->default('en_attente');
            $table->string('justificatif_url')->nullable();
            $table->text('motif_justificatif')->nullable();
            $table->timestamp('notified_at')->nullable();
            $table->timestamp('justified_at')->nullable();
            $table->timestamps();

            // Index pour les performances
            $table->index(['apprenant_id', 'seance_id']);
            $table->index('statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absence_records');
    }
};
