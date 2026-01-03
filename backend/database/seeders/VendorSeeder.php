<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class VendorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vendors = [
            [
                'user' => [
                    'name' => 'María',
                    'surname' => 'González',
                    'email' => 'maria@artecatolica.com',
                    'password' => Hash::make('password'),
                ],
                'vendor' => [
                    'name' => 'María',
                    'surname' => 'González',
                    'email' => 'maria@artecatolica.com',
                    'phone' => '+34 600 123 456',
                    'nif' => '12345678A',
                    'bio' => 'Artista especializada en pinturas religiosas tradicionales',
                    'website' => 'https://mariagonzalez.art',
                ],
            ],
            [
                'user' => [
                    'name' => 'Juan',
                    'surname' => 'Martínez',
                    'email' => 'juan@artecatolica.com',
                    'password' => Hash::make('password'),
                ],
                'vendor' => [
                    'name' => 'Juan',
                    'surname' => 'Martínez',
                    'email' => 'juan@artecatolica.com',
                    'phone' => '+34 600 789 012',
                    'nif' => '87654321B',
                    'bio' => 'Escultor de arte sacro con más de 20 años de experiencia',
                    'website' => 'https://juanmartinez.art',
                ],
            ],
            [
                'user' => [
                    'name' => 'Ana',
                    'surname' => 'Rodríguez',
                    'email' => 'ana@artecatolica.com',
                    'password' => Hash::make('password'),
                ],
                'vendor' => [
                    'name' => 'Ana',
                    'surname' => 'Rodríguez',
                    'email' => 'ana@artecatolica.com',
                    'phone' => '+34 600 345 678',
                    'nif' => '11223344C',
                    'bio' => 'Creadora de iconos bizantinos y arte ortodoxo',
                ],
            ],
        ];

        foreach ($vendors as $vendorData) {
            $user = User::create($vendorData['user']);

            Vendor::create(array_merge($vendorData['vendor'], [
                'user_id' => $user->id,
                'is_active' => true,
            ]));
        }
    }
}
