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

        // Crear o actualizar usuario de prueba (no vendedor)
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test',
                'surname' => 'User',
                'password' => \Hash::make('password'),
            ]
        );
    }
}
