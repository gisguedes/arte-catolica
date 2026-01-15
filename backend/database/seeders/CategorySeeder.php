<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CategoryTranslation;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'slug' => 'paintings',
                'translations' => [
                    'es' => ['name' => 'Pinturas', 'description' => 'Obras de arte pintadas a mano'],
                    'en' => ['name' => 'Paintings', 'description' => 'Hand-painted artworks'],
                ],
            ],
            [
                'slug' => 'sculptures',
                'translations' => [
                    'es' => ['name' => 'Esculturas', 'description' => 'Esculturas religiosas y arte tridimensional'],
                    'en' => ['name' => 'Sculptures', 'description' => 'Religious sculptures and three-dimensional art'],
                ],
            ],
            [
                'slug' => 'icons',
                'translations' => [
                    'es' => ['name' => 'Iconos', 'description' => 'Iconos religiosos y arte sacro'],
                    'en' => ['name' => 'Icons', 'description' => 'Religious icons and sacred art'],
                ],
            ],
            [
                'slug' => 'crucifixes',
                'translations' => [
                    'es' => ['name' => 'Crucifijos', 'description' => 'Crucifijos y cruces artesanales'],
                    'en' => ['name' => 'Crucifixes', 'description' => 'Handcrafted crucifixes and crosses'],
                ],
            ],
            [
                'slug' => 'rosaries',
                'translations' => [
                    'es' => ['name' => 'Rosarios', 'description' => 'Rosarios artesanales y objetos de devoción'],
                    'en' => ['name' => 'Rosaries', 'description' => 'Handcrafted rosaries and devotional objects'],
                ],
            ],
        ];

        foreach ($categories as $categoryData) {
            $category = Category::create([
                'slug' => $categoryData['slug'],
                'is_active' => true,
            ]);

            foreach ($categoryData['translations'] as $locale => $translation) {
                CategoryTranslation::create([
                    'category_id' => $category->id,
                    'locale' => $locale,
                    'name' => $translation['name'],
                    'description' => $translation['description'],
                ]);
            }
        }
    }
}
