import type { LoaderFunctionArgs } from "react-router";

// In-memory cache for Google Reviews
interface Review {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

let cachedReviews: Review[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours caching

export async function loader({ request }: LoaderFunctionArgs) {
  const now = Date.now();
  
  // If cache is fresh, return cached reviews
  if (cachedReviews && (now - lastFetchTime < CACHE_TTL)) {
    return Response.json({ success: true, reviews: cachedReviews, source: "cache" });
  }

  const apiKey = process.env.GOOGLE_API_KEY || "";
  const placeId = process.env.GOOGLE_PLACE_ID || "";

  if (!apiKey || !placeId) {
    return Response.json({ 
      success: false, 
      message: "Google API credentials not configured in environment.",
      reviews: [] 
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=reviews&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.result && Array.isArray(data.result.reviews)) {
      const fetchedReviews: Review[] = data.result.reviews
        .filter((r: any) => r.rating >= 4) // Only show 4 and 5 star reviews
        .map((r: any) => ({
          author_name: r.author_name || "PetStore Kenya Customer",
          profile_photo_url: r.profile_photo_url || "",
          rating: r.rating || 5,
          relative_time_description: r.relative_time_description || "recently",
          text: r.text || ""
        }));

      cachedReviews = fetchedReviews;
      lastFetchTime = now;

      return Response.json({ success: true, reviews: fetchedReviews, source: "google" });
    } else {
      console.warn("[Google Reviews API] Non-OK status from Google:", data.status, data.error_message || "");
      // If we have stale cache, return it rather than failing
      if (cachedReviews) {
        return Response.json({ success: true, reviews: cachedReviews, source: "stale-cache" });
      }
      return Response.json({ success: false, status: data.status, message: data.error_message || "Failed to fetch from Google", reviews: [] });
    }
  } catch (err: any) {
    console.error("[Google Reviews API] Fetch failed:", err);
    if (cachedReviews) {
      return Response.json({ success: true, reviews: cachedReviews, source: "stale-cache" });
    }
    return Response.json({ success: false, message: err.message || "Fetch error", reviews: [] });
  }
}
