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
            $table->decimal('height_cm', 8, 2)->nullable()->after('availability');
            $table->decimal('width_cm', 8, 2)->nullable()->after('height_cm');
            $table->decimal('depth_cm', 8, 2)->nullable()->after('width_cm');
            $table->dropColumn(['material', 'dimensions', 'color']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('material')->nullable()->after('availability');
            $table->string('dimensions')->nullable()->after('material');
            $table->string('color')->nullable()->after('dimensions');
            $table->dropColumn(['height_cm', 'width_cm', 'depth_cm']);
        });
    }
};

