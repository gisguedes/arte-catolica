<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $categories = Category::with('translations')
            ->where('is_active', true)
            ->get();

        return CategoryResource::collection($categories);
    }

    /**
     * Display the specified category.
     */
    public function show(Request $request, string $id): CategoryResource
    {
        $category = Category::with('translations')
            ->findOrFail($id);

        return new CategoryResource($category);
    }
}
