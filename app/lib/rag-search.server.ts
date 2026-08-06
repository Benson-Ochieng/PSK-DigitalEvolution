export type RagProduct = {
  id: number | string;
  name?: string;
  brand?: string;
  weight_kg?: number | string | null;
  animal_type?: string | null;
  food_type?: string | null;
  image_url?: string | null;
  images?: any;
  description?: string | null;
  short_description?: string | null;
  slug?: string | null;
  price?: number | string | null;
  regular_price?: number | string | null;
  sale_price?: number | string | null;
  categories?: any[];
  tags?: any[];
};

type RagSearchInput = {
  query: string;
  page?: number;
  perPage?: number;
  petType?: string;
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
};

function getRagBaseUrl() {
  return (process.env.RAG_SEARCH_API_URL || process.env.SUPPORT_API_URL || "https://connect.petstore.co.ke").replace(/\/$/, "");
}

export function isRagSearchEnabled() {
  return process.env.RAG_SEARCH_ENABLED !== "false";
}

function getProductImage(product: RagProduct) {
  if (product.image_url) return product.image_url;
  const images = product.images;
  if (Array.isArray(images) && images[0]?.src) return images[0].src;
  if (images && typeof images === "object" && images.src) return images.src;
  return "/images/psk_logo.png";
}

function getPrice(product: RagProduct) {
  const raw = product.price ?? product.sale_price ?? product.regular_price ?? 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProduct(product: RagProduct) {
  return {
    id: Number(product.id),
    name: product.name || "",
    brand: product.brand || "",
    weight_kg: product.weight_kg ?? null,
    animal_type: product.animal_type || "",
    food_type: product.food_type || "",
    image_url: getProductImage(product),
    description: product.description || "",
    short_description: product.short_description || "",
    slug: product.slug || "",
    price: getPrice(product),
    categories: Array.isArray(product.categories) ? product.categories : [],
    tags: Array.isArray(product.tags) ? product.tags : []
  };
}

export async function searchRagProducts(input: RagSearchInput) {
  if (!isRagSearchEnabled()) return null;

  const query = input.query.trim();
  if (!query) return null;

  const controller = new AbortController();
  const timeoutMs = Number(process.env.RAG_SEARCH_TIMEOUT_MS || 6500);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const apiKey = process.env.RAG_SEARCH_API_KEY || process.env.PSK_SEARCH_API_KEY || "";

  try {
    const response = await fetch(`${getRagBaseUrl()}/api/search/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-PSK-Search-Key": apiKey, Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        query,
        page: input.page || 1,
        perPage: input.perPage || 24,
        petType: input.petType || undefined,
        category: input.category || undefined,
        brands: input.brands || undefined,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        inStock: input.inStock ?? true,
        sort: input.sort || "relevance",
        source: "psk-digital-evolution"
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn("[RAG Search] Request failed", response.status);
      return null;
    }

    const data = await response.json();
    const rawProducts = Array.isArray(data?.products) ? data.products : [];
    if (rawProducts.length === 0) return null;

    return {
      products: rawProducts.map(normalizeProduct).filter((product: any) => Number.isFinite(product.id)),
      total: Number(data?.total || rawProducts.length),
      mode: data?.mode || "rag"
    };
  } catch (error) {
    console.warn("[RAG Search] Falling back to local search", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
