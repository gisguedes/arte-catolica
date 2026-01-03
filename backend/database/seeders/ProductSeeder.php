<?php

namespace Database\Seeders;

use App\Models\Category;
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

        if ($vendors->isEmpty() || $categories->isEmpty()) {
            $this->command->warn('No hay vendedores o categorías. Ejecuta primero VendorSeeder y CategorySeeder.');
            return;
        }

        $products = [
            [
                'category_slug' => 'pinturas',
                'vendor_email' => 'maria@artecatolica.com',
                'price' => 350.00,
                'stock' => 5,
                'sku' => 'PINT-001',
                'translations' => [
                    'es' => [
                        'name' => 'Virgen de Guadalupe',
                        'description' => 'Hermosa pintura al óleo de la Virgen de Guadalupe, realizada en lienzo de alta calidad.',
                    ],
                    'en' => [
                        'name' => 'Our Lady of Guadalupe',
                        'description' => 'Beautiful oil painting of Our Lady of Guadalupe, made on high-quality canvas.',
                    ],
                ],
            ],
            [
                'category_slug' => 'pinturas',
                'vendor_email' => 'maria@artecatolica.com',
                'price' => 450.00,
                'stock' => 3,
                'sku' => 'PINT-002',
                'translations' => [
                    'es' => [
                        'name' => 'Sagrado Corazón de Jesús',
                        'description' => 'Pintura devocional del Sagrado Corazón de Jesús con marco dorado.',
                    ],
                    'en' => [
                        'name' => 'Sacred Heart of Jesus',
                        'description' => 'Devotional painting of the Sacred Heart of Jesus with gold frame.',
                    ],
                ],
            ],
            [
                'category_slug' => 'esculturas',
                'vendor_email' => 'juan@artecatolica.com',
                'price' => 280.00,
                'stock' => 8,
                'sku' => 'ESC-001',
                'translations' => [
                    'es' => [
                        'name' => 'Cristo Crucificado',
                        'description' => 'Escultura de madera tallada a mano, representando a Cristo en la cruz.',
                    ],
                    'en' => [
                        'name' => 'Crucified Christ',
                        'description' => 'Hand-carved wood sculpture representing Christ on the cross.',
                    ],
                ],
            ],
            [
                'category_slug' => 'esculturas',
                'vendor_email' => 'juan@artecatolica.com',
                'price' => 320.00,
                'stock' => 6,
                'sku' => 'ESC-002',
                'translations' => [
                    'es' => [
                        'name' => 'Virgen María',
                        'description' => 'Escultura de la Virgen María en mármol blanco.',
                    ],
                    'en' => [
                        'name' => 'Virgin Mary',
                        'description' => 'White marble sculpture of the Virgin Mary.',
                    ],
                ],
            ],
            [
                'category_slug' => 'iconos',
                'vendor_email' => 'ana@artecatolica.com',
                'price' => 180.00,
                'stock' => 10,
                'sku' => 'ICO-001',
                'translations' => [
                    'es' => [
                        'name' => 'Icono de San Miguel Arcángel',
                        'description' => 'Icono bizantino pintado a mano sobre tabla de madera.',
                    ],
                    'en' => [
                        'name' => 'Icon of Saint Michael the Archangel',
                        'description' => 'Hand-painted Byzantine icon on wood panel.',
                    ],
                ],
            ],
            [
                'category_slug' => 'crucifijos',
                'vendor_email' => 'juan@artecatolica.com',
                'price' => 95.00,
                'stock' => 15,
                'sku' => 'CRU-001',
                'translations' => [
                    'es' => [
                        'name' => 'Crucifijo de Bronce',
                        'description' => 'Crucifijo artesanal en bronce con base de madera.',
                    ],
                    'en' => [
                        'name' => 'Bronze Crucifix',
                        'description' => 'Handcrafted bronze crucifix with wood base.',
                    ],
                ],
            ],
        ];

        foreach ($products as $productData) {
            $category = $categories->firstWhere('slug', $productData['category_slug']);
            $vendor = $vendors->firstWhere('email', $productData['vendor_email']);

            if (!$category || !$vendor) {
                continue;
            }

            $product = Product::create([
                'vendor_id' => $vendor->id,
                'category_id' => $category->id,
                'price' => $productData['price'],
                'stock' => $productData['stock'],
                'sku' => $productData['sku'],
                'is_active' => true,
                'is_featured' => false,
            ]);

            // Crear traducciones
            foreach ($productData['translations'] as $locale => $translation) {
                ProductTranslation::create([
                    'product_id' => $product->id,
                    'locale' => $locale,
                    'name' => $translation['name'],
                    'description' => $translation['description'],
                ]);
            }

            // Crear imagen de ejemplo (placeholder)
            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => '/images/products/placeholder.jpg',
                'order' => 1,
                'is_primary' => true,
            ]);
        }
    }
}
