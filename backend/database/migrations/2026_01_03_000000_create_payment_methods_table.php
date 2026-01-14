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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['card', 'paypal', 'bank_transfer', 'apple_pay', 'google_pay'])->default('card');
            $table->string('provider')->nullable(); // 'visa', 'mastercard', 'paypal', etc.
            $table->string('last_four')->nullable(); // Últimos 4 dígitos de la tarjeta
            $table->string('cardholder_name')->nullable();
            $table->date('expires_at')->nullable(); // Para tarjetas
            $table->boolean('is_default')->default(false);
            $table->json('metadata')->nullable(); // Información adicional en JSON
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
