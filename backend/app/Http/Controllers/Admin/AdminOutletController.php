<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Outlet;

class AdminOutletController extends Controller
{
    public function index()
    {
        $outlets = Outlet::orderBy('name', 'asc')->get();
        return response()->json(['success' => true, 'data' => $outlets]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:outlets',
            'address' => 'required|string',
            'area' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'pincode' => 'required|string|max:10',
            'map_link' => 'nullable|string|max:1000',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'phone' => 'required|string|max:20',
            'opening_time' => 'required|string|max:20',
            'closing_time' => 'required|string|max:20',
            'is_active' => 'boolean',
            'rista_store_id' => 'nullable|string|max:100',
            'rista_pos_enabled' => 'nullable|boolean',
        ]);

        // 1. If Google Maps link provided, extract coordinates from it
        if (!empty($validated['map_link'])) {
            $coords = $this->extractCoordsFromMapLink($validated['map_link']);
            if ($coords) {
                $validated['latitude'] = $coords['lat'];
                $validated['longitude'] = $coords['lng'];
            }
        }

        // 2. If lat/lng still empty, auto-geocode address via Google Geocoding API
        if (empty($validated['latitude']) || empty($validated['longitude'])) {
            $coords = $this->autoGeocode(
                $validated['address'],
                $validated['area'],
                $validated['city'],
                $validated['pincode']
            );
            if ($coords) {
                $validated['latitude'] = $coords['lat'];
                $validated['longitude'] = $coords['lng'];
            }
        }

        $outlet = Outlet::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Outlet added successfully with GPS coordinates!',
            'data' => $outlet,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $outlet = Outlet::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => "sometimes|required|string|max:50|unique:outlets,code,{$id}",
            'address' => 'sometimes|required|string',
            'area' => 'sometimes|required|string|max:100',
            'city' => 'sometimes|required|string|max:100',
            'state' => 'sometimes|required|string|max:100',
            'pincode' => 'sometimes|required|string|max:10',
            'map_link' => 'nullable|string|max:1000',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'phone' => 'sometimes|required|string|max:20',
            'opening_time' => 'sometimes|required|string|max:20',
            'closing_time' => 'sometimes|required|string|max:20',
            'is_active' => 'boolean',
            'rista_store_id' => 'nullable|string|max:100',
            'rista_pos_enabled' => 'nullable|boolean',
        ]);

        $mapLinkChanged = isset($validated['map_link']) && $validated['map_link'] !== $outlet->map_link;
        $addressChanged = isset($validated['address']) && $validated['address'] !== $outlet->address;
        $areaChanged = isset($validated['area']) && $validated['area'] !== $outlet->area;

        // 1. If Google Maps link provided (or updated), extract coordinates
        $currentMapLink = $validated['map_link'] ?? $outlet->map_link;
        if (!empty($currentMapLink) && ($mapLinkChanged || empty($validated['latitude']) || empty($validated['longitude']))) {
            $coords = $this->extractCoordsFromMapLink($currentMapLink);
            if ($coords) {
                $validated['latitude'] = $coords['lat'];
                $validated['longitude'] = $coords['lng'];
            }
        }

        // 2. If lat/lng still empty OR address changed without explicit map link, auto-geocode address
        if (empty($validated['latitude']) || empty($validated['longitude']) || (($addressChanged || $areaChanged) && empty($currentMapLink))) {
            $addr = $validated['address'] ?? $outlet->address;
            $area = $validated['area'] ?? $outlet->area;
            $city = $validated['city'] ?? $outlet->city;
            $pin = $validated['pincode'] ?? $outlet->pincode;

            $coords = $this->autoGeocode($addr, $area, $city, $pin);
            if ($coords) {
                $validated['latitude'] = $coords['lat'];
                $validated['longitude'] = $coords['lng'];
            }
        }

        $outlet->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Outlet updated successfully with GPS coordinates!',
            'data' => $outlet,
        ]);
    }

    /**
     * Endpoint to parse a Google Maps link and return coordinates
     */
    public function parseMapLink(Request $request)
    {
        $request->validate(['url' => 'required|string']);
        $coords = $this->extractCoordsFromMapLink($request->url);

        if ($coords) {
            return response()->json([
                'success' => true,
                'coordinates' => $coords,
                'message' => 'Coordinates successfully detected from Google Maps link',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Could not detect GPS coordinates from this link.',
        ], 422);
    }

    /**
     * Extract coordinates from various Google Maps URL formats or short links
     */
    public function extractCoordsFromMapLink($url)
    {
        if (empty($url)) return null;
        $url = trim($url);

        // 1. Check directly in URL string
        $coords = $this->parseCoordsFromString($url);
        if ($coords) return $coords;

        // 2. If it's a short URL (maps.app.goo.gl or goo.gl/maps), expand redirects
        try {
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->timeout(8)
                ->withOptions(['allow_redirects' => true])
                ->get($url);

            $effectiveUri = (string) $response->effectiveUri();
            if ($effectiveUri && $effectiveUri !== $url) {
                $coords = $this->parseCoordsFromString($effectiveUri);
                if ($coords) return $coords;
            }

            // Check response body if coordinates are inside meta tags or scripts
            $body = $response->body();
            $coords = $this->parseCoordsFromString($body);
            if ($coords) return $coords;

        } catch (\Exception $e) {
            \Log::warning('Error resolving Google Maps link: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Parse coordinates from a URL string or HTML content
     */
    public function parseCoordsFromString($str)
    {
        if (empty($str)) return null;

        // Pattern 1: @lat,lng, e.g. /@13.0551932,77.6422206,17z
        if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $str, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        // Pattern 2: !3dlat!4dlng (Google Maps share / embed data)
        if (preg_match('/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/', $str, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        // Pattern 3: query parameters: q=lat,lng or ll=lat,lng or query=lat,lng
        if (preg_match('/[?&](?:q|ll|query)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/', $str, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        // Pattern 4: /place/.../lat,lng
        if (preg_match('/\/place\/[^\/]+\/(-?\d+\.\d+),(-?\d+\.\d+)/', $str, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        // Pattern 5: center=lat,lng
        if (preg_match('/center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/', $str, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        return null;
    }

    private function autoGeocode($address, $area, $city, $pincode = '')
    {
        $query = "{$address}, {$area}, {$city} {$pincode}";
        $apiKey = env('GOOGLE_GEOCODING_API_KEY', '***REMOVED_GOOGLE_API_KEY***');

        try {
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->timeout(8)
                ->get('https://maps.googleapis.com/maps/api/geocode/json', [
                    'address' => $query,
                    'components' => 'country:IN',
                    'key' => $apiKey,
                ]);

            if ($response->ok() && !empty($response->json()['results'][0]['geometry']['location'])) {
                return $response->json()['results'][0]['geometry']['location'];
            }

            // Fallback try area + city
            $areaQuery = "{$area}, {$city}, Karnataka, India";
            $areaResponse = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->timeout(8)
                ->get('https://maps.googleapis.com/maps/api/geocode/json', [
                    'address' => $areaQuery,
                    'components' => 'country:IN',
                    'key' => $apiKey,
                ]);

            if ($areaResponse->ok() && !empty($areaResponse->json()['results'][0]['geometry']['location'])) {
                return $areaResponse->json()['results'][0]['geometry']['location'];
            }
        } catch (\Exception $e) {
            \Log::warning('Auto-geocoding outlet failed: ' . $e->getMessage());
        }

        return null;
    }

    public function destroy($id)
    {
        $outlet = Outlet::withTrashed()->findOrFail($id);

        // 1. Detach associated orders so order history remains intact without foreign key conflicts
        \App\Models\Order::where('outlet_id', $outlet->id)->update(['outlet_id' => null]);

        // 2. Clean up product availability mapping if table exists
        if (\Illuminate\Support\Facades\Schema::hasTable('outlet_product_availability')) {
            \Illuminate\Support\Facades\DB::table('outlet_product_availability')
                ->where('outlet_id', $outlet->id)
                ->delete();
        }

        // 3. Remove the outlet record
        $outlet->forceDelete();

        return response()->json([
            'success' => true,
            'message' => "Outlet '{$outlet->name}' has been deleted successfully.",
        ]);
    }
}
