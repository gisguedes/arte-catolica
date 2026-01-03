<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            VendorSeeder::class,
            ProductSeeder::class,
        ]);

        // Crear usuario de prueba (no vendedor)
        User::factory()->create([
            'name' => 'Test',
            'surname' => 'User',
            'email' => 'test@example.com',
            'password' => \Hash::make('password'),
        ]);
    }
}
