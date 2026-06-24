import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";
import fs from "fs";
import path from "path";

// Safely load environment variables from .env file at configuration/build time
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const firstEqual = trimmed.indexOf("=");
        if (firstEqual !== -1) {
          const key = trimmed.substring(0, firstEqual).trim();
          let val = trimmed.substring(firstEqual + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // Silent fallback
}

const enableDashboard = process.env.ENABLE_DASHBOARD === "true";
console.log("[DEBUG Routes] enableDashboard evaluated as:", enableDashboard, "| process.env.ENABLE_DASHBOARD:", process.env.ENABLE_DASHBOARD);

const routes = [
  index("routes/home.tsx"),
  route("shop", "routes/shop.tsx"),
  route("product-category/:slug", "routes/product-category.$slug.tsx"),
  route("shop/:id", "routes/shop.$id.tsx"),
  route("flash-sale", "routes/flash-sale.tsx"),
  route("product-tag/new-arrivals", "routes/new-arrivals.tsx"),
  route("my-account", "routes/my-account.tsx"),
  route("cart", "routes/cart.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("trust", "routes/trust.tsx"),
  route("why-us", "routes/why-us.tsx"),
  route("sustainability", "routes/sustainability.tsx"),
  route("about-us", "routes/about-us.tsx"),
  route("quality-management", "routes/quality-management.tsx"),
  route("terms-and-conditions", "routes/terms-and-conditions.tsx"),
  route("privacy-policy", "routes/privacy-policy.tsx"),
  route("food-comparison", "routes/food-comparison.tsx"),
  route("brochures", "routes/brochures.tsx"),
  route("see-all-our-stores", "routes/see-all-our-stores.tsx"),
  route("retail-locations-nairobi-nanyuki-naivasha-nakuru-mombasa", "routes/retail-locations.tsx"),
  route("blog", "routes/blog.tsx"),
  
  // API
  route("api/order", "routes/api.order.ts"),
  route("api/search", "routes/api.search.ts"),

  // Catch-all category page route
  route(":slug", "routes/catch-all-category.tsx"),
];

if (enableDashboard) {
  routes.push(
    // Admin login page (no layout wrapper)
    route("admin/login", "routes/admin.login.tsx"),

    // Admin routes (with layout wrapper for auth & sidebar)
    layout("routes/admin.tsx", [
      route("admin", "routes/admin._index.tsx"),
      route("admin/orders", "routes/admin.orders.tsx"),
      route("admin/products", "routes/admin.products.tsx"),
      route("admin/prices", "routes/admin.prices.tsx"),
      route("admin/blogs", "routes/admin.blogs.tsx"),
    ]),

    // Premium WordPress-Style Admin Backend Routes
    route("/store_backend", "routes/store_backend.tsx", [
      index("routes/store_backend.dashboard.tsx"),
      route("products", "routes/store_backend.products.tsx"),
      route("users", "routes/store_backend.users.tsx"),
      route("orders", "routes/store_backend.orders.tsx"),
      route("customers", "routes/store_backend.customers.tsx"),
      route("coupons", "routes/store_backend.coupons.tsx"),
      route("pages", "routes/store_backend.pages.tsx"),
      route("comments", "routes/store_backend.comments.tsx"),
      route("history", "routes/store_backend.history.tsx"),
      route("posts", "routes/store_backend.posts.tsx"),
      route("media", "routes/store_backend.media.tsx"),
      route("downloads", "routes/store_backend.downloads.tsx"),
      route("analytics", "routes/store_backend.analytics.tsx"),
      route("settings", "routes/store_backend.settings.tsx"),
    ]),
    route("/store_backend/login", "routes/store_backend.login.tsx")
  );
}

export default routes satisfies RouteConfig;
