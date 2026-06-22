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
  route("/vp-backend", "routes/vp-backend.tsx", [
    index("routes/vp-backend.dashboard.tsx"),
    route("products", "routes/vp-backend.products.tsx"),
    route("users", "routes/vp-backend.users.tsx"),
    route("orders", "routes/vp-backend.orders.tsx"),
    route("customers", "routes/vp-backend.customers.tsx"),
    route("coupons", "routes/vp-backend.coupons.tsx"),
    route("pages", "routes/vp-backend.pages.tsx"),
    route("comments", "routes/vp-backend.comments.tsx"),
    route("history", "routes/vp-backend.history.tsx"),
    route("posts", "routes/vp-backend.posts.tsx"),
    route("media", "routes/vp-backend.media.tsx"),
    route("downloads", "routes/vp-backend.downloads.tsx"),
    route("analytics", "routes/vp-backend.analytics.tsx"),
    route("settings", "routes/vp-backend.settings.tsx"),
  ]),
  route("/vp-backend/login", "routes/vp-backend.login.tsx"),
] satisfies RouteConfig;
