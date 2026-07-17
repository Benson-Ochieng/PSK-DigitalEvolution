import { redirect } from "react-router";
import type { Route } from "./+types/admin";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/admin/, "");
  return redirect(`/store_backend${subpath}`);
}

export async function action({ request }: Route.ActionArgs) {
  return redirect("/store_backend");
}

export default function AdminLayoutRedirect() {
  return null;
}
