<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
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
            'slug' => $this->slug,
            'name' => $this->translate($locale)?->name ?? $this->translate('es')?->name ?? '',
            'description' => $this->translate($locale)?->description ?? $this->translate('es')?->description ?? '',
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
