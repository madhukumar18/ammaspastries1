<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CategoryImage;

class CategoryImagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (CategoryImage::count() === 0) {
            foreach (CategoryImage::getDefaultCategories() as $cat) {
                CategoryImage::create($cat);
            }
        }
    }
}
