<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ Supprime l'ancienne contrainte
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');

        // ✅ Recrée avec tous les rôles nécessaires
        DB::statement("
            ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK (role::text = ANY (ARRAY[
                'admin',
                'coordinateur',
                'assistant',
                'enseignant',
                'apprenant',
                'chef_departement',
                'responsable_metier'
            ]::text[]))
        ");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');

        DB::statement("
            ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK (role::text = ANY (ARRAY[
                'admin',
                'coordinateur',
                'assistant',
                'enseignant',
                'apprenant'
            ]::text[]))
        ");
    }
};
