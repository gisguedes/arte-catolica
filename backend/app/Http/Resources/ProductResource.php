<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\VendorResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = $request->header('Accept-Language', 'es');

        return [
            'id' => $this->id,
            'vendor_id' => $this->vendor_id,
            'price' => $this->price,
            'stock' => $this->stock,
            'sku' => $this->sku,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'name' => $this->translate($locale)?->name ?? $this->translate('es')?->name ?? '',
            'description' => $this->translate($locale)?->description ?? $this->translate('es')?->description ?? '',
            'image' => $this->image,
            'vendor' => new VendorResource($this->whenLoaded('vendor')),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'translations' => $this->whenLoaded('translations'),
            'images' => $this->whenLoaded('images'),
        ];
    }
}
