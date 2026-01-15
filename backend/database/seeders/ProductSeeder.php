<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Color;
use App\Models\Material;
use App\Models\MaterialTranslation;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductTranslation;
use App\Models\Vendor;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vendors = Vendor::all();
        $categories = Category::all();
        $materials = collect();
        $colors = collect();
        $imagePool = [
            [
                'https://images.unsplash.com/photo-1459666644539-a9755287d6b0?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1452827073306-6e6e661baf57?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1442550528053-c431ecb55509?auto=format&fit=crop&w=1200&q=80',
            ],
        ];

        if ($vendors->isEmpty() || $categories->isEmpty()) {
            $this->command->warn('No hay vendedores o categorías. Ejecuta primero VendorSeeder y CategorySeeder.');
            return;
        }

        $vendorList = $vendors->values();
        $vendorCount = $vendorList->count();

        $materialList = [
            ['slug' => 'oleo-lienzo', 'es' => 'Óleo sobre lienzo', 'en' => 'Oil on canvas'],
            ['slug' => 'madera-tallada', 'es' => 'Madera tallada', 'en' => 'Carved wood'],
            ['slug' => 'pan-oro', 'es' => 'Pan de oro', 'en' => 'Gold leaf'],
            ['slug' => 'bronce', 'es' => 'Bronce', 'en' => 'Bronze'],
            ['slug' => 'marmol', 'es' => 'Mármol', 'en' => 'Marble'],
        ];

        foreach ($materialList as $materialData) {
            $material = Material::firstOrCreate(
                ['slug' => $materialData['slug']],
                ['is_active' => true]
            );

            MaterialTranslation::updateOrCreate(
                ['material_id' => $material->id, 'locale' => 'es'],
                ['name' => $materialData['es']]
            );

            MaterialTranslation::updateOrCreate(
                ['material_id' => $material->id, 'locale' => 'en'],
                ['name' => $materialData['en']]
            );

            $materials->push($material);
        }

        $colorList = [
            ['name' => 'Dorado', 'hex' => '#c9a24a'],
            ['name' => 'Azul profundo', 'hex' => '#0f2347'],
            ['name' => 'Marfil', 'hex' => '#f5f0e6'],
            ['name' => 'Burdeos', 'hex' => '#5a2d36'],
        ];

        foreach ($colorList as $colorData) {
            $colors->push(Color::firstOrCreate(
                ['hex' => $colorData['hex']],
                [
                    'name' => $colorData['name'],
                    'is_active' => true,
                ]
            ));
        }

        foreach ($categories as $index => $category) {
            for ($i = 1; $i <= 3; $i++) {
                $vendor = $vendorList[$index % $vendorCount];
                $skuPrefix = strtoupper(substr($category->slug, 0, 3));
                $sku = sprintf('%s-%02d', $skuPrefix, $i);
                $availability = $i === 3 ? 'on_demand' : ($i === 2 ? 'limited' : 'in_stock');
                $imageSet = $imagePool[($index + $i) % count($imagePool)];
                $categoryNameEs = $category->translate('es')?->name ?? ucfirst($category->slug);
                $categoryNameEn = $category->translate('en')?->name ?? ucfirst($category->slug);
                $product = Product::updateOrCreate(
                    ['sku' => $sku],
                    [
                        'vendor_id' => $vendor->id,
                        'price' => 90 + ($i * 35) + ($index * 10),
                        'stock' => $availability === 'on_demand' ? 0 : (5 + $i),
                        'availability' => $availability,
                        'height_cm' => $i === 1 ? 30 : ($i === 2 ? 40 : 50),
                        'width_cm' => $i === 1 ? 40 : ($i === 2 ? 60 : 70),
                        'depth_cm' => $i === 1 ? 4 : ($i === 2 ? 6 : 8),
                        'is_active' => true,
                        'is_featured' => $i === 1,
                    ]
                );

                $product->categories()->sync([$category->id]);
                $product->materials()->sync($materials->shuffle()->take(2)->pluck('id'));
                $product->colors()->sync($colors->shuffle()->take(2)->pluck('id'));

                ProductTranslation::updateOrCreate(
                    ['product_id' => $product->id, 'locale' => 'es'],
                    [
                        'name' => "{$categoryNameEs} {$i}",
                        'description' => "Pieza única de {$categoryNameEs} inspirada en el arte sacro.",
                    ]
                );

                ProductTranslation::updateOrCreate(
                    ['product_id' => $product->id, 'locale' => 'en'],
                    [
                        'name' => "{$categoryNameEn} {$i}",
                        'description' => "Unique {$categoryNameEn} piece inspired by sacred art.",
                    ]
                );

                ProductImage::updateOrCreate(
                    ['product_id' => $product->id, 'order' => 1],
                    [
                        'image_path' => $imageSet[0],
                        'is_primary' => true,
                    ]
                );

                ProductImage::updateOrCreate(
                    ['product_id' => $product->id, 'order' => 2],
                    [
                        'image_path' => $imageSet[1],
                        'is_primary' => false,
                    ]
                );
            }
        }
    }
}
