<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasUuids, HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';


    protected $fillable = [
        'slug',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // Relaciones
    public function translations()
    {
        return $this->hasMany(CategoryTranslation::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
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
}
