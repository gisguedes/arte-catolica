<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    $checks = ['app' => true, 'db' => false];

    try {
        DB::select('SELECT 1'); // ping a Postgres
        $checks['db'] = true;
    } catch (\Throwable $e) {
        $checks['db'] = false;
    }

    return response()->json([
        'name' => config('app.name'),
        'env' => config('app.env'),
        'version' => app()->version(),
        'checks' => $checks,
        'timestamp' => now()->toISOString(),
    ]);
});
