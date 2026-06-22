export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  sku: string;
  onSale: boolean;
  price: number;
  regularPrice: number;
  salePrice: number;
  currency: string;
  currencySymbol: string;
  thumbnail: string | null;
  categories: { id: number; name: string; slug: string }[];
  inStock: boolean;
  averageRating: number;
  reviewCount: number;
  brands?: { id?: number; name: string; slug: string }[];
  tags?: { id?: number; name: string; slug: string }[];
  status?: string;
  dateCreated?: string;
  visibility?: string;
  visibilityPassword?: string;
  lowStockRemaining?: number | null;
  manageStock?: boolean;
  stockStatus?: string;
  dateModified?: string;
}


export interface Product extends ProductSummary {
  type: string;
  permalink: string;
  shortDescription: string;
  description: string;
  images: { id: number; src: string; alt: string; name: string }[];
  tags: { id: number; name: string; slug: string }[];
  brands: { id: number; name: string; slug: string }[];
  stockStatus: string;
  lowStockRemaining: number | null;
  isPurchasable: boolean;
  addToCartUrl: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  image: string | null;
  link: string;
}

export interface SiteMeta {
  name: string;
  description: string;
  url: string;
  logo: string;
  logoLocal: string | null;
}
