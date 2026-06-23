import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
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
  
  // API
  route("api/order", "routes/api.order.ts"),
  route("api/search", "routes/api.search.ts"),

  // Admin login page (no layout wrapper)
  route("admin/login", "routes/admin.login.tsx"),

  // Admin routes (with layout wrapper for auth & sidebar)
  layout("routes/admin.tsx", [
    route("admin", "routes/admin._index.tsx"),
    route("admin/orders", "routes/admin.orders.tsx"),
    route("admin/products", "routes/admin.products.tsx"),
    route("admin/prices", "routes/admin.prices.tsx"),
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
  route("/store_backend/login", "routes/store_backend.login.tsx"),
] satisfies RouteConfig;
