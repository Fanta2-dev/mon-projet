<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'google_access_token'))
                $table->text('google_access_token')->nullable();
            if (!Schema::hasColumn('users', 'google_refresh_token'))
                $table->text('google_refresh_token')->nullable();
            if (!Schema::hasColumn('users', 'google_token_expires_at'))
                $table->timestamp('google_token_expires_at')->nullable();
            if (!Schema::hasColumn('users', 'google_id'))
                $table->string('google_id')->nullable()->unique();
            if (!Schema::hasColumn('users', 'google_name'))
                $table->string('google_name')->nullable();
            if (!Schema::hasColumn('users', 'google_email'))
                $table->string('google_email')->nullable();
            if (!Schema::hasColumn('users', 'google_avatar'))
                $table->string('google_avatar')->nullable();
        });
    }
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'google_access_token',
                'google_refresh_token',
                'google_token_expires_at',
                'google_id',
                'google_name',
                'google_email',
                'google_avatar',
            ]);
        });
    }
};
