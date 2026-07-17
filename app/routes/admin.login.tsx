import { redirect } from "react-router";

export async function loader() {
  return redirect("/store_backend/login");
}

export async function action() {
  return redirect("/store_backend/login");
}

export default function AdminLogin() {
  return null;
}

