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
        Schema::create('artist_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('artist_type_vendor', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('artist_type_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('vendor_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['artist_type_id', 'vendor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('artist_type_vendor');
        Schema::dropIfExists('artist_types');
    }
};

