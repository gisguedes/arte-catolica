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
        if (Schema::hasColumn('vendors', 'location')) {
            Schema::table('vendors', function (Blueprint $table) {
                $table->dropColumn('location');
            });
        }

        if (Schema::hasColumn('vendors', 'artist_type')) {
            Schema::table('vendors', function (Blueprint $table) {
                $table->dropColumn('artist_type');
            });
        }

        if (!Schema::hasColumn('vendors', 'city')) {
            Schema::table('vendors', function (Blueprint $table) {
                $table->string('city')->nullable();
            });
        }

        if (!Schema::hasColumn('vendors', 'country')) {
            Schema::table('vendors', function (Blueprint $table) {
                $table->string('country')->nullable();
            });
        }

        if (!Schema::hasColumn('vendors', 'postal_code')) {
            Schema::table('vendors', function (Blueprint $table) {
                $table->string('postal_code')->nullable();
            });
        }

        if (Schema::hasColumn('products', 'shipping_location')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('shipping_location');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            if (!Schema::hasColumn('vendors', 'location')) {
                $table->string('location')->nullable();
            }
            if (!Schema::hasColumn('vendors', 'artist_type')) {
                $table->string('artist_type')->nullable();
            }
            if (Schema::hasColumn('vendors', 'city')) {
                $table->dropColumn('city');
            }
            if (Schema::hasColumn('vendors', 'country')) {
                $table->dropColumn('country');
            }
            if (Schema::hasColumn('vendors', 'postal_code')) {
                $table->dropColumn('postal_code');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'shipping_location')) {
                $table->string('shipping_location')->nullable();
            }
        });
    }
};

