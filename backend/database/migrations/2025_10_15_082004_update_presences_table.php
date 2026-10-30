<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE presences ALTER COLUMN statut TYPE VARCHAR(20)");
        DB::statement("ALTER TABLE presences ALTER COLUMN statut SET DEFAULT 'present'");
    }
    public function down(): void
    {
        DB::statement("ALTER TABLE presences ALTER COLUMN statut TYPE VARCHAR(20)");
        DB::statement("ALTER TABLE presences ALTER COLUMN statut SET DEFAULT 'P'");
    }
};
