import { redirect } from "react-router";
import type { Route } from "./+types/admin";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/admin/orders") {
    return redirect("/store_backend/orders");
  }
  if (pathname === "/admin/products") {
    return redirect("/store_backend/products");
  }
  if (pathname === "/admin/blogs") {
    return redirect("/store_backend/posts");
  }

  return redirect("/store_backend");
}

export default function AdminLayoutRedirect() {
  return null;
}
