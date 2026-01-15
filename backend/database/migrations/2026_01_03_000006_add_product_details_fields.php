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
            $table->string('availability')->default('in_stock')->after('stock');
            $table->string('material')->nullable()->after('availability');
            $table->string('dimensions')->nullable()->after('material');
            $table->string('color')->nullable()->after('dimensions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['availability', 'material', 'dimensions', 'color']);
        });
    }
};

