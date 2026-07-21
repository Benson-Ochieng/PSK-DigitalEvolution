export async function clearAllCaches() {
  try {
    const { clearShopCache } = await import("../routes/shop");
    clearShopCache();
  } catch (e) {
    console.error("Failed to clear shop cache:", e);
  }
  try {
    const { clearNewArrivalsCache } = await import("../routes/new-arrivals");
    clearNewArrivalsCache();
  } catch (e) {
    console.error("Failed to clear new-arrivals cache:", e);
  }
  try {
    const { clearSearchCache } = await import("./search.server");
    clearSearchCache();
  } catch (e) {
    console.error("Failed to clear search cache:", e);
  }
  console.log("⚡ All frontend caches cleared successfully!");
}
