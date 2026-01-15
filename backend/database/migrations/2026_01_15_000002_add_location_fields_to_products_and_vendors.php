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
        Schema::table('products', function (Blueprint $table) {
            $table->string('shipping_location')->nullable()->after('availability');
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->string('location')->nullable()->after('website');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('shipping_location');
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn('location');
        });
    }
};

