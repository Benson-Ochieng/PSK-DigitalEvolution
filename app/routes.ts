import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("shop", "routes/shop.tsx"),
  route("product-category/:slug", "routes/product-category.$slug.tsx"),
  route("shop/:id", "routes/shop.$id.tsx"),
  route("flash-sale", "routes/flash-sale.tsx"),
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
] satisfies RouteConfig;
