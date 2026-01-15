<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasUuids, HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';


    protected $fillable = [
        'user_id',
        'name',
        'surname',
        'email',
        'phone',
        'nif',
        'bio',
        'image',
        'website',
        'city',
        'country',
        'postal_code',
        'opening_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'opening_date' => 'date',
        ];
    }

    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_vendor_relations')
            ->withPivot('role', 'is_active')
            ->withTimestamps();
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function artistTypes()
    {
        return $this->belongsToMany(ArtistType::class)->withTimestamps();
    }

    public function bankAccounts()
    {
        return $this->hasMany(VendorBankAccount::class);
    }
}
