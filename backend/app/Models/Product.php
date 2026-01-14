<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasUuids, HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';


    protected $fillable = [
        'vendor_id',
        'category_id',
        'price',
        'stock',
        'sku',
        'is_active',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    // Relaciones
    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function translations()
    {
        return $this->hasMany(ProductTranslation::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    // Helper para obtener traducción en un idioma específico
    public function translate(string $locale = 'es')
    {
        return $this->translations()->where('locale', $locale)->first();
    }

    // Accessor para name y description
    public function getNameAttribute()
    {
        return $this->translate()?->name ?? '';
    }

    public function getDescriptionAttribute()
    {
        return $this->translate()?->description ?? '';
    }

    public function getImageAttribute()
    {
        return $this->primaryImage?->image_path ?? $this->images()->first()?->image_path;
    }
}
