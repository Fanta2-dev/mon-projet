<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // 1. Ajouter le champ 'nom' à la table seances
        if (!Schema::hasColumn('seances', 'nom')) {
            Schema::table('seances', function (Blueprint $table) {
                $table->string('nom')->nullable();
            });
        }

        // 2. Mettre à jour le statut des présences
        DB::statement("ALTER TABLE presences ALTER COLUMN statut TYPE VARCHAR(20)");
        DB::statement("ALTER TABLE presences ALTER COLUMN statut SET DEFAULT 'present'");
    }

    public function down()
    {
        if (Schema::hasColumn('seances', 'nom')) {
            Schema::table('seances', function (Blueprint $table) {
                $table->dropColumn('nom');
            });
        }

        DB::statement("ALTER TABLE presences ALTER COLUMN statut TYPE VARCHAR(20)");
        DB::statement("ALTER TABLE presences ALTER COLUMN statut SET DEFAULT 'P'");
    }
};
