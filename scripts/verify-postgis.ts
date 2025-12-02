
import { searchFoodBanks } from "../src/lib/food-bank-queries";

async function verify() {
    console.log("Testing PostGIS search...");

    // Sacramento coordinates
    const sacramento = { lat: 38.5816, lng: -121.4944 };

    const results = await searchFoodBanks({
        userLocation: sacramento,
        maxDistance: 10, // miles
        limit: 5
    });

    console.log(`Found ${results.length} resources within 10 miles of Sacramento:`);
    results.forEach(r => {
        console.log(`- ${r.name} (${r.distance.toFixed(2)} miles)`);
    });

    process.exit(0);
}

verify();
