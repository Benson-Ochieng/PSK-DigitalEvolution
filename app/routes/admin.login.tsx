import { redirect } from "react-router";
import type { Route } from "./+types/admin.login";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Redirecting..." }];
}

export async function loader() {
  return redirect("/store_backend/login");
}

export async function action() {
  return redirect("/store_backend/login");
}

export default function AdminLoginRedirect() {
  return null;
}
