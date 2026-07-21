import { handleSearch } from "~/lib/search.server";

export async function loader({ request }: { request: Request }) {
  return handleSearch(request);
}
