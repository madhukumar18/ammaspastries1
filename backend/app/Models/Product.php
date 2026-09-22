<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'sku',
        'category_id',
        'subcategory_id',
        'short_description',
        'description',
        'base_price',
        'discount_price',
        'weight',
        'portion_type',
        'portion_unit',
        'portion_step',
        'piece_price',
        'piece_limit',
        'piece_min',
        'is_eggless',
        'stock',
        'is_available',
        'is_featured',
        'is_popular',
        'is_new_arrival',
        'is_gifting',
        'image_url',
        'egg_price',
        'eggless_price',
        'shapes',
        'flavours',
        'cupcake_variants',
        'snack_variants',
        'theme_cake_default_weight',
        'theme_cake_default_price',
        'theme_cake_step_size',
        'theme_cake_price_tiers',
        'dessert_min_quantity',
        'dessert_default_price',
        'dessert_step_size',
        'dessert_price_tiers',
        'dry_fruit_pack_options',
        'chocolate_pack_options',
        'chocolate_pricing_type',
        'sell_by_kg',
        'kg_step',
        'kg_default',
        'kg_max',
        'kg_price',
        'sell_by_pieces',
        'piece_default',
        'piece_step',
        'piece_max',
        'enable_fixed_weight_pricing',
        'fixed_weight_options',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'float',
            'discount_price' => 'float',
            'egg_price' => 'float',
            'eggless_price' => 'float',
            'piece_price' => 'float',
            'piece_limit' => 'integer',
            'piece_min' => 'integer',
            'is_eggless' => 'boolean',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'is_popular' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_gifting' => 'boolean',
            'stock' => 'integer',
            'shapes' => 'array',
            'flavours' => 'array',
            'cupcake_variants' => 'array',
            'snack_variants' => 'array',
            'theme_cake_default_weight' => 'float',
            'theme_cake_default_price' => 'float',
            'theme_cake_step_size' => 'float',
            'theme_cake_price_tiers' => 'array',
            'dessert_min_quantity' => 'integer',
            'dessert_default_price' => 'float',
            'dessert_step_size' => 'integer',
            'dessert_price_tiers' => 'array',
            'dry_fruit_pack_options' => 'array',
            'chocolate_pack_options' => 'array',
            'chocolate_pricing_type' => 'string',
            'sell_by_kg' => 'boolean',
            'kg_step' => 'float',
            'kg_default' => 'float',
            'kg_max' => 'float',
            'kg_price' => 'float',
            'sell_by_pieces' => 'boolean',
            'piece_default' => 'integer',
            'piece_step' => 'integer',
            'piece_max' => 'integer',
            'enable_fixed_weight_pricing' => 'boolean',
            'fixed_weight_options' => 'array',
        ];
    }

    /**
     * Always normalize image_url to relative /storage/... so it loads over tunnels & mobile
     */
    public function getImageUrlAttribute($value)
    {
        if (empty($value)) return $value;
        if (str_contains($value, '/storage/')) {
            return substr($value, strpos($value, '/storage/'));
        }
        return $value;
    }

    /**
     * Check if product belongs to Theme Cakes category
     */
    public function isThemeCake(): bool
    {
        return ($this->category_id == 8) ||
            ($this->category && (
                $this->category->slug === 'theme-cakes' ||
                str_contains(strtolower($this->category->name), 'theme')
            ));
    }

    /**
     * Check if product belongs to Dessert category
     */
    public function isDessert(): bool
    {
        return ($this->category_id == 3) ||
            ($this->category && (
                $this->category->slug === 'dessert' ||
                str_contains(strtolower($this->category->name), 'dessert')
            ));
    }

    /**
     * Check if product belongs to Dry Fruits category
     */
    public function isDryFruit(): bool
    {
        return ($this->category_id == 4) ||
            ($this->category && (
                $this->category->slug === 'dry-fruits' ||
                str_contains(strtolower($this->category->name), 'dry fruit') ||
                str_contains(strtolower($this->category->slug), 'dry-fruit')
            ));
    }

    /**
     * Get validated and normalized discrete pack options for Dry Fruit
     */
    public function getDryFruitPacks(): array
    {
        if (empty($this->dry_fruit_pack_options) || !is_array($this->dry_fruit_pack_options)) {
            return [];
        }

        $normalized = [];
        foreach ($this->dry_fruit_pack_options as $pack) {
            if (!isset($pack['weight'], $pack['price']) || (float) $pack['weight'] <= 0 || (float) $pack['price'] <= 0) {
                continue;
            }
            $unit = strtolower(trim($pack['unit'] ?? 'g'));
            if ($unit === 'kilograms' || $unit === 'kilogram') $unit = 'kg';
            if ($unit === 'grams' || $unit === 'gram') $unit = 'g';
            if (!in_array($unit, ['g', 'kg'])) $unit = 'g';

            $weight = (float) $pack['weight'];
            $label = ($weight == (int) $weight ? (int) $weight : $weight) . $unit;

            $normalized[] = [
                'weight' => $weight,
                'unit' => $unit,
                'label' => $label,
                'price' => round((float) $pack['price'], 2),
            ];
        }

        return $normalized;
    }

    /**
     * Calculate price for selected pack size and number of packs
     * Formula: pack_price * number_of_packs (No continuous or per-kg scaling)
     */
    public function calculateDryFruitPrice(float $packWeight, string $packUnit, int $numberOfPacks = 1): ?float
    {
        $unit = strtolower(trim($packUnit));
        if ($unit === 'grams' || $unit === 'gram') $unit = 'g';
        if ($unit === 'kilograms' || $unit === 'kilogram') $unit = 'kg';

        $packs = $this->getDryFruitPacks();
        foreach ($packs as $pack) {
            if (abs($pack['weight'] - $packWeight) < 0.001 && $pack['unit'] === $unit) {
                $count = max(1, $numberOfPacks);
                return round($pack['price'] * $count, 2);
            }
        }

        return null;
    }

    /**
     * Check if product belongs to Chocolates category
     */
    public function isChocolate(): bool
    {
        return ($this->category_id == 5) ||
            ($this->category && (
                $this->category->slug === 'chocolates' ||
                str_contains(strtolower($this->category->name), 'chocolate') ||
                str_contains(strtolower($this->category->slug), 'chocolate')
            ));
    }

    /**
     * Get validated and normalized chocolate pack options
     */
    public function getChocolatePacks(): array
    {
        if (empty($this->chocolate_pack_options) || !is_array($this->chocolate_pack_options)) {
            return [];
        }

        $normalized = [];
        foreach ($this->chocolate_pack_options as $pack) {
            if (!isset($pack['weight'], $pack['price']) || (float) $pack['weight'] <= 0 || (float) $pack['price'] <= 0) {
                continue;
            }
            $unit = strtolower(trim($pack['unit'] ?? 'g'));
            if ($unit === 'kilograms' || $unit === 'kilogram') $unit = 'kg';
            if ($unit === 'grams' || $unit === 'gram') $unit = 'g';
            if (!in_array($unit, ['g', 'kg'])) $unit = 'g';

            $weight = (float) $pack['weight'];
            $label = ($weight == (int) $weight ? (int) $weight : $weight) . $unit;

            $normalized[] = [
                'weight' => $weight,
                'unit' => $unit,
                'label' => $label,
                'price' => round((float) $pack['price'], 2),
            ];
        }

        return $normalized;
    }

    /**
     * Calculate price for selected chocolate pack size and number of packs
     */
    public function calculateChocolatePrice(float $packWeight, string $packUnit, int $numberOfPacks = 1): ?float
    {
        $unit = strtolower(trim($packUnit));
        if ($unit === 'grams' || $unit === 'gram') $unit = 'g';
        if ($unit === 'kilograms' || $unit === 'kilogram') $unit = 'kg';

        $packs = $this->getChocolatePacks();
        foreach ($packs as $pack) {
            if (abs($pack['weight'] - $packWeight) < 0.001 && $pack['unit'] === $unit) {
                $count = max(1, $numberOfPacks);
                return round($pack['price'] * $count, 2);
            }
        }

        return null;
    }

    /**
     * Calculate price for selected piece count on Chocolate
     */
    public function calculateChocolatePiecePrice(int $pieces = 1): float
    {
        $unitPrice = (float) ($this->piece_price ?: $this->base_price ?: 0);
        return round($unitPrice * max(1, $pieces), 2);
    }

    /**
     * Calculate price for selected quantity on Dessert
     * Uses custom tiers if override exists, otherwise linear formula:
     * price_per_piece = default_price / default_minimum_quantity
     * total_price = price_per_piece * selected_quantity
     */
    public function calculateDessertPrice(int $quantity): float
    {
        $minQty = max(1, (int) ($this->dessert_min_quantity ?: 1));
        $effectiveQty = max($minQty, $quantity);

        // 1. Check custom tiers first
        if (!empty($this->dessert_price_tiers) && is_array($this->dessert_price_tiers)) {
            foreach ($this->dessert_price_tiers as $tier) {
                if (isset($tier['quantity'], $tier['price']) && (int) $tier['quantity'] === $effectiveQty && (float) $tier['price'] > 0) {
                    return round((float) $tier['price'], 2);
                }
            }
        }

        // 2. Unit price per piece if configured
        if ($this->piece_price && (float) $this->piece_price > 0) {
            return round((float) $this->piece_price * $effectiveQty, 2);
        }

        // 3. Linear formula based on admin's default price for minimum quantity
        $defPrice = (float) ($this->dessert_default_price ?: $this->base_price ?: 100.0);
        $pricePerPiece = $minQty > 0 ? ($defPrice / $minQty) : $defPrice;

        return round($pricePerPiece * $effectiveQty, 2);
    }

    /**
     * Calculate price for selected weight on Theme Cake
     * Uses custom tiers if override exists, otherwise proportional formula
     */
    public function calculateThemeCakePrice(float $selectedWeight): float
    {
        $defaultWeight = (float) ($this->theme_cake_default_weight ?: 5.0);
        $defaultPrice = (float) ($this->theme_cake_default_price ?: $this->base_price);

        if ($defaultWeight <= 0) {
            return $defaultPrice;
        }

        // 1. Check custom tiers first
        if (!empty($this->theme_cake_price_tiers) && is_array($this->theme_cake_price_tiers)) {
            foreach ($this->theme_cake_price_tiers as $tier) {
                if (isset($tier['weight']) && isset($tier['price'])) {
                    if (abs((float) $tier['weight'] - $selectedWeight) < 0.001) {
                        return (float) $tier['price'];
                    }
                }
            }
        }

        // 2. Proportional pricing formula: (default_price / default_weight) * selected_weight
        $pricePerKg = $defaultPrice / $defaultWeight;
        return round($pricePerKg * $selectedWeight, 2);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('display_order', 'asc');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews()
    {
        return $this->hasMany(Review::class)->where('is_approved', true);
    }
}
