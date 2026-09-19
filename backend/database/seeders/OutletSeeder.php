<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Outlet;

class OutletSeeder extends Seeder
{
    public function run(): void
    {
        $outlets = [
            [
                'name' => 'Ammas Pastries - Indiranagar Flagship',
                'code' => 'AMP-IND',
                'rista_store_id' => 'RSTA_STORE_101',
                'address' => '100 Feet Road, HAL 2nd Stage, Indiranagar',
                'area' => 'Indiranagar',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560038',
                'phone' => '+91 98450 11001',
                'latitude' => 12.9784,
                'longitude' => 77.6408,
                'map_link' => 'https://maps.google.com/?q=12.9784,77.6408',
                'opening_time' => '09:00:00',
                'closing_time' => '22:30:00',
                'is_active' => true,
                'rista_pos_enabled' => true,
            ],
            [
                'name' => 'Ammas Pastries - Koramangala',
                'code' => 'AMP-KOR',
                'rista_store_id' => 'RSTA_STORE_102',
                'address' => '80 Feet Road, 5th Block, Koramangala',
                'area' => 'Koramangala',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560095',
                'phone' => '+91 98450 11002',
                'latitude' => 12.9352,
                'longitude' => 77.6245,
                'map_link' => 'https://maps.google.com/?q=12.9352,77.6245',
                'opening_time' => '09:00:00',
                'closing_time' => '23:00:00',
                'is_active' => true,
                'rista_pos_enabled' => true,
            ],
            [
                'name' => 'Ammas Pastries - MG Road',
                'code' => 'AMP-MGR',
                'rista_store_id' => 'RSTA_STORE_103',
                'address' => 'Prestige Meridian, MG Road',
                'area' => 'MG Road',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560001',
                'phone' => '+91 98450 11003',
                'latitude' => 12.9756,
                'longitude' => 77.6066,
                'map_link' => 'https://maps.google.com/?q=12.9756,77.6066',
                'opening_time' => '08:30:00',
                'closing_time' => '22:30:00',
                'is_active' => true,
                'rista_pos_enabled' => true,
            ],
            [
                'name' => 'Ammas Pastries - Whitefield',
                'code' => 'AMP-WHI',
                'rista_store_id' => 'RSTA_STORE_104',
                'address' => 'ITPL Main Road, opposite Forum Shantiniketan, Whitefield',
                'area' => 'Whitefield',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560066',
                'phone' => '+91 98450 11004',
                'latitude' => 12.9698,
                'longitude' => 77.7499,
                'map_link' => 'https://maps.google.com/?q=12.9698,77.7499',
                'opening_time' => '09:00:00',
                'closing_time' => '22:30:00',
                'is_active' => true,
                'rista_pos_enabled' => true,
            ],
            [
                'name' => 'Ammas Pastries - Jayanagar',
                'code' => 'AMP-JAY',
                'rista_store_id' => 'RSTA_STORE_105',
                'address' => '11th Main Road, 4th Block, Jayanagar',
                'area' => 'Jayanagar',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560011',
                'phone' => '+91 98450 11005',
                'latitude' => 12.9250,
                'longitude' => 77.5938,
                'map_link' => 'https://maps.google.com/?q=12.9250,77.5938',
                'opening_time' => '09:00:00',
                'closing_time' => '22:00:00',
                'is_active' => true,
                'rista_pos_enabled' => true,
            ],
            [
                'name' => 'Ammas Pastries - Kothanur (Hennur Road)',
                'code' => 'BLR-KOT',
                'rista_store_id' => 'RSTA_STORE_106',
                'address' => 'Byrathi Cross, Hennur Bagalur Main Road, Kothanur',
                'area' => 'Kothanur',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560077',
                'phone' => '+91 98450 11006',
                'latitude' => 13.0552,
                'longitude' => 77.6422,
                'map_link' => 'https://maps.google.com/?q=13.0552,77.6422',
                'opening_time' => '09:00:00',
                'closing_time' => '22:30:00',
                'is_active' => true,
                'rista_pos_enabled' => true,
            ],
        ];

        foreach ($outlets as $outletData) {
            Outlet::updateOrCreate(
                ['code' => $outletData['code']],
                $outletData
            );
        }
    }
}
