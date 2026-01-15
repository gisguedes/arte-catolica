<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VendorController extends Controller
{
    /**
     * Display a listing of vendors.
     */
    public function index(): AnonymousResourceCollection
    {
        $vendors = Vendor::with(['user', 'artistTypes'])
            ->where('is_active', true)
            ->get();

        return VendorResource::collection($vendors);
    }

    /**
     * Display the specified vendor.
     */
    public function show(string $id): VendorResource
    {
        $vendor = Vendor::with(['user', 'artistTypes'])
            ->findOrFail($id);

        return new VendorResource($vendor);
    }

    /**
     * Get products for a specific vendor.
     */
    public function products(Request $request, string $id): AnonymousResourceCollection
    {
        $vendor = Vendor::findOrFail($id);

        $products = $vendor->products()
            ->with(['translations', 'images', 'category'])
            ->where('is_active', true)
            ->get();

        return ProductResource::collection($products);
    }
}
