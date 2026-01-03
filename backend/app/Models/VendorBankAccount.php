<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VendorBankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'bank_name',
        'account_holder_name',
        'iban',
        'swift_bic',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }
}
