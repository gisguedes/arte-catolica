<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vendor;
use App\Models\ArtistType;
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
                    'city' => 'Sevilla',
                    'country' => 'España',
                    'postal_code' => '41001',
                    'opening_date' => '2014-05-12',
                    'artist_types' => ['pintura-sacra', 'arte-devocional'],
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
                    'city' => 'Toledo',
                    'country' => 'España',
                    'postal_code' => '45001',
                    'opening_date' => '2001-09-03',
                    'artist_types' => ['escultura-religiosa'],
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
                    'city' => 'Valencia',
                    'country' => 'España',
                    'postal_code' => '46001',
                    'opening_date' => '2018-03-18',
                    'artist_types' => ['iconografia', 'arte-devocional'],
                ],
            ],
        ];

        $artistTypeMap = [
            'pintura-sacra' => 'Pintura sacra',
            'arte-devocional' => 'Arte devocional',
            'escultura-religiosa' => 'Escultura religiosa',
            'iconografia' => 'Iconografía',
        ];

        foreach ($vendors as $vendorData) {
            $user = User::firstOrCreate(
                ['email' => $vendorData['user']['email']],
                $vendorData['user']
            );

            $artistTypeSlugs = $vendorData['vendor']['artist_types'] ?? [];
            $vendorPayload = $vendorData['vendor'];
            unset($vendorPayload['artist_types']);

            $vendor = Vendor::updateOrCreate(
                ['email' => $vendorData['vendor']['email']],
                array_merge($vendorPayload, [
                    'user_id' => $user->id,
                    'is_active' => true,
                ])
            );

            $artistTypeIds = [];
            foreach ($artistTypeSlugs as $slug) {
                $name = $artistTypeMap[$slug] ?? ucfirst(str_replace('-', ' ', $slug));
                $artistTypeIds[] = ArtistType::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $name]
                )->id;
            }

            if (!empty($artistTypeIds)) {
                $vendor->artistTypes()->sync($artistTypeIds);
            }
        }
    }
}
