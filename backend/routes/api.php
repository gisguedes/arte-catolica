<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\VendorController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'name' => config('app.name'),
        'env' => config('app.env'),
        'version' => app()->version(),
        'checks' => [
            'app' => true,
            'db' => \DB::connection()->getPdo() !== null,
        ],
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Rutas públicas de la API
Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
Route::apiResource('products', ProductController::class)->only(['index', 'show']);
Route::apiResource('vendors', VendorController::class)->only(['index', 'show']);

// Ruta adicional para productos de un vendor
Route::get('vendors/{id}/products', [VendorController::class, 'products']);
// Alias para compatibilidad con "artists" en el frontend
Route::get('artists/{id}/products', [VendorController::class, 'products']);
