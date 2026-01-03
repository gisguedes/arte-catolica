<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'provider',
        'last_four',
        'cardholder_name',
        'expires_at',
        'is_default',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'date',
            'is_default' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
