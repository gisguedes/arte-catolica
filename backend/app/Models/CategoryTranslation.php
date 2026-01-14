<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategoryTranslation extends Model
{
    use HasUuids, HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';


    protected $fillable = [
        'category_id',
        'locale',
        'name',
        'description',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
