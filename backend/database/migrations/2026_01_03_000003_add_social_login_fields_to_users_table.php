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
        Schema::table('users', function (Blueprint $table) {
            $table->string('surname')->nullable()->after('name');
            $table->string('password')->nullable()->change(); // Permite null para login social
            $table->string('provider')->nullable()->after('password'); // 'google', 'apple', 'email'
            $table->string('provider_id')->nullable()->after('provider'); // ID del proveedor social
            $table->string('avatar')->nullable()->after('provider_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['surname', 'provider', 'provider_id', 'avatar']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
