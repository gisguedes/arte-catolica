<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::with(['vendor', 'category', 'translations', 'images']);

        // Filtrar por categoría si se proporciona
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Solo productos activos
        $query->where('is_active', true);

        $products = $query->get();

        return ProductResource::collection($products);
    }

    /**
     * Display the specified product.
     */
    public function show(Request $request, string $id): ProductResource
    {
        $product = Product::with(['vendor', 'category', 'translations', 'images'])
            ->findOrFail($id);

        return new ProductResource($product);
    }
}
