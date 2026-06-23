import { useState, useEffect, useRef } from "react";
import { Form, useLoaderData, useNavigation, useSearchParams, Link, redirect } from "react-router";
import fs from "fs";
import path from "path";
import { getAllProducts, getAllCategories, getAllReviews, getAllBrands, getAllTags, getAllAttributes, saveAllBrands, saveAllTags, saveAllAttributes, saveAllCategories } from "~/lib/content.server";
import { upsertProductToSupabase, deleteProductFromSupabase } from "~/lib/supabase.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  const id = Number(url.searchParams.get("id"));

  if (url.searchParams.get("export") === "csv") {
    const { requireAdminUser } = await import("~/lib/sessions.server");
    await requireAdminUser(request);

    const allProducts = getAllProducts(true);
    const headers = ["ID", "Name", "Slug", "SKU", "Regular Price", "Sale Price", "Price", "In Stock", "Categories", "Brands", "Thumbnail"];
    const rows = [headers.join(",")];

    for (const p of allProducts) {
      const cats = (p.categories || []).map((c: any) => c.slug).join(";");
      const brands = (p.brands || []).map((b: any) => b.slug).join(";");

      const escapedName = `"${(p.name || "").replace(/"/g, '""')}"`;
      const escapedThumbnail = `"${(p.thumbnail || "").replace(/"/g, '""')}"`;

      const row = [
        p.id,
        escapedName,
        p.slug,
        p.sku || "",
        p.regularPrice || 0,
        p.salePrice || "",
        p.price || 0,
        p.inStock ? "yes" : "no",
        `"${cats}"`,
        `"${brands}"`,
        escapedThumbnail
      ];
      rows.push(row.join(","));
    }

    const csvContent = rows.join("\n");
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"products-export.csv\"",
      },
    });
  }

  const allProducts = getAllProducts(true);
  const allCategories = getAllCategories(true);
  const allReviews = getAllReviews();
  const allBrands = getAllBrands(true);
  const allTags = getAllTags(true);
  const allAttributes = getAllAttributes();

  let editingProductDetails = null;
  if (view === "edit" && id) {
    const summary = allProducts.find((p: any) => p.id === id);
    if (summary) {
      const CONTENT_DIR = path.join(process.cwd(), "content");
      const productFilePath = path.join(CONTENT_DIR, "products", `${summary.slug}.json`);
      if (fs.existsSync(productFilePath)) {
        try {
          editingProductDetails = JSON.parse(fs.readFileSync(productFilePath, "utf-8"));
        } catch (e) {
          console.error("Failed to read edit product details:", e);
        }
      }
    }
  }

  return { allProducts, allCategories, allReviews, editingProductDetails, allBrands, allTags, allAttributes, origin: url.origin };
}

export async function action({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const user = await requireAdminUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "bulk_trash") {
    const idsString = formData.get("ids")?.toString() || "[]";
    const idsToTrash = JSON.parse(idsString).map(Number);
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");

    if (idsToTrash.length > 0 && fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        let trashedCount = 0;

        const updatedIndexProducts = indexProducts.map((p: any) => {
          if (idsToTrash.includes(p.id)) {
            const detailPath = path.join(CONTENT_DIR, "products", `${p.slug}.json`);
            let details: any = {};
            if (fs.existsSync(detailPath)) {
              try {
                details = JSON.parse(fs.readFileSync(detailPath, "utf-8"));
                details.status = "trash";
                fs.writeFileSync(detailPath, JSON.stringify(details, null, 2), "utf-8");
              } catch (e) {
                console.error("Failed to update detail file status for trash:", e);
              }
            }
            upsertProductToSupabase({ ...p, ...details, status: "trash" }).catch(err => console.error("Error updating trashed product in Supabase:", err));
            trashedCount++;
            return { ...p, status: "trash" };
          }
          return p;
        });

        fs.writeFileSync(indexFilePath, JSON.stringify(updatedIndexProducts, null, 2), "utf-8");

        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Bulk Products Trashed", `Moved ${trashedCount} products to Trash`, "🗑️");
      } catch (e) {
        console.error("Bulk trash failed:", e);
      }
    }
    return redirect("/store_backend/products");
  }

  if (intent === "bulk_restore") {
    const idsString = formData.get("ids")?.toString() || "[]";
    const idsToRestore = JSON.parse(idsString).map(Number);
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");

    if (idsToRestore.length > 0 && fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        let restoredCount = 0;

        const updatedIndexProducts = indexProducts.map((p: any) => {
          if (idsToRestore.includes(p.id)) {
            const detailPath = path.join(CONTENT_DIR, "products", `${p.slug}.json`);
            let details: any = {};
            if (fs.existsSync(detailPath)) {
              try {
                details = JSON.parse(fs.readFileSync(detailPath, "utf-8"));
                details.status = "publish";
                fs.writeFileSync(detailPath, JSON.stringify(details, null, 2), "utf-8");
              } catch (e) {
                console.error("Failed to restore detail file status:", e);
              }
            }
            upsertProductToSupabase({ ...p, ...details, status: "publish" }).catch(err => console.error("Error updating restored product in Supabase:", err));
            restoredCount++;
            return { ...p, status: "publish" };
          }
          return p;
        });

        fs.writeFileSync(indexFilePath, JSON.stringify(updatedIndexProducts, null, 2), "utf-8");

        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Bulk Products Restored", `Restored ${restoredCount} products from Trash`, "♻️");
      } catch (e) {
        console.error("Bulk restore failed:", e);
      }
    }
    return redirect("/store_backend/products");
  }

  if (intent === "bulk_delete_permanently") {
    const idsString = formData.get("ids")?.toString() || "[]";
    const idsToDelete = JSON.parse(idsString).map(Number);
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");

    if (idsToDelete.length > 0 && fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        let deletedCount = 0;

        const updatedIndexProducts = indexProducts.filter((p: any) => {
          if (idsToDelete.includes(p.id)) {
            const detailPath = path.join(CONTENT_DIR, "products", `${p.slug}.json`);
            if (fs.existsSync(detailPath)) {
              try {
                fs.unlinkSync(detailPath);
              } catch (e) {
                console.error("Failed to unlink details file:", e);
              }
            }
            deleteProductFromSupabase(p.id).catch(err => console.error("Error deleting product from Supabase:", err));
            deletedCount++;
            return false;
          }
          return true;
        });

        fs.writeFileSync(indexFilePath, JSON.stringify(updatedIndexProducts, null, 2), "utf-8");

        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Bulk Products Deleted Permanently", `Permanently deleted ${deletedCount} products`, "🗑️");
      } catch (e) {
        console.error("Bulk delete failed:", e);
      }
    }
    return redirect("/store_backend/products");
  }

  if (intent === "bulk_edit") {
    const idsString = formData.get("ids")?.toString() || "[]";
    const idsToEdit = JSON.parse(idsString).map(Number);

    const changeRegularPrice = formData.get("changeRegularPrice")?.toString() || "";
    const changeSalePrice = formData.get("changeSalePrice")?.toString() || "";
    const bulkInStock = formData.get("bulkInStock")?.toString() || "no-change";
    const addCategories = formData.getAll("addCategories").map(String);
    const addBrands = formData.getAll("addBrands").map(String);

    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");

    if (idsToEdit.length > 0 && fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);

        const categoriesFilePath = path.join(CONTENT_DIR, "categories", "_index.json");
        let allCategories: any[] = [];
        if (fs.existsSync(categoriesFilePath)) {
          allCategories = JSON.parse(fs.readFileSync(categoriesFilePath, "utf-8"));
        }
        const resolvedCats = addCategories.map(slug => {
          const matched = allCategories.find((c: any) => c.slug === slug);
          return { name: matched ? matched.name : slug, slug };
        });

        const allBrands = getAllBrands();
        const resolvedBrands = addBrands.map(slug => {
          const matched = allBrands.find((b: any) => b.slug === slug);
          return { name: matched ? matched.name : slug, slug };
        });

        for (const productId of idsToEdit) {
          const itemIdx = indexProducts.findIndex((p: any) => p.id === productId);
          if (itemIdx === -1) continue;

          const summary = indexProducts[itemIdx];
          const productFilePath = path.join(CONTENT_DIR, "products", `${summary.slug}.json`);
          let detail: any = {};
          if (fs.existsSync(productFilePath)) {
            detail = JSON.parse(fs.readFileSync(productFilePath, "utf-8"));
          }

          if (changeRegularPrice !== "") {
            const regPrice = Number(changeRegularPrice);
            summary.regularPrice = regPrice;
            detail.regularPrice = regPrice;
          }

          if (changeSalePrice !== "") {
            const salePrice = Number(changeSalePrice);
            summary.salePrice = salePrice;
            detail.salePrice = salePrice;
          }

          const reg = Number(detail.regularPrice || summary.regularPrice || 0);
          const sale = Number(detail.salePrice || summary.salePrice || 0);
          const onSale = sale > 0 && sale < reg;
          const finalPrice = onSale ? sale : reg;

          summary.price = finalPrice;
          summary.onSale = onSale;
          detail.price = finalPrice;
          detail.onSale = onSale;

          if (bulkInStock !== "no-change") {
            const inStock = bulkInStock === "instock";
            summary.inStock = inStock;
            summary.stockStatus = inStock ? "instock" : "outofstock";
            detail.inStock = inStock;
            detail.stockStatus = inStock ? "instock" : "outofstock";
          }

          if (resolvedCats.length > 0) {
            const currentCats = summary.categories || [];
            const mergedCats = [...currentCats];
            for (const newCat of resolvedCats) {
              if (!mergedCats.some((c: any) => c.slug === newCat.slug)) {
                mergedCats.push(newCat);
              }
            }
            summary.categories = mergedCats;
            detail.categories = mergedCats;
          }

          if (resolvedBrands.length > 0) {
            const currentBrands = summary.brands || [];
            const mergedBrands = [...currentBrands];
            for (const newBrand of resolvedBrands) {
              if (!mergedBrands.some((b: any) => b.slug === newBrand.slug)) {
                mergedBrands.push(newBrand);
              }
            }
            summary.brands = mergedBrands;
            detail.brands = mergedBrands;
          }

          const nowIso = new Date().toISOString();
          summary.dateModified = nowIso;
          detail.dateModified = nowIso;

          if (fs.existsSync(productFilePath)) {
            fs.writeFileSync(productFilePath, JSON.stringify(detail, null, 2), "utf-8");
            upsertProductToSupabase(detail).catch(err => console.error("Error syncing bulk edited product to Supabase:", err));
          }
        }

        fs.writeFileSync(indexFilePath, JSON.stringify(indexProducts, null, 2), "utf-8");

        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Bulk Products Edited", `Bulk updated ${idsToEdit.length} products`, "📦");
      } catch (e) {
        console.error("Bulk edit failed:", e);
      }
    }
    return redirect("/store_backend/products");
  }

  if (intent === "quick_edit") {
    const productId = Number(formData.get("id"));
    const slug = formData.get("slug")?.toString();
    const regularPrice = Number(formData.get("regularPrice"));
    const salePrice = Number(formData.get("salePrice"));
    const inStock = formData.get("inStock") === "true";
    const status = formData.get("status")?.toString() || "publish";

    if (!slug) return { error: "Missing product identifier" };

    // File upload
    const thumbnailFile = formData.get("thumbnail") as File | null;
    let thumbnailPath = formData.get("currentThumbnail")?.toString() || "";

    if (thumbnailFile && thumbnailFile.size > 0 && thumbnailFile.name) {
      try {
        const bytes = await thumbnailFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const sanitizeName = thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${sanitizeName}`;
        const uploadDir = path.join(process.cwd(), "public", "assets", "images", "products");
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
        thumbnailPath = `/assets/images/products/${filename}`;
      } catch (err) {
        console.error("Failed to upload thumbnail:", err);
      }
    }

    // Determine values
    const onSale = salePrice > 0 && salePrice < regularPrice;
    const finalPrice = onSale ? salePrice : regularPrice;

    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");
    const productFilePath = path.join(CONTENT_DIR, "products", `${slug}.json`);

    // 1. Update product details JSON file
    if (fs.existsSync(productFilePath)) {
      try {
        const raw = fs.readFileSync(productFilePath, "utf-8");
        const product = JSON.parse(raw);
        product.regularPrice = regularPrice;
        product.salePrice = salePrice;
        product.price = finalPrice;
        product.onSale = onSale;
        product.inStock = inStock;
        product.stockStatus = inStock ? "instock" : "outofstock";
        if (product.manageStock !== false) {
          const qty = typeof product.lowStockRemaining === "number" ? product.lowStockRemaining : null;
          if (inStock) {
            if (qty === null || qty <= 0) {
              product.lowStockRemaining = 10;
            }
          } else {
            product.lowStockRemaining = 0;
          }
        }
        product.thumbnail = thumbnailPath;
        product.status = status;
        product.dateModified = new Date().toISOString();

        if (product.images && product.images.length > 0) {
          product.images[0].src = thumbnailPath;
        } else {
          product.images = [{ id: productId, src: thumbnailPath, alt: "", name: "thumbnail" }];
        }

        fs.writeFileSync(productFilePath, JSON.stringify(product, null, 2), "utf-8");
        upsertProductToSupabase(product).catch(err => console.error("Error syncing quick-edited product to Supabase:", err));
      } catch (e) {
        console.error("Error updating product JSON details:", e);
      }
    }

    // 2. Update product summary in _index.json
    if (fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        const itemIdx = indexProducts.findIndex((p: any) => p.id === productId);
        if (itemIdx !== -1) {
          indexProducts[itemIdx].regularPrice = regularPrice;
          indexProducts[itemIdx].salePrice = salePrice;
          indexProducts[itemIdx].price = finalPrice;
          indexProducts[itemIdx].onSale = onSale;
          indexProducts[itemIdx].inStock = inStock;
          indexProducts[itemIdx].stockStatus = inStock ? "instock" : "outofstock";
          if (indexProducts[itemIdx].manageStock !== false) {
            const qty = typeof indexProducts[itemIdx].lowStockRemaining === "number" ? indexProducts[itemIdx].lowStockRemaining : null;
            if (inStock) {
              if (qty === null || qty <= 0) {
                indexProducts[itemIdx].lowStockRemaining = 10;
              }
            } else {
              indexProducts[itemIdx].lowStockRemaining = 0;
            }
          }
          indexProducts[itemIdx].thumbnail = thumbnailPath;
          indexProducts[itemIdx].status = status;
          indexProducts[itemIdx].dateModified = new Date().toISOString();
          fs.writeFileSync(indexFilePath, JSON.stringify(indexProducts, null, 2), "utf-8");
        }
      } catch (e) {
        console.error("Error updating product index JSON:", e);
      }
    }

    const { logHistoryEvent } = await import("~/lib/content.server");
    logHistoryEvent(user.name, "Product Quick-Edited", `Quick edited product "${slug}" (Price: KSh ${regularPrice}, Stock: ${inStock ? "instock" : "outofstock"})`, "📦");

    return { success: true };
  }

  if (intent === "save_product_details") {
    const productId = Number(formData.get("id"));
    const originalSlug = formData.get("originalSlug")?.toString() || "";
    const name = formData.get("name")?.toString() || "";
    const slug = formData.get("slug")?.toString() || originalSlug;
    const regularPrice = Number(formData.get("regularPrice") || 0);
    const salePrice = Number(formData.get("salePrice") || 0);
    let inStock = formData.get("inStock") === "true";
    const manageStock = formData.get("manageStock") === "true";
    const stockQtyRaw = formData.get("stockQty");
    let lowStockRemaining = stockQtyRaw !== null && stockQtyRaw !== "" ? Number(stockQtyRaw) : null;

    if (manageStock && lowStockRemaining !== null) {
      if (lowStockRemaining <= 0) {
        inStock = false;
      }
    } else if (!manageStock) {
      lowStockRemaining = null;
    }

    const type = formData.get("type")?.toString() || "simple";
    const sku = formData.get("sku")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const shortDescription = formData.get("shortDescription")?.toString() || "";
    const status = formData.get("status")?.toString() || "publish";
    const dateCreated = formData.get("dateCreated")?.toString() || new Date().toISOString();
    const visibility = formData.get("visibility")?.toString() || "public";
    const visibilityPassword = formData.get("visibilityPassword")?.toString() || "";

    const virtual = formData.get("virtual") === "true";
    const downloadable = formData.get("downloadable") === "true";
    const weight = Number(formData.get("weight") || 0);
    const length = Number(formData.get("length") || 0);
    const width = Number(formData.get("width") || 0);
    const height = Number(formData.get("height") || 0);

    const seoTitle = formData.get("seoTitle")?.toString() || "";
    const metaDescription = formData.get("metaDescription")?.toString() || "";
    const focusKeyphrase = formData.get("focusKeyphrase")?.toString() || "";

    const selectedCategories = formData.getAll("categories").map(String);
    const selectedBrands = formData.getAll("brands").map(String);
    const tagsInput = formData.get("tags")?.toString() || "";
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean).map(t => ({
      name: t,
      slug: t.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    }));

    // File upload
    const thumbnailFile = formData.get("thumbnail") as File | null;
    let thumbnailPath = formData.get("currentThumbnail")?.toString() || "";

    if (thumbnailFile && thumbnailFile.size > 0 && thumbnailFile.name) {
      try {
        const bytes = await thumbnailFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const sanitizeName = thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${sanitizeName}`;
        const uploadDir = path.join(process.cwd(), "public", "assets", "images", "products");
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
        thumbnailPath = `/assets/images/products/${filename}`;
      } catch (err) {
        console.error("Failed to upload thumbnail:", err);
      }
    }

    // Gallery upload
    const existingGalleryJson = formData.get("existingGalleryJson")?.toString() || "[]";
    let existingGallery: any[] = [];
    try {
      existingGallery = JSON.parse(existingGalleryJson);
    } catch (e) {
      console.error("Failed to parse existing gallery JSON:", e);
    }

    const galleryFiles = formData.getAll("gallery") as File[];
    const uploadedGalleryImages: any[] = [];

    for (const file of galleryFiles) {
      if (file && file.size > 0 && file.name) {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const sanitizeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const filename = `${Date.now()}-${sanitizeName}`;
          const uploadDir = path.join(process.cwd(), "public", "assets", "images", "products");
          fs.mkdirSync(uploadDir, { recursive: true });
          fs.writeFileSync(path.join(uploadDir, filename), buffer);
          const src = `/assets/images/products/${filename}`;
          uploadedGalleryImages.push({
            id: Math.floor(10000 + Math.random() * 90000),
            src,
            alt: "",
            name: "gallery"
          });
        } catch (err) {
          console.error("Failed to upload gallery image:", err);
        }
      }
    }

    const onSale = salePrice > 0 && salePrice < regularPrice;
    const finalPrice = onSale ? salePrice : regularPrice;

    const CONTENT_DIR = path.join(process.cwd(), "content");
    const categoriesFilePath = path.join(CONTENT_DIR, "categories", "_index.json");
    let allCategories: any[] = [];
    if (fs.existsSync(categoriesFilePath)) {
      try {
        allCategories = JSON.parse(fs.readFileSync(categoriesFilePath, "utf-8"));
      } catch (e) {}
    }

    const categories = selectedCategories.map(catSlug => {
      const cat = allCategories.find((c: any) => c.slug === catSlug);
      return { name: cat ? cat.name : catSlug, slug: catSlug };
    });

    const allBrands = getAllBrands();

    const brands = selectedBrands.map(brandSlug => {
      const brand = allBrands.find((b: any) => b.slug === brandSlug);
      return { name: brand ? brand.name : brandSlug, slug: brandSlug };
    });

    // 1. Prepare product details JSON
    const productFilePath = path.join(CONTENT_DIR, "products", `${slug}.json`);
    let productDetails: any = { id: productId };

    const oldProductPath = path.join(CONTENT_DIR, "products", `${originalSlug}.json`);
    if (fs.existsSync(oldProductPath)) {
      try {
        productDetails = JSON.parse(fs.readFileSync(oldProductPath, "utf-8"));
      } catch (e) {}
    }

    productDetails.name = name;
    productDetails.slug = slug;
    productDetails.sku = sku;
    productDetails.regularPrice = regularPrice;
    productDetails.salePrice = salePrice;
    productDetails.price = finalPrice;
    productDetails.onSale = onSale;
    productDetails.inStock = inStock;
    productDetails.stockStatus = inStock ? "instock" : "outofstock";
    productDetails.manageStock = manageStock;
    productDetails.lowStockRemaining = lowStockRemaining;
    productDetails.type = type;
    productDetails.thumbnail = thumbnailPath;
    productDetails.description = description;
    productDetails.shortDescription = shortDescription;
    productDetails.categories = categories;
    productDetails.brands = brands;
    productDetails.tags = tags;
    productDetails.virtual = virtual;
    productDetails.downloadable = downloadable;
    productDetails.weight = weight;
    productDetails.dimensions = { length, width, height };
    productDetails.seoTitle = seoTitle;
    productDetails.metaDescription = metaDescription;
    productDetails.focusKeyphrase = focusKeyphrase;
    productDetails.status = status;
    productDetails.dateCreated = dateCreated;
    productDetails.dateModified = new Date().toISOString();
    productDetails.visibility = visibility;
    productDetails.visibilityPassword = visibilityPassword;

    // Combine thumbnail and gallery images
    productDetails.images = [
      { id: productId, src: thumbnailPath, alt: "", name: "thumbnail" },
      ...existingGallery,
      ...uploadedGalleryImages
    ];

    // Write to detail json file
    fs.writeFileSync(productFilePath, JSON.stringify(productDetails, null, 2), "utf-8");
    upsertProductToSupabase(productDetails).catch(err => console.error("Error syncing updated product details to Supabase:", err));

    // Remove old file if slug changed
    if (slug !== originalSlug && originalSlug) {
      try {
        const oldFile = path.join(CONTENT_DIR, "products", `${originalSlug}.json`);
        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
        }
      } catch (e) {
        console.error("Failed to delete old product file:", e);
      }
    }

    // 2. Update index.json
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");
    if (fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        const itemIdx = indexProducts.findIndex((p: any) => p.id === productId);
        const indexItem = {
          id: productId,
          name,
          slug,
          sku,
          regularPrice,
          salePrice,
          price: finalPrice,
          onSale,
          inStock,
          stockStatus: inStock ? "instock" : "outofstock",
          manageStock,
          lowStockRemaining,
          thumbnail: thumbnailPath,
          categories,
          brands,
          tags,
          status,
          dateCreated,
          dateModified: new Date().toISOString(),
          visibility,
          visibilityPassword
        };

        if (itemIdx !== -1) {
          indexProducts[itemIdx] = indexItem;
        } else {
          indexProducts.unshift(indexItem);
        }
        fs.writeFileSync(indexFilePath, JSON.stringify(indexProducts, null, 2), "utf-8");
      } catch (e) {
        console.error("Error updating product index JSON:", e);
      }
    }

    const { logHistoryEvent } = await import("~/lib/content.server");
    logHistoryEvent(user.name, "Product Updated", `Updated details for product "${name}" (SKU: ${sku || "N/A"})`, "📦");

    return redirect(`/store_backend/products?view=edit&id=${productId}&updated=true`);
  }

  if (intent === "duplicate_product") {
    const productId = Number(formData.get("id"));
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");

    if (fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        const item = indexProducts.find((p: any) => p.id === productId);
        if (item) {
          const newId = Math.floor(10000 + Math.random() * 90000);
          const newName = `${item.name} (Copy)`;
          const baseSlug = `${item.slug}-copy`;
          let newSlug = baseSlug;
          let counter = 1;
          while (fs.existsSync(path.join(CONTENT_DIR, "products", `${newSlug}.json`))) {
            newSlug = `${baseSlug}-${counter}`;
            counter++;
          }

          // 1. Read detail json of original if exists
          let detailData: any = {};
          const originalPath = path.join(CONTENT_DIR, "products", `${item.slug}.json`);
          if (fs.existsSync(originalPath)) {
            detailData = JSON.parse(fs.readFileSync(originalPath, "utf-8"));
          }

          const clonedDetail = {
            ...item,
            ...detailData,
            id: newId,
            name: newName,
            slug: newSlug,
            permalink: detailData.permalink ? detailData.permalink.replace(item.slug, newSlug) : "",
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString()
          };

          // Write cloned detail
          const newPath = path.join(CONTENT_DIR, "products", `${newSlug}.json`);
          fs.writeFileSync(newPath, JSON.stringify(clonedDetail, null, 2), "utf-8");
          upsertProductToSupabase(clonedDetail).catch(err => console.error("Error syncing duplicated product to Supabase:", err));

          // 2. Prepend to index
          const newIndexItem = {
            id: newId,
            name: newName,
            slug: newSlug,
            sku: item.sku ? `${item.sku}-COPY` : "",
            regularPrice: item.regularPrice,
            salePrice: item.salePrice,
            price: item.price,
            onSale: item.onSale,
            inStock: item.inStock,
            thumbnail: item.thumbnail,
            categories: item.categories || [],
            brands: item.brands || [],
            tags: item.tags || [],
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString()
          };
          
          indexProducts.unshift(newIndexItem);
          fs.writeFileSync(indexFilePath, JSON.stringify(indexProducts, null, 2), "utf-8");

          const { logHistoryEvent } = await import("~/lib/content.server");
          logHistoryEvent(user.name, "Product Duplicated", `Duplicated product "${item.name}" as "${newName}"`, "📦");
        }
      } catch (e) {
        console.error("Failed to duplicate product:", e);
      }
    }
    return redirect("/store_backend/products");
  }

  if (intent === "trash_product") {
    const productId = Number(formData.get("id"));
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");

    if (fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        const itemIdx = indexProducts.findIndex((p: any) => p.id === productId);
        if (itemIdx !== -1) {
          const item = indexProducts[itemIdx];
          
          const detailPath = path.join(CONTENT_DIR, "products", `${item.slug}.json`);
          let details: any = {};
          if (fs.existsSync(detailPath)) {
            try {
              details = JSON.parse(fs.readFileSync(detailPath, "utf-8"));
              details.status = "trash";
              fs.writeFileSync(detailPath, JSON.stringify(details, null, 2), "utf-8");
            } catch (e) {
              console.error(e);
            }
          }
          
          upsertProductToSupabase({ ...item, ...details, status: "trash" }).catch(err => console.error(err));
          
          indexProducts[itemIdx].status = "trash";
          fs.writeFileSync(indexFilePath, JSON.stringify(indexProducts, null, 2), "utf-8");

          const { logHistoryEvent } = await import("~/lib/content.server");
          logHistoryEvent(user.name, "Product Trashed", `Moved product "${item.name}" to Trash`, "🗑️");
        }
      } catch (e) {
        console.error("Failed to trash product:", e);
      }
    }
    return redirect("/store_backend/products");
  }

  if (intent === "restore_product") {
    const productId = Number(formData.get("id"));
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");

    if (fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        const itemIdx = indexProducts.findIndex((p: any) => p.id === productId);
        if (itemIdx !== -1) {
          const item = indexProducts[itemIdx];
          
          const detailPath = path.join(CONTENT_DIR, "products", `${item.slug}.json`);
          let details: any = {};
          if (fs.existsSync(detailPath)) {
            try {
              details = JSON.parse(fs.readFileSync(detailPath, "utf-8"));
              details.status = "publish";
              fs.writeFileSync(detailPath, JSON.stringify(details, null, 2), "utf-8");
            } catch (e) {
              console.error(e);
            }
          }
          
          upsertProductToSupabase({ ...item, ...details, status: "publish" }).catch(err => console.error(err));
          
          indexProducts[itemIdx].status = "publish";
          fs.writeFileSync(indexFilePath, JSON.stringify(indexProducts, null, 2), "utf-8");

          const { logHistoryEvent } = await import("~/lib/content.server");
          logHistoryEvent(user.name, "Product Restored", `Restored product "${item.name}" from Trash`, "♻️");
        }
      } catch (e) {
        console.error("Failed to restore product:", e);
      }
    }
    return redirect("/store_backend/products");
  }

  if (intent === "delete_product_permanently") {
    const productId = Number(formData.get("id"));
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");

    if (fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        const itemIdx = indexProducts.findIndex((p: any) => p.id === productId);
        if (itemIdx !== -1) {
          const item = indexProducts[itemIdx];
          
          const detailPath = path.join(CONTENT_DIR, "products", `${item.slug}.json`);
          if (fs.existsSync(detailPath)) {
            try {
              fs.unlinkSync(detailPath);
            } catch (e) {
              console.error(e);
            }
          }
          
          deleteProductFromSupabase(productId).catch(err => console.error("Error deleting product from Supabase:", err));
          
          indexProducts.splice(itemIdx, 1);
          fs.writeFileSync(indexFilePath, JSON.stringify(indexProducts, null, 2), "utf-8");

          const { logHistoryEvent } = await import("~/lib/content.server");
          logHistoryEvent(user.name, "Product Deleted Permanently", `Permanently deleted product "${item.name}"`, "🗑️");
        }
      } catch (e) {
        console.error("Failed to delete product permanently:", e);
      }
    }
    return redirect("/store_backend/products");
  }

  if (intent === "empty_trash_products") {
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");

    if (fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        let deletedCount = 0;

        const updatedProducts = indexProducts.filter((p: any) => {
          if (p.status === "trash") {
            const detailPath = path.join(CONTENT_DIR, "products", `${p.slug}.json`);
            if (fs.existsSync(detailPath)) {
              try {
                fs.unlinkSync(detailPath);
              } catch (e) {
                console.error(e);
              }
            }
            deleteProductFromSupabase(p.id).catch(err => console.error(err));
            deletedCount++;
            return false;
          }
          return true;
        });

        fs.writeFileSync(indexFilePath, JSON.stringify(updatedProducts, null, 2), "utf-8");

        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Trash Emptied", `Permanently deleted ${deletedCount} products from Trash`, "🗑️");
      } catch (e) {
        console.error("Failed to empty trash:", e);
      }
    }
    return redirect("/store_backend/products");
  }

  if (intent === "add_product") {
    const name = formData.get("name")?.toString() || "";
    const sku = formData.get("sku")?.toString() || "";
    const regularPrice = Number(formData.get("regularPrice") || 0);
    const salePrice = Number(formData.get("salePrice") || 0);
    const manageStock = formData.get("manageStock") === "true";
    const stockQtyRaw = formData.get("stockQty");
    let lowStockRemaining = stockQtyRaw !== null && stockQtyRaw !== "" ? Number(stockQtyRaw) : null;
    let inStock = formData.get("inStock") === "true";
    const selectedCategorySlug = formData.get("category")?.toString() || "";
    const status = formData.get("status")?.toString() || "publish";

    if (manageStock) {
      if (lowStockRemaining === null) {
        lowStockRemaining = 10;
      }
      if (lowStockRemaining <= 0) {
        inStock = false;
      }
    } else {
      lowStockRemaining = null;
    }

    if (!name) return { error: "Name is required" };

    // Generate unique slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const productId = Math.floor(10000 + Math.random() * 90000);

    // Categories
    const CONTENT_DIR = path.join(process.cwd(), "content");
    const categoriesFilePath = path.join(CONTENT_DIR, "categories", "_index.json");
    let categoryName = "";
    if (fs.existsSync(categoriesFilePath)) {
      try {
        const rawCats = JSON.parse(fs.readFileSync(categoriesFilePath, "utf-8"));
        const matched = rawCats.find((c: any) => c.slug === selectedCategorySlug);
        if (matched) categoryName = matched.name;
      } catch (e) {}
    }
    const categories = selectedCategorySlug ? [{ name: categoryName, slug: selectedCategorySlug }] : [];

    const onSale = salePrice > 0 && salePrice < regularPrice;
    const finalPrice = onSale ? salePrice : regularPrice;
    const dateCreated = new Date().toISOString();

    const newProduct = {
      id: productId,
      name,
      slug,
      sku,
      regularPrice,
      salePrice,
      price: finalPrice,
      onSale,
      inStock,
      stockStatus: inStock ? "instock" : "outofstock",
      manageStock,
      lowStockRemaining,
      thumbnail: "/assets/images/products/Cool-Pods.jpg",
      categories,
      status,
      dateCreated,
      dateModified: dateCreated,
      images: [
        { id: productId, src: "/assets/images/products/Cool-Pods.jpg", alt: "", name: "thumbnail" }
      ]
    };

    // 1. Write details json
    const productFilePath = path.join(CONTENT_DIR, "products", `${slug}.json`);
    fs.mkdirSync(path.dirname(productFilePath), { recursive: true });
    fs.writeFileSync(productFilePath, JSON.stringify(newProduct, null, 2), "utf-8");
    upsertProductToSupabase(newProduct).catch(err => console.error("Error syncing new product to Supabase:", err));

    // 2. Prepend to products index.json
    const indexFilePath = path.join(CONTENT_DIR, "products", "_index.json");
    if (fs.existsSync(indexFilePath)) {
      try {
        const raw = fs.readFileSync(indexFilePath, "utf-8");
        const indexProducts = JSON.parse(raw);
        indexProducts.unshift({
          id: productId,
          name,
          slug,
          sku,
          regularPrice,
          salePrice,
          price: finalPrice,
          onSale,
          inStock,
          stockStatus: inStock ? "instock" : "outofstock",
          manageStock,
          lowStockRemaining,
          thumbnail: "/assets/images/products/Cool-Pods.jpg",
          categories,
          status,
          dateCreated,
          dateModified: dateCreated
        });
        fs.writeFileSync(indexFilePath, JSON.stringify(indexProducts, null, 2), "utf-8");
      } catch (e) {}
    }

    const { logHistoryEvent } = await import("~/lib/content.server");
    logHistoryEvent(user.name, "Product Created", `Created new product "${name}" (SKU: ${sku || "N/A"})`, "📦");

    return redirect("/store_backend/products");
  }

  // BRAND CRUD ACTIONS
  if (intent === "add_brand") {
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString() || "";
    const slug = formData.get("slug")?.toString() || name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (name && slug) {
      const brands = getAllBrands();
      if (!brands.some(b => b.slug === slug)) {
        brands.push({ name, slug, desc: description, count: 0 });
        saveAllBrands(brands);
        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Brand Created", `Created brand "${name}"`, "🏷️");
      }
    }
    return { success: true };
  }

  if (intent === "edit_brand") {
    const oldSlug = formData.get("oldSlug")?.toString();
    const name = formData.get("name")?.toString();
    const slug = formData.get("slug")?.toString();
    const description = formData.get("description")?.toString() || "";
    if (oldSlug && name && slug) {
      let brands = getAllBrands();
      brands = brands.map(b => b.slug === oldSlug ? { ...b, name, slug, desc: description } : b);
      saveAllBrands(brands);
      const { logHistoryEvent } = await import("~/lib/content.server");
      logHistoryEvent(user.name, "Brand Updated", `Updated brand "${name}"`, "🏷️");
    }
    return { success: true };
  }

  if (intent === "delete_brand") {
    const slug = formData.get("slug")?.toString();
    if (slug) {
      let brands = getAllBrands();
      const brand = brands.find(b => b.slug === slug);
      brands = brands.filter(b => b.slug !== slug);
      saveAllBrands(brands);
      if (brand) {
        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Brand Deleted", `Deleted brand "${brand.name}"`, "🗑️");
      }
    }
    return { success: true };
  }

  // TAG CRUD ACTIONS
  if (intent === "add_tag") {
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString() || "";
    const slug = formData.get("slug")?.toString() || name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (name && slug) {
      const tags = getAllTags();
      if (!tags.some(t => t.slug === slug)) {
        tags.push({ name, slug, desc: description, count: 0 });
        saveAllTags(tags);
        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Tag Created", `Created tag "${name}"`, "🏷️");
      }
    }
    return { success: true };
  }

  if (intent === "edit_tag") {
    const oldSlug = formData.get("oldSlug")?.toString();
    const name = formData.get("name")?.toString();
    const slug = formData.get("slug")?.toString();
    const description = formData.get("description")?.toString() || "";
    if (oldSlug && name && slug) {
      let tags = getAllTags();
      tags = tags.map(t => t.slug === oldSlug ? { ...t, name, slug, desc: description } : t);
      saveAllTags(tags);
      const { logHistoryEvent } = await import("~/lib/content.server");
      logHistoryEvent(user.name, "Tag Updated", `Updated tag "${name}"`, "🏷️");
    }
    return { success: true };
  }

  if (intent === "delete_tag") {
    const slug = formData.get("slug")?.toString();
    if (slug) {
      let tags = getAllTags();
      const tag = tags.find(t => t.slug === slug);
      tags = tags.filter(t => t.slug !== slug);
      saveAllTags(tags);
      if (tag) {
        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Tag Deleted", `Deleted tag "${tag.name}"`, "🗑️");
      }
    }
    return { success: true };
  }

  // CATEGORY CRUD ACTIONS
  if (intent === "add_category") {
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString() || "";
    const slug = formData.get("slug")?.toString() || name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (name && slug) {
      const categories = getAllCategories();
      if (!categories.some(c => c.slug === slug)) {
        const id = Math.floor(100 + Math.random() * 900);
        categories.push({ id, name, slug, description, parent: 0, count: 0, image: null, link: "" });
        saveAllCategories(categories);
        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Category Created", `Created category "${name}"`, "📁");
      }
    }
    return { success: true };
  }

  if (intent === "edit_category") {
    const oldSlug = formData.get("oldSlug")?.toString();
    const name = formData.get("name")?.toString();
    const slug = formData.get("slug")?.toString();
    const description = formData.get("description")?.toString() || "";
    if (oldSlug && name && slug) {
      let categories = getAllCategories();
      categories = categories.map(c => c.slug === oldSlug ? { ...c, name, slug, description } : c);
      saveAllCategories(categories);
      const { logHistoryEvent } = await import("~/lib/content.server");
      logHistoryEvent(user.name, "Category Updated", `Updated category "${name}"`, "📁");
    }
    return { success: true };
  }

  if (intent === "delete_category") {
    const slug = formData.get("slug")?.toString();
    if (slug) {
      let categories = getAllCategories();
      const category = categories.find(c => c.slug === slug);
      categories = categories.filter(c => c.slug !== slug);
      saveAllCategories(categories);
      if (category) {
        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Category Deleted", `Deleted category "${category.name}"`, "🗑️");
      }
    }
    return { success: true };
  }

  // ATTRIBUTE CRUD ACTIONS
  if (intent === "add_attribute") {
    const name = formData.get("name")?.toString();
    const slug = formData.get("slug")?.toString() || "pa_" + name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const terms = formData.get("terms")?.toString() || "";
    if (name && slug) {
      const attributes = getAllAttributes();
      if (!attributes.some(a => a.slug === slug)) {
        attributes.push({ name, slug, type: "select", terms });
        saveAllAttributes(attributes);
        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Attribute Created", `Created attribute "${name}"`, "⚙️");
      }
    }
    return { success: true };
  }

  if (intent === "edit_attribute") {
    const oldSlug = formData.get("oldSlug")?.toString();
    const name = formData.get("name")?.toString();
    const slug = formData.get("slug")?.toString();
    const terms = formData.get("terms")?.toString() || "";
    if (oldSlug && name && slug) {
      let attributes = getAllAttributes();
      attributes = attributes.map(a => a.slug === oldSlug ? { ...a, name, slug, terms } : a);
      saveAllAttributes(attributes);
      const { logHistoryEvent } = await import("~/lib/content.server");
      logHistoryEvent(user.name, "Attribute Updated", `Updated attribute "${name}"`, "⚙️");
    }
    return { success: true };
  }

  if (intent === "delete_attribute") {
    const slug = formData.get("slug")?.toString();
    if (slug) {
      let attributes = getAllAttributes();
      const attr = attributes.find(a => a.slug === slug);
      attributes = attributes.filter(a => a.slug !== slug);
      saveAllAttributes(attributes);
      if (attr) {
        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(user.name, "Attribute Deleted", `Deleted attribute "${attr.name}"`, "🗑️");
      }
    }
    return { success: true };
  }

  return null;
}

import VisualCodeEditor from "~/components/VisualCodeEditor";

export default function VpBackendProducts() {
  const { allProducts, allCategories, allReviews, editingProductDetails, allBrands, allTags, allAttributes, origin } = useLoaderData() as any;
  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${month} ${day}, ${year} at ${hours}:${minutes}`;
  };
  const navigation = useNavigation();
  const isUpdating = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "all";

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "publish" | "draft" | "private" | "cornerstone" | "trash">("all");
  const [seoFilter, setSeoFilter] = useState("");
  const [readabilityFilter, setReadabilityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [metaSyncFilter, setMetaSyncFilter] = useState("");

  // Modal edit states
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingTaxonomy, setEditingTaxonomy] = useState<{ type: "brand" | "category" | "tag" | "attribute"; item: any } | null>(null);

  // Bulk actions states
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  // Screen Options States (WordPress style)
  const [showOptions, setShowOptions] = useState(false);
  const [showImage, setShowImage] = useState(true);
  const [showSKU, setShowSKU] = useState(true);
  const [showGTIN, setShowGTIN] = useState(false);
  const [showStock, setShowStock] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showFeatured, setShowFeatured] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showMetaSync, setShowMetaSync] = useState(true);
  const [showSEOScore, setShowSEOScore] = useState(true);
  const [showReadability, setShowReadability] = useState(true);
  const [showSEOTitle, setShowSEOTitle] = useState(false);
  const [showMetaDesc, setShowMetaDesc] = useState(false);
  const [showKeyphrase, setShowKeyphrase] = useState(false);
  const [showBrands, setShowBrands] = useState(true);
  const [showOutgoingLinks, setShowOutgoingLinks] = useState(true);
  const [showReceivedLinks, setShowReceivedLinks] = useState(true);

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [tempItemsPerPage, setTempItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting states for product catalog
  const [productSortKey, setProductSortKey] = useState<"name" | "sku" | "price" | "salePrice" | "stock" | "date">("date");
  const [productSortDirection, setProductSortDirection] = useState<"asc" | "desc">("desc");

  const handleProductSort = (key: "name" | "sku" | "price" | "salePrice" | "stock" | "date") => {
    if (productSortKey === key) {
      setProductSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setProductSortKey(key);
      setProductSortDirection(key === "date" ? "desc" : "asc");
    }
  };

  const renderProductSortIndicator = (key: "name" | "sku" | "price" | "salePrice" | "stock" | "date") => {
    if (productSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{productSortDirection === "asc" ? "▲" : "▼"}</span>;
  };

  // Deep Edit Form states
  const [seoTitleVal, setSeoTitleVal] = useState("");
  const [metaDescVal, setMetaDescVal] = useState("");
  const [keyphraseVal, setKeyphraseVal] = useState("");
  const [slugVal, setSlugVal] = useState("");
  const [nameVal, setNameVal] = useState("");
  const [descVal, setDescVal] = useState("");
  const [shortDescVal, setShortDescVal] = useState("");
  const [typeVal, setTypeVal] = useState("simple");
  const [activeDataTab, setActiveDataTab] = useState("general");
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [visibilityVal, setVisibilityVal] = useState("public");
  const [visibilityPasswordVal, setVisibilityPasswordVal] = useState("");
  const [dateCreatedVal, setDateCreatedVal] = useState("");
  const [editPublishDate, setEditPublishDate] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);

  useEffect(() => {
    if (editingProductDetails) {
      setSeoTitleVal(editingProductDetails.seoTitle || "");
      setMetaDescVal(editingProductDetails.metaDescription || "");
      setKeyphraseVal(editingProductDetails.focusKeyphrase || "");
      setSlugVal(editingProductDetails.slug || "");
      setNameVal(editingProductDetails.name || "");
      setDescVal(editingProductDetails.description || "");
      setShortDescVal(editingProductDetails.shortDescription || "");
      setTypeVal(editingProductDetails.type || "simple");
      const gallery = (editingProductDetails.images || []).slice(1);
      setGalleryImages(gallery);
      setThumbnailPreviewUrl(editingProductDetails.thumbnail || "");
      setGalleryPreviews([]);

      setVisibilityVal(editingProductDetails.visibility || "public");
      setVisibilityPasswordVal(editingProductDetails.visibilityPassword || "");
      setDateCreatedVal(editingProductDetails.dateCreated || new Date().toISOString());
      setEditPublishDate(false);
      setIsEditingSlug(false);
    }
  }, [editingProductDetails]);

  // Local list states for review edits
  const [reviewsList, setReviewsList] = useState(allReviews || []);

  // Form input states
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandDesc, setNewBrandDesc] = useState("");
  const [newBrandSlug, setNewBrandSlug] = useState("");
  
  const [newTagName, setNewTagName] = useState("");
  const [newTagDesc, setNewTagDesc] = useState("");
  const [newTagSlug, setNewTagSlug] = useState("");

  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");

  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrSlug, setNewAttrSlug] = useState("");
  const [newAttrTerms, setNewAttrTerms] = useState("");

  const handleApproveReview = (id: number) => {
    setReviewsList(reviewsList.map((r: any) => r.id === id ? { ...r, approved: true } : r));
  };

  const handleDeleteReview = (id: number) => {
    setReviewsList(reviewsList.filter((r: any) => r.id !== id));
  };

  // Dynamic product status counts (calculated from allProducts before filters are applied)
  const countAll = allProducts.filter((p: any) => p.status !== "trash").length;
  const countPublished = allProducts.filter((p: any) => (p.status || "publish") === "publish").length;
  const countDrafts = allProducts.filter((p: any) => p.status === "draft").length;
  const countPrivate = allProducts.filter((p: any) => p.status === "private").length;
  const countCornerstone = allProducts.filter((p: any) => p.isCornerstone === true && p.status !== "trash").length;
  const countTrash = allProducts.filter((p: any) => p.status === "trash").length;

  // Reset page when search or any filter changes
  const [prevSearch, setPrevSearch] = useState("");
  const [prevCat, setPrevCat] = useState("");
  const [prevStatus, setPrevStatus] = useState("all");
  const [prevSeo, setPrevSeo] = useState("");
  const [prevReadability, setPrevReadability] = useState("");
  const [prevType, setPrevType] = useState("");
  const [prevStock, setPrevStock] = useState("");
  const [prevBrand, setPrevBrand] = useState("");
  const [prevMetaSync, setPrevMetaSync] = useState("");

  if (
    searchQuery !== prevSearch ||
    categoryFilter !== prevCat ||
    statusFilter !== prevStatus ||
    seoFilter !== prevSeo ||
    readabilityFilter !== prevReadability ||
    typeFilter !== prevType ||
    stockFilter !== prevStock ||
    brandFilter !== prevBrand ||
    metaSyncFilter !== prevMetaSync
  ) {
    setPrevSearch(searchQuery);
    setPrevCat(categoryFilter);
    setPrevStatus(statusFilter);
    setPrevSeo(seoFilter);
    setPrevReadability(readabilityFilter);
    setPrevType(typeFilter);
    setPrevStock(stockFilter);
    setPrevBrand(brandFilter);
    setPrevMetaSync(metaSyncFilter);
    setCurrentPage(1);
  }

  const formatKsh = (num: number) => {
    return "KSh " + num.toLocaleString("en-KE");
  };

  const filteredProducts = allProducts.filter((p: any) => {
    // 1. Search Query
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Category
    const matchesCategory =
      !categoryFilter ||
      p.categories.some((c: any) => c.slug === categoryFilter);

    // 3. Status Filter (tabs)
    const prodStatus = p.status || "publish"; 
    let matchesStatus = true;
    if (statusFilter === "all") {
      matchesStatus = prodStatus !== "trash";
    } else if (statusFilter === "publish") {
      matchesStatus = prodStatus === "publish";
    } else if (statusFilter === "draft") {
      matchesStatus = prodStatus === "draft";
    } else if (statusFilter === "private") {
      matchesStatus = prodStatus === "private";
    } else if (statusFilter === "cornerstone") {
      matchesStatus = p.isCornerstone === true && prodStatus !== "trash";
    } else if (statusFilter === "trash") {
      matchesStatus = prodStatus === "trash";
    }

    // 4. Brand Filter
    const matchesBrand =
      !brandFilter ||
      (p.brands && p.brands.some((b: any) => b.slug === brandFilter));

    // 5. Stock Status Filter
    const prodStock = p.stockStatus || (p.inStock ? "instock" : "outofstock");
    const matchesStock =
      !stockFilter ||
      prodStock === stockFilter;

    // 6. Product Type Filter
    const prodType = p.type || "simple";
    const matchesType =
      !typeFilter ||
      prodType === typeFilter;

    // 7. SEO Score Filter
    const seoScore = p.seoScore || (p.name.length > 30 ? 85 : 55); 
    let matchesSEO = true;
    if (seoFilter === "good") {
      matchesSEO = seoScore >= 80;
    } else if (seoFilter === "ok") {
      matchesSEO = seoScore >= 50 && seoScore < 80;
    } else if (seoFilter === "bad") {
      matchesSEO = seoScore < 50;
    }

    // 8. Readability Score Filter
    const readabilityScore = p.readabilityScore || (p.description && p.description.length > 200 ? "good" : "ok");
    let matchesReadability = true;
    if (readabilityFilter === "good") {
      matchesReadability = readabilityScore === "good";
    } else if (readabilityFilter === "ok") {
      matchesReadability = readabilityScore === "ok";
    } else if (readabilityFilter === "bad") {
      matchesReadability = readabilityScore === "bad";
    }

    // 9. Meta Sync Filter
    const syncedToMeta = p.syncedToMeta || false;
    let matchesMetaSync = true;
    if (metaSyncFilter === "synced") {
      matchesMetaSync = syncedToMeta === true;
    } else if (metaSyncFilter === "not_synced") {
      matchesMetaSync = syncedToMeta === false;
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesBrand &&
      matchesStock &&
      matchesType &&
      matchesSEO &&
      matchesReadability &&
      matchesMetaSync
    );
  });

  // Sort the filtered products list
  const sortedProductsList = [...filteredProducts].sort((a, b) => {
    let result = 0;
    if (productSortKey === "name") {
      result = (a.name || "").localeCompare(b.name || "");
    } else if (productSortKey === "sku") {
      result = (a.sku || "").localeCompare(b.sku || "");
    } else if (productSortKey === "price") {
      const priceA = Number(a.regularPrice || a.price || 0);
      const priceB = Number(b.regularPrice || b.price || 0);
      result = priceA - priceB;
    } else if (productSortKey === "salePrice") {
      const priceA = Number(a.salePrice || 0);
      const priceB = Number(b.salePrice || 0);
      result = priceA - priceB;
    } else if (productSortKey === "stock") {
      result = (a.stockStatus || "").localeCompare(b.stockStatus || "");
    } else if (productSortKey === "date") {
      const timeA = new Date(a.dateModified || a.dateCreated || 0).getTime();
      const timeB = new Date(b.dateModified || b.dateCreated || 0).getTime();
      result = timeA - timeB;
    }
    return productSortDirection === "asc" ? result : -result;
  });

  // Paginated selection
  const totalPages = Math.ceil(sortedProductsList.length / itemsPerPage);
  const paginatedProducts = sortedProductsList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApplyBulkAction = () => {
    if (selectedProductIds.length === 0) {
      alert("Please select at least one product first.");
      return;
    }
    if (bulkAction === "trash") {
      if (confirm(`Are you sure you want to move the ${selectedProductIds.length} selected products to Trash?`)) {
        document.getElementById("submitBulkTrash")?.click();
      }
    } else if (bulkAction === "restore") {
      if (confirm(`Are you sure you want to restore the ${selectedProductIds.length} selected products?`)) {
        document.getElementById("submitBulkRestore")?.click();
      }
    } else if (bulkAction === "delete") {
      if (confirm(`Are you sure you want to permanently delete the ${selectedProductIds.length} selected products? This action cannot be undone.`)) {
        document.getElementById("submitBulkDeletePermanently")?.click();
      }
    } else if (bulkAction === "edit") {
      setShowBulkEditModal(true);
    } else {
      alert("Please select a bulk action.");
    }
  };

  return (
    <div className="products-view" style={{ position: "relative" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .search-bar-row {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-grow: 1;
        }

        .catalog-table-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          box-shadow: 0 4px 25px rgba(0,0,0,0.25);
          padding: 24px;
        }

        .prod-thumb-cell {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          object-fit: contain;
          padding: 4px;
        }

        .edit-badge-btn {
          background: rgba(0, 204, 255, 0.1);
          border: 1px solid rgba(0, 204, 255, 0.3);
          color: #00ccff;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .edit-badge-btn:hover {
          background: #00ccff;
          color: #000;
        }

        /* Row actions */
        .row-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          margin-top: 6px;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out;
          white-space: nowrap;
        }

        tr:hover .row-actions {
          opacity: 1;
          visibility: visible;
        }

        .row-actions-separator {
          color: rgba(255, 255, 255, 0.15);
        }

        /* Glassmorphic Edit Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal-content {
          background: #111119;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 12px;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 20px;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .modal-close-btn:hover {
          color: #ff4d62;
        }

        .form-switch-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .switch-input {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }

        /* Screen Options styling */
        .screen-options-container {
          position: relative;
          margin-top: -40px;
          margin-left: -40px;
          margin-right: -40px;
          margin-bottom: 24px;
          z-index: 105;
        }

        .screen-options-wrapper {
          position: absolute;
          top: 0;
          right: 20px;
          z-index: 110;
          display: flex;
          gap: 2px;
        }

        .screen-options-toggle-btn {
          background: #111117;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-top: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 0 0 4px 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .screen-options-toggle-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .screen-options-drawer {
          background: #111117;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 0px 40px;
          max-height: 0px;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, opacity 0.25s ease;
        }

        .screen-options-drawer.open {
          padding: 24px 40px;
          max-height: 500px;
          opacity: 1;
        }

        .screen-options-title {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 4px;
        }

        .checkbox-group-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          user-select: none;
          transition: color 0.2s ease;
        }

        .checkbox-label:hover {
          color: #fff;
        }

        .checkbox-label input {
          cursor: pointer;
          accent-color: #00ccff;
        }

        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-top: 20px;
        }

        /* Directories Layout & Form inputs */
        .directory-layout {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          margin-top: 24px;
        }

        .directory-form-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          height: fit-content;
        }

        .directory-table-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
        }

        .form-group-admin {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .form-group-admin label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .form-group-admin input,
        .form-group-admin textarea,
        .form-group-admin select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          color: #fff;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .form-group-admin input:focus,
        .form-group-admin textarea:focus,
        .form-group-admin select:focus {
          border-color: #00ccff;
        }

        /* Deep Edit layout */
        .deep-edit-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .deep-edit-layout {
            grid-template-columns: 1fr;
          }
        }

        .edit-card {
          background: #101016;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .edit-card-header {
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 16px;
          font-weight: 600;
          color: #fff;
          font-size: 14px;
        }

        .edit-card-body {
          padding: 16px;
        }

        .product-data-wrapper {
          display: flex;
        }

        @media (max-width: 768px) {
          .product-data-wrapper {
            flex-direction: column;
          }
          .product-data-tabs {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            overflow-x: auto;
          }
          .product-data-tab-btn {
            border-bottom: none !important;
            border-right: 1px solid rgba(255, 255, 255, 0.04);
            white-space: nowrap;
          }
        }

        .product-data-tabs {
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          width: 180px;
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.15);
        }

        .product-data-tab-btn {
          padding: 12px 16px;
          text-align: left;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 500;
          width: 100%;
          display: block;
          transition: all 0.2s;
        }

        .product-data-tab-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
        }

        .product-data-tab-btn.active {
          background: rgba(0, 204, 255, 0.08);
          color: #00ccff;
          border-left: 3px solid #00ccff;
        }

        .product-data-fields {
          padding: 20px 24px;
          flex-grow: 1;
        }

        .yoast-snippet-preview {
          background: #ffffff;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          color: #1a1a1a;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .yoast-analysis-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .yoast-analysis-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          margin-bottom: 10px;
          color: rgba(255, 255, 255, 0.7);
        }
      ` }} />

      {/* VIEW: ALL PRODUCTS CATALOG */}
      {currentView === "all" && (
        <>
          <div className="screen-options-container">
            <div className="screen-options-wrapper">
              <button
                type="button"
                className="screen-options-toggle-btn"
                onClick={() => setShowOptions(!showOptions)}
              >
                Screen Options {showOptions ? "▲" : "▼"}
              </button>
            </div>
            <div className={`screen-options-drawer ${showOptions ? "open" : ""}`} style={{ marginBottom: "24px" }}>
            <div className="screen-options-title">Columns</div>
            <div className="checkbox-group-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showImage}
                  onChange={(e) => setShowImage(e.target.checked)}
                />
                Image
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showSKU}
                  onChange={(e) => setShowSKU(e.target.checked)}
                />
                SKU
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showGTIN}
                  onChange={(e) => setShowGTIN(e.target.checked)}
                />
                GTIN, UPC, EAN, or ISBN
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showStock}
                  onChange={(e) => setShowStock(e.target.checked)}
                />
                Stock
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                />
                Price
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showCategories}
                  onChange={(e) => setShowCategories(e.target.checked)}
                />
                Categories
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showTags}
                  onChange={(e) => setShowTags(e.target.checked)}
                />
                Tags
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showFeatured}
                  onChange={(e) => setShowFeatured(e.target.checked)}
                />
                Featured
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showDate}
                  onChange={(e) => setShowDate(e.target.checked)}
                />
                Date
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showMetaSync}
                  onChange={(e) => setShowMetaSync(e.target.checked)}
                />
                Synced to Meta catalog
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showBrands}
                  onChange={(e) => setShowBrands(e.target.checked)}
                />
                Brands
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showOutgoingLinks}
                  onChange={(e) => setShowOutgoingLinks(e.target.checked)}
                />
                Outgoing internal links
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showReceivedLinks}
                  onChange={(e) => setShowReceivedLinks(e.target.checked)}
                />
                Received internal links
              </label>
            </div>

            <div className="screen-options-title" style={{ marginTop: "24px" }}>Pagination</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>Number of items per page:</span>
              <input
                type="number"
                className="admin-input"
                style={{ width: "80px", background: "rgba(0,0,0,0.3)", padding: "6px 10px" }}
                value={tempItemsPerPage}
                min={1}
                max={100}
                onChange={(e) => setTempItemsPerPage(Math.max(1, Number(e.target.value)))}
              />
              <button
                className="btn-action-primary"
                style={{ padding: "6px 16px", fontSize: "12px", height: "32px", display: "flex", alignItems: "center" }}
                onClick={() => {
                  setItemsPerPage(tempItemsPerPage);
                  setCurrentPage(1);
                  setShowOptions(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Page Sub-Header matching the second image */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#fff", margin: 0 }}>Products</h2>
            <Link to="?view=new" className="btn-action-secondary" style={{ padding: "4px 12px", fontSize: "12px", height: "30px", display: "flex", alignItems: "center", borderColor: "rgba(0, 204, 255, 0.4)", color: "#00ccff", textDecoration: "none", background: "rgba(0, 204, 255, 0.05)" }}>Add new product</Link>
            <button type="button" className="btn-action-secondary" style={{ padding: "4px 12px", fontSize: "12px", height: "30px", display: "flex", alignItems: "center" }} onClick={() => alert("CSV Import utility ready")}>Import</button>
            <a href="?export=csv" download="products-export.csv" className="btn-action-secondary" style={{ padding: "4px 12px", fontSize: "12px", height: "30px", display: "flex", alignItems: "center", textDecoration: "none", color: "#fff", borderColor: "rgba(255,255,255,0.15)" }}>Export</a>
            <button type="button" className="btn-action-secondary" style={{ padding: "4px 12px", fontSize: "12px", height: "30px", display: "flex", alignItems: "center" }} onClick={() => alert("Spreadsheet bulk editor ready")}>Open in a Spreadsheet</button>
          </div>
        </div>

        {/* Search and Catalog Filter Controls */}
        {/* Search and Status links row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
          {/* Status links (WordPress style) */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "rgba(255,255,255,0.3)", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
                setCategoryFilter("");
                setBrandFilter("");
                setStockFilter("");
                setSeoFilter("");
                setReadabilityFilter("");
                setTypeFilter("");
                setMetaSyncFilter("");
                setCurrentPage(1);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                color: statusFilter === "all" ? "#00ccff" : "rgba(255,255,255,0.7)",
                fontWeight: statusFilter === "all" ? "600" : "normal"
              }}
            >
              All ({countAll})
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("publish");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                color: statusFilter === "publish" ? "#00ccff" : "rgba(255,255,255,0.7)",
                fontWeight: statusFilter === "publish" ? "600" : "normal"
              }}
            >
              Published ({countPublished})
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("draft");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                color: statusFilter === "draft" ? "#00ccff" : "rgba(255,255,255,0.7)",
                fontWeight: statusFilter === "draft" ? "600" : "normal"
              }}
            >
              Drafts ({countDrafts})
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("private");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                color: statusFilter === "private" ? "#00ccff" : "rgba(255,255,255,0.7)",
                fontWeight: statusFilter === "private" ? "600" : "normal"
              }}
            >
              Private ({countPrivate})
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("cornerstone");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                color: statusFilter === "cornerstone" ? "#00ccff" : "rgba(255,255,255,0.7)",
                fontWeight: statusFilter === "cornerstone" ? "600" : "normal"
              }}
            >
              Cornerstone content ({countCornerstone})
            </button>
            {countTrash > 0 && (
              <>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("trash");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                    cursor: "pointer",
                    color: statusFilter === "trash" ? "#ff4d62" : "rgba(255,255,255,0.7)",
                    fontWeight: statusFilter === "trash" ? "600" : "normal"
                  }}
                >
                  Trash ({countTrash})
                </button>
              </>
            )}
          </div>

          {/* Search box right-aligned */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              placeholder="Search products..."
              className="admin-input"
              style={{ height: "32px", width: "200px", padding: "4px 10px", fontSize: "13px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className="btn-action-secondary"
              style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer" }}
            >
              Search products
            </button>
          </div>
        </div>

        {/* Toolbar of Filters (Dropdowns & Action buttons) */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {/* Bulk actions */}
          <select
            className="admin-select"
            style={{ minWidth: "130px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">Bulk actions</option>
            {statusFilter === "trash" ? (
              <>
                <option value="restore">Restore</option>
                <option value="delete">Delete permanently</option>
              </>
            ) : (
              <>
                <option value="edit">Bulk edit</option>
                <option value="trash">Move to Trash</option>
              </>
            )}
          </select>
          <button
            type="button"
            className="btn-action-secondary"
            style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer" }}
            onClick={handleApplyBulkAction}
          >
            Apply
          </button>

          {/* Categories */}
          <select
            className="admin-select"
            style={{ minWidth: "130px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Select a category</option>
            {allCategories.map((c: any) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Product Type */}
          <select
            className="admin-select"
            style={{ minWidth: "150px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Filter by product type</option>
            <option value="simple">Simple product</option>
            <option value="variable">Variable product</option>
            <option value="grouped">Grouped product</option>
            <option value="external">External/Affiliate product</option>
          </select>

          {/* Stock Status */}
          <select
            className="admin-select"
            style={{ minWidth: "150px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="">Filter by stock status</option>
            <option value="instock">In stock</option>
            <option value="outofstock">Out of stock</option>
            <option value="onbackorder">On backorder</option>
          </select>

          {/* Brand */}
          <select
            className="admin-select"
            style={{ minWidth: "130px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="">Filter by brand</option>
            {allBrands.map((b: any) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Synced to Meta */}
          <select
            className="admin-select"
            style={{ minWidth: "170px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
            value={metaSyncFilter}
            onChange={(e) => setMetaSyncFilter(e.target.value)}
          >
            <option value="">Filter by synced to Meta</option>
            <option value="synced">Synced</option>
            <option value="not_synced">Not Synced</option>
          </select>

          {/* Filter Action */}
          <button
            type="button"
            className="btn-action-secondary"
            style={{ height: "32px", padding: "0 14px", fontSize: "12px", color: "#00ccff", borderColor: "rgba(0, 204, 255, 0.3)", cursor: "pointer" }}
            onClick={() => {
              setCurrentPage(1);
            }}
          >
            Filter
          </button>

          {countTrash > 0 && (
            <Form method="post" style={{ display: "inline" }}>
              <input type="hidden" name="intent" value="empty_trash_products" />
              <button
                type="submit"
                className="btn-action-secondary"
                style={{ height: "32px", padding: "0 14px", fontSize: "12px", color: "#00ccff", borderColor: "rgba(0, 204, 255, 0.3)", cursor: "pointer", background: "rgba(0, 204, 255, 0.05)" }}
                onClick={(e) => {
                  if (!confirm("Are you sure you want to permanently delete all products in the Trash? This action cannot be undone.")) {
                    e.preventDefault();
                  }
                }}
              >
                Empty Trash
              </button>
            </Form>
          )}

          {/* Clear filters shortcut */}
          {(seoFilter || readabilityFilter || categoryFilter || typeFilter || stockFilter || brandFilter || metaSyncFilter || searchQuery || statusFilter !== "all") && (
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#ff5252",
                fontSize: "12px",
                cursor: "pointer",
                padding: "0 4px",
                textDecoration: "underline"
              }}
              onClick={() => {
                setSeoFilter("");
                setReadabilityFilter("");
                setCategoryFilter("");
                setTypeFilter("");
                setStockFilter("");
                setBrandFilter("");
                setMetaSyncFilter("");
                setSearchQuery("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear
            </button>
          )}

          {selectedProductIds.length > 0 && (
            <span style={{ fontSize: "13px", color: "#00ccff", fontWeight: "600", marginLeft: "8px" }}>
              {selectedProductIds.length} items selected
            </span>
          )}

          <Form method="post" style={{ display: "none" }}>
            <input type="hidden" name="intent" value="bulk_trash" />
            <input type="hidden" name="ids" value={JSON.stringify(selectedProductIds)} />
            <button id="submitBulkTrash" type="submit" />
          </Form>

          <Form method="post" style={{ display: "none" }}>
            <input type="hidden" name="intent" value="bulk_restore" />
            <input type="hidden" name="ids" value={JSON.stringify(selectedProductIds)} />
            <button id="submitBulkRestore" type="submit" />
          </Form>

          <Form method="post" style={{ display: "none" }}>
            <input type="hidden" name="intent" value="bulk_delete_permanently" />
            <input type="hidden" name="ids" value={JSON.stringify(selectedProductIds)} />
            <button id="submitBulkDeletePermanently" type="submit" />
          </Form>
        </div>

        <div className="catalog-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={paginatedProducts.length > 0 && selectedProductIds.length === paginatedProducts.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(paginatedProducts.map((p: any) => p.id));
                          } else {
                            setSelectedProductIds([]);
                          }
                        }}
                      />
                    </th>
                    {showImage && <th>Thumbnail</th>}
                    <th onClick={() => handleProductSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Product Details {renderProductSortIndicator("name")}
                    </th>
                    {showSKU && (
                      <th onClick={() => handleProductSort("sku")} style={{ cursor: "pointer", userSelect: "none" }}>
                        SKU {renderProductSortIndicator("sku")}
                      </th>
                    )}
                    {showPrice && (
                      <>
                        <th onClick={() => handleProductSort("price")} style={{ cursor: "pointer", userSelect: "none" }}>
                          Regular Price {renderProductSortIndicator("price")}
                        </th>
                        <th onClick={() => handleProductSort("salePrice")} style={{ cursor: "pointer", userSelect: "none" }}>
                          Sale Price {renderProductSortIndicator("salePrice")}
                        </th>
                      </>
                    )}
                    {showStock && (
                      <th onClick={() => handleProductSort("stock")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Stock Status {renderProductSortIndicator("stock")}
                      </th>
                    )}
                    {showDate && (
                      <th onClick={() => handleProductSort("date")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Date {renderProductSortIndicator("date")}
                      </th>
                    )}
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((prod: any) => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    return (
                      <tr key={prod.id} style={{ background: isSelected ? "rgba(0, 204, 255, 0.05)" : undefined }}>
                        <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedProductIds(selectedProductIds.filter(id => id !== prod.id));
                              } else {
                                setSelectedProductIds([...selectedProductIds, prod.id]);
                              }
                            }}
                          />
                        </td>
                        {showImage && (
                          <td>
                            <img
                              className="prod-thumb-cell"
                              src={prod.thumbnail || "/assets/images/products/Cool-Pods.jpg"}
                              alt={prod.name}
                            />
                          </td>
                        )}
                        <td>
                          <div style={{ fontWeight: "600", color: "#fff", fontSize: "14px" }}>
                            {prod.name}
                          </div>
                          <div className="row-actions">
                            <span style={{ color: "rgba(255, 255, 255, 0.45)" }}>ID: {prod.id}</span>
                            {prod.status === "trash" ? (
                              <>
                                <span className="row-actions-separator">|</span>
                                <Form method="post" style={{ display: "inline" }}>
                                  <input type="hidden" name="intent" value="restore_product" />
                                  <input type="hidden" name="id" value={prod.id} />
                                  <button type="submit" style={{ background: "none", border: "none", color: "#00ccff", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }}>Restore</button>
                                </Form>
                                <span className="row-actions-separator">|</span>
                                <Form method="post" style={{ display: "inline" }}>
                                  <input type="hidden" name="intent" value="delete_product_permanently" />
                                  <input type="hidden" name="id" value={prod.id} />
                                  <button type="submit" style={{ background: "none", border: "none", color: "#ff4d62", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }} onClick={(e) => { if(!confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) e.preventDefault(); }}>Delete Permanently</button>
                                </Form>
                              </>
                            ) : (
                              <>
                                <span className="row-actions-separator">|</span>
                                <Link to={`?view=edit&id=${prod.id}`} style={{ color: "#00ccff", textDecoration: "none" }}>Edit</Link>
                                <span className="row-actions-separator">|</span>
                                <button type="button" onClick={() => setEditingProduct(prod)} style={{ background: "none", border: "none", color: "#00ccff", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }}>Quick Edit</button>
                                <span className="row-actions-separator">|</span>
                                <Form method="post" style={{ display: "inline" }}>
                                  <input type="hidden" name="intent" value="trash_product" />
                                  <input type="hidden" name="id" value={prod.id} />
                                  <button type="submit" style={{ background: "none", border: "none", color: "#ff4d62", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }} onClick={(e) => { if(!confirm("Are you sure you want to move this product to Trash?")) e.preventDefault(); }}>Trash</button>
                                </Form>
                                <span className="row-actions-separator">|</span>
                                <a href={`/product/${prod.slug}`} target="_blank" rel="noreferrer" style={{ color: "#00ccff", textDecoration: "none" }}>View</a>
                              </>
                            )}
                            <span className="row-actions-separator">|</span>
                            <Form method="post" style={{ display: "inline" }}>
                              <input type="hidden" name="intent" value="duplicate_product" />
                              <input type="hidden" name="id" value={prod.id} />
                              <button type="submit" style={{ background: "none", border: "none", color: "#00ccff", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }}>Duplicate</button>
                            </Form>
                          </div>
                          {showCategories && (
                            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", marginTop: "4px" }}>
                              {prod.categories.map((c: any) => c.name).join(", ")}
                            </div>
                          )}
                        </td>
                        {showSKU && <td style={{ fontFamily: "monospace" }}>{prod.sku || "N/A"}</td>}
                        {showPrice && (
                          <>
                            <td>{formatKsh(prod.regularPrice)}</td>
                            <td style={{ color: prod.onSale ? "#2ed573" : "inherit" }}>
                              {prod.onSale ? formatKsh(prod.salePrice) : "—"}
                            </td>
                          </>
                        )}
                        {showStock && (
                          <td>
                            <span className={`status-badge ${prod.inStock ? "completed" : "failed"}`}>
                              {prod.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          </td>
                        )}
                        {showDate && (
                          <td style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", minWidth: "150px" }}>
                            <div>
                              Published<br />
                              <strong style={{ color: "#fff" }}>{formatDate(prod.dateCreated)}</strong>
                            </div>
                            {prod.dateModified && prod.dateModified !== prod.dateCreated && (
                              <div style={{ fontSize: "10px", marginTop: "4px", color: "rgba(255, 255, 255, 0.4)" }}>
                                Last Modified:<br />
                                <strong>{formatDate(prod.dateModified)}</strong>
                              </div>
                            )}
                          </td>
                        )}
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="edit-badge-btn"
                            onClick={() => setEditingProduct(prod)}
                          >
                            Quick Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length > 0 && (
              <div className="pagination-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <select
                    className="admin-select"
                    style={{ minWidth: "130px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                  >
                    <option value="">Bulk actions</option>
                    {statusFilter === "trash" ? (
                      <>
                        <option value="restore">Restore</option>
                        <option value="delete">Delete permanently</option>
                      </>
                    ) : (
                      <>
                        <option value="edit">Bulk edit</option>
                        <option value="trash">Move to Trash</option>
                      </>
                    )}
                  </select>
                  <button
                    type="button"
                    className="btn-action-secondary"
                    style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer" }}
                    onClick={handleApplyBulkAction}
                  >
                    Apply
                  </button>

                  {countTrash > 0 && (
                    <Form method="post" style={{ display: "inline" }}>
                      <input type="hidden" name="intent" value="empty_trash_products" />
                      <button
                        type="submit"
                        className="btn-action-secondary"
                        style={{ height: "32px", padding: "0 14px", fontSize: "12px", color: "#00ccff", borderColor: "rgba(0, 204, 255, 0.3)", cursor: "pointer", background: "rgba(0, 204, 255, 0.05)" }}
                        onClick={(e) => {
                          if (!confirm("Are you sure you want to permanently delete all products in the Trash? This action cannot be undone.")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Empty Trash
                      </button>
                    </Form>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                    {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        className="btn-action-secondary"
                        style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      >
                        ◀ Previous Page
                      </button>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        className="btn-action-secondary"
                        style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      >
                        Next Page ▶
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
      </>
    )}

      {/* VIEW: DEEP EDIT PRODUCT */}
      {currentView === "edit" && editingProductDetails && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "600", color: "#fff" }}>Edit Product</h2>
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
                ID: {editingProductDetails.id} • Slug: <span style={{ fontFamily: "monospace" }}>{slugVal}</span>
              </span>
            </div>
            <Link to="/store_backend/products" className="btn-action-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              ◀ Back to Catalog
            </Link>
          </div>

          <Form method="post" encType="multipart/form-data">
            <input type="hidden" name="intent" value="save_product_details" />
            <input type="hidden" name="id" value={editingProductDetails.id} />
            <input type="hidden" name="originalSlug" value={editingProductDetails.slug} />
            <input type="hidden" name="currentThumbnail" value={editingProductDetails.thumbnail} />

            <div className="deep-edit-layout">
              {/* Left Column */}
              <div className="deep-edit-column-left">
                {searchParams.get("updated") === "true" && (
                  <div style={{
                    background: "rgba(46, 213, 115, 0.1)",
                    border: "1px solid rgba(46, 213, 115, 0.3)",
                    borderRadius: "6px",
                    color: "#2ed573",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{ fontSize: "16px" }}>✓</span>
                    <span>Product updated successfully. <a href={`/product/${slugVal}`} target="_blank" rel="noreferrer" style={{ color: "#00ccff", textDecoration: "underline", fontWeight: "600", marginLeft: "4px" }}>View Product</a></span>
                  </div>
                )}

                {/* Title */}
                <div className="form-group-admin" style={{ marginBottom: "20px" }}>
                  <input
                    type="text"
                    name="name"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    placeholder="Enter product title here"
                    style={{ fontSize: "18px", fontWeight: "600", padding: "12px 16px" }}
                    required
                  />
                </div>

                {/* Permalink Editor */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255, 255, 255, 0.65)", marginBottom: "20px", paddingLeft: "4px" }}>
                  <span>Permalink:</span>
                  <span style={{ color: "rgba(255, 255, 255, 0.45)" }}>{origin}/product/</span>
                  
                  {isEditingSlug ? (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="text"
                        name="slug"
                        value={slugVal}
                        onChange={(e) => setSlugVal(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                        placeholder="product-slug"
                        style={{
                          background: "#050508",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "4px",
                          color: "#fff",
                          padding: "2px 6px",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          width: "200px"
                        }}
                        required
                      />
                      <span>/</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingSlug(false)}
                        className="btn-action-primary"
                        style={{ padding: "2px 10px", fontSize: "11px", height: "auto" }}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSlugVal(editingProductDetails.slug || "");
                          setIsEditingSlug(false);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(255, 255, 255, 0.4)",
                          fontSize: "11px",
                          cursor: "pointer",
                          textDecoration: "underline"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <a
                        href={`/product/${slugVal}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#00ccff",
                          textDecoration: "underline",
                          fontFamily: "monospace"
                        }}
                      >
                        {slugVal || "product-slug"}
                      </a>
                      <span>/</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingSlug(true)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "4px",
                          color: "#fff",
                          padding: "2px 10px",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}

                  {!isEditingSlug && <input type="hidden" name="slug" value={slugVal} />}
                </div>

                {/* Long Description */}
                <div className="edit-card">
                  <div className="edit-card-header">Product Description</div>
                  <div className="edit-card-body">
                    <div className="form-group-admin" style={{ margin: 0 }}>
                      <VisualCodeEditor
                        name="description"
                        value={descVal}
                        onChange={setDescVal}
                        placeholder="Describe the product in detail (supports HTML)..."
                        rows={12}
                      />
                    </div>
                  </div>
                </div>



                {/* Product Data */}
                <div className="edit-card">
                  <div className="edit-card-header" style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <span>Product data</span>
                    <select
                      name="type"
                      value={typeVal}
                      onChange={(e) => setTypeVal(e.target.value)}
                      style={{ background: "#0a0a0f", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", padding: "4px 8px", fontSize: "12px", borderRadius: "4px", width: "auto" }}
                    >
                      <option value="simple" style={{ background: "#0a0a0f", color: "#fff" }}>Simple product</option>
                      <option value="variable" style={{ background: "#0a0a0f", color: "#fff" }}>Variable product</option>
                    </select>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "auto" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
                        <input type="checkbox" name="virtual" value="true" defaultChecked={editingProductDetails.virtual} /> Virtual
                      </label>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
                        <input type="checkbox" name="downloadable" value="true" defaultChecked={editingProductDetails.downloadable} /> Downloadable
                      </label>
                    </div>
                  </div>

                  <div className="product-data-wrapper">
                    {/* Left tabs */}
                    <div className="product-data-tabs">
                      <button type="button" className={`product-data-tab-btn ${activeDataTab === "general" ? "active" : ""}`} onClick={() => setActiveDataTab("general")}>General</button>
                      <button type="button" className={`product-data-tab-btn ${activeDataTab === "inventory" ? "active" : ""}`} onClick={() => setActiveDataTab("inventory")}>Inventory</button>
                      <button type="button" className={`product-data-tab-btn ${activeDataTab === "shipping" ? "active" : ""}`} onClick={() => setActiveDataTab("shipping")}>Shipping</button>
                      <button type="button" className={`product-data-tab-btn ${activeDataTab === "attributes" ? "active" : ""}`} onClick={() => setActiveDataTab("attributes")}>Attributes</button>
                    </div>

                    {/* Content area */}
                    <div className="product-data-fields">
                      <div style={{ display: activeDataTab === "general" ? "block" : "none" }}>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center" }}>
                          <label style={{ marginBottom: 0 }}>Regular Price (KSh)</label>
                          <input type="number" name="regularPrice" defaultValue={editingProductDetails.regularPrice} />
                        </div>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                          <label style={{ marginBottom: 0 }}>Sale Price (KSh)</label>
                          <input type="number" name="salePrice" defaultValue={editingProductDetails.salePrice || ""} placeholder="No Discount" />
                        </div>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                          <label style={{ marginBottom: 0 }}>Tax Status</label>
                          <select name="taxStatus" defaultValue="taxable">
                            <option value="taxable">Taxable</option>
                            <option value="shipping">Shipping only</option>
                            <option value="none">None</option>
                          </select>
                        </div>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                          <label style={{ marginBottom: 0 }}>Tax Class</label>
                          <select name="taxClass" defaultValue="standard">
                            <option value="standard">Standard</option>
                            <option value="zero-rate">Zero rate</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: activeDataTab === "inventory" ? "block" : "none" }}>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center" }}>
                          <label style={{ marginBottom: 0 }}>SKU</label>
                          <input type="text" name="sku" defaultValue={editingProductDetails.sku || ""} placeholder="VP-PRODUCT-SKU" />
                        </div>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                          <label style={{ marginBottom: 0 }}>Manage Stock?</label>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#fff", fontSize: "13px" }}>
                            <input 
                              type="checkbox" 
                              name="manageStock" 
                              value="true" 
                              defaultChecked={editingProductDetails.manageStock !== false} 
                            /> Track stock quantity
                          </label>
                        </div>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                          <label style={{ marginBottom: 0 }}>Stock Status</label>
                          <select name="inStock" defaultValue={editingProductDetails.inStock ? "true" : "false"}>
                            <option value="true">In Stock</option>
                            <option value="false">Out of Stock</option>
                          </select>
                        </div>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                          <label style={{ marginBottom: 0 }}>Stock Quantity</label>
                          <input
                            type="number"
                            name="stockQty"
                            defaultValue={
                              editingProductDetails.lowStockRemaining !== undefined &&
                              editingProductDetails.lowStockRemaining !== null
                                ? editingProductDetails.lowStockRemaining
                                : (editingProductDetails.inStock ? 10 : 0)
                            }
                          />
                        </div>
                      </div>

                      <div style={{ display: activeDataTab === "shipping" ? "block" : "none" }}>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center" }}>
                          <label style={{ marginBottom: 0 }}>Weight (kg)</label>
                          <input type="number" step="0.1" name="weight" defaultValue={editingProductDetails.weight || ""} placeholder="0" />
                        </div>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                          <label style={{ marginBottom: 0 }}>Dimensions (cm)</label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                            <input type="number" name="length" defaultValue={editingProductDetails.dimensions?.length || ""} placeholder="Length" />
                            <input type="number" name="width" defaultValue={editingProductDetails.dimensions?.width || ""} placeholder="Width" />
                            <input type="number" name="height" defaultValue={editingProductDetails.dimensions?.height || ""} placeholder="Height" />
                          </div>
                        </div>
                        <div className="form-group-admin" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                          <label style={{ marginBottom: 0 }}>Shipping Class</label>
                          <select name="shippingClass" defaultValue="no-class">
                            <option value="no-class">Same as parent</option>
                            <option value="heavy">Heavy items</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: activeDataTab === "attributes" ? "block" : "none" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>Custom Product Attributes</h4>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>Select and define options for this product:</p>
                        {allAttributes.map((attr: any) => (
                          <div key={attr.slug} style={{ background: "rgba(255,255,255,0.02)", padding: "12px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", marginBottom: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontWeight: "600", fontSize: "13px", color: "#fff" }}>{attr.name}</span>
                              <label style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                                <input type="checkbox" defaultChecked /> Visible on product page
                              </label>
                            </div>
                            <input type="text" className="form-group-admin input" placeholder={`e.g. ${attr.terms}`} defaultValue={attr.terms.split(", ")[0]} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Description */}
                <div className="edit-card">
                  <div className="edit-card-header">Product Short Description</div>
                  <div className="edit-card-body">
                    <div className="form-group-admin" style={{ margin: 0 }}>
                      <VisualCodeEditor
                        name="shortDescription"
                        value={shortDescVal}
                        onChange={setShortDescVal}
                        placeholder="Brief summary shown next to image (supports HTML)..."
                        rows={6}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="deep-edit-column-right">
                {/* Publish box */}
                <div className="edit-card">
                  <div className="edit-card-header">Publish</div>
                  <div className="edit-card-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Product Status:</label>
                      <select
                        name="status"
                        defaultValue={editingProductDetails.status || "publish"}
                        style={{
                          background: "#0a0a0f",
                          border: "1px solid rgba(255,255,255,0.15)",
                          padding: "6px 10px",
                          fontSize: "13px",
                          borderRadius: "4px",
                          color: "#fff",
                          width: "100%"
                        }}
                      >
                        <option value="publish">Published</option>
                        <option value="draft">Draft</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                      <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Visibility:</label>
                      <select
                        name="visibility"
                        value={visibilityVal}
                        onChange={(e) => setVisibilityVal(e.target.value)}
                        style={{
                          background: "#0a0a0f",
                          border: "1px solid rgba(255,255,255,0.15)",
                          padding: "6px 10px",
                          fontSize: "13px",
                          borderRadius: "4px",
                          color: "#fff",
                          width: "100%"
                        }}
                      >
                        <option value="public">Public (Visible to all)</option>
                        <option value="password">Password protected</option>
                        <option value="private">Private (Admins only)</option>
                      </select>

                      {visibilityVal === "password" && (
                        <div style={{ marginTop: "6px" }}>
                          <input
                            type="text"
                            name="visibilityPassword"
                            value={visibilityPasswordVal}
                            onChange={(e) => setVisibilityPasswordVal(e.target.value)}
                            placeholder="Set product password..."
                            style={{
                              background: "#050508",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: "4px",
                              color: "#fff",
                              padding: "6px 10px",
                              fontSize: "12px",
                              width: "100%"
                            }}
                            required={visibilityVal === "password"}
                          />
                        </div>
                      )}
                    </div>

                    {editPublishDate ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                        <input
                          type="datetime-local"
                          value={dateCreatedVal ? new Date(new Date(dateCreatedVal).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              setDateCreatedVal(new Date(e.target.value).toISOString());
                            }
                          }}
                          style={{
                            background: "#050508",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "4px",
                            color: "#fff",
                            padding: "4px 8px",
                            fontSize: "12px",
                            width: "100%"
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setEditPublishDate(false)}
                            className="btn-action-primary"
                            style={{ padding: "4px 10px", fontSize: "11px", height: "auto" }}
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDateCreatedVal(editingProductDetails.dateCreated || new Date().toISOString());
                              setEditPublishDate(false);
                            }}
                            className="btn-action-secondary"
                            style={{ padding: "4px 10px", fontSize: "11px", height: "auto" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Published on:</span>
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>
                          <strong>{formatDate(dateCreatedVal)}</strong>
                          <button
                            type="button"
                            onClick={() => setEditPublishDate(true)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#00ccff",
                              textDecoration: "underline",
                              fontSize: "12px",
                              marginLeft: "6px",
                              cursor: "pointer"
                            }}
                          >
                            Edit
                          </button>
                        </span>
                      </div>
                    )}
                    <input type="hidden" name="dateCreated" value={dateCreatedVal} />

                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="btn-action-primary"
                      style={{ width: "100%", marginTop: "8px", height: "40px", fontSize: "13px" }}
                    >
                      {isUpdating ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>

                {/* Product Image */}
                <div className="edit-card">
                  <div className="edit-card-header">Product image</div>
                  <div className="edit-card-body" style={{ textAlign: "center" }}>
                    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "10px", background: "rgba(0,0,0,0.2)", marginBottom: "12px" }}>
                      <img
                        src={thumbnailPreviewUrl || "/assets/images/products/Cool-Pods.jpg"}
                        alt={nameVal}
                        style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain", borderRadius: "4px" }}
                      />
                    </div>
                    <input 
                      type="file" 
                      name="thumbnail" 
                      accept="image/*" 
                      style={{ fontSize: "11px", width: "100%" }} 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const localUrl = URL.createObjectURL(file);
                          setThumbnailPreviewUrl(localUrl);
                        }
                      }}
                    />
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>Click image to select or upload a new one.</p>
                  </div>
                </div>

                {/* Product Gallery */}
                <div className="edit-card">
                  <div className="edit-card-header">Product gallery</div>
                  <div className="edit-card-body">
                    {(galleryImages.length > 0 || galleryPreviews.length > 0) && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
                        {galleryImages.map((img: any, idx: number) => (
                          <div key={img.id || idx} style={{ position: "relative", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "4px", background: "rgba(0,0,0,0.2)" }}>
                            <img
                              src={img.src}
                              alt=""
                              style={{ width: "100%", height: "60px", objectFit: "contain", borderRadius: "2px" }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Remove this image from gallery?")) {
                                  setGalleryImages(prev => prev.filter((_, i) => i !== idx));
                                }
                              }}
                              style={{
                                position: "absolute",
                                top: "-4px",
                                right: "-4px",
                                background: "#ff4d62",
                                border: "none",
                                borderRadius: "50%",
                                width: "18px",
                                height: "18px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "10px",
                                cursor: "pointer",
                                padding: 0
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {galleryPreviews.map((src, idx) => (
                          <div key={`preview-${idx}`} style={{ position: "relative", border: "1px solid rgba(0, 204, 255, 0.3)", borderRadius: "4px", padding: "4px", background: "rgba(0, 204, 255, 0.05)" }}>
                            <img
                              src={src}
                              alt="Preview"
                              style={{ width: "100%", height: "60px", objectFit: "contain", borderRadius: "2px" }}
                            />
                            <span style={{
                              position: "absolute",
                              bottom: "2px",
                              right: "2px",
                              background: "rgba(0, 204, 255, 0.8)",
                              color: "#000",
                              fontSize: "8px",
                              padding: "1px 3px",
                              borderRadius: "2px",
                              fontWeight: "bold"
                            }}>
                              New
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <input type="hidden" name="existingGalleryJson" value={JSON.stringify(galleryImages)} />
                    <input 
                      type="file" 
                      name="gallery" 
                      accept="image/*" 
                      multiple 
                      style={{ fontSize: "11px", width: "100%" }} 
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          const urls = Array.from(files).map(file => URL.createObjectURL(file));
                          setGalleryPreviews(urls);
                        }
                      }}
                    />
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>Choose multiple files to upload to the slide show gallery.</p>
                  </div>
                </div>

                {/* Categories */}
                <div className="edit-card">
                  <div className="edit-card-header">Product categories</div>
                  <div className="edit-card-body" style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {allCategories.map((cat: any) => {
                      const isChecked = editingProductDetails.categories?.some((c: any) => c.slug === cat.slug);
                      return (
                        <label key={cat.slug} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>
                          <input type="checkbox" name="categories" value={cat.slug} defaultChecked={isChecked} />
                          {cat.name}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Brands */}
                <div className="edit-card">
                  <div className="edit-card-header">Brands</div>
                  <div className="edit-card-body" style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {allBrands.map((brand: any) => {
                      const isChecked = editingProductDetails.brands?.some((b: any) => b.slug === brand.slug);
                      return (
                        <label key={brand.slug} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>
                          <input type="checkbox" name="brands" value={brand.slug} defaultChecked={isChecked} />
                          {brand.name}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div className="edit-card">
                  <div className="edit-card-header">Product tags</div>
                  <div className="edit-card-body">
                    <input
                      type="text"
                      name="tags"
                      defaultValue={(editingProductDetails.tags || []).map((t: any) => typeof t === "object" ? t.name : t).join(", ")}
                      placeholder="e.g. 4K, Smart, Vidaa"
                      style={{ fontSize: "12px", width: "100%", marginBottom: "8px" }}
                    />
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Separate tags with commas.</span>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </div>
      )}

      {/* VIEW: ADD NEW PRODUCT */}
      {currentView === "new" && (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff" }}>Add New Product</h2>
            <Link to="/store_backend/products" className="btn-action-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              ◀ Back to Catalog
            </Link>
          </div>

          <div className="directory-form-card" style={{ width: "100%" }}>
            <Form method="post" replace>
              <input type="hidden" name="intent" value="add_product" />
              
              <div className="form-group-admin">
                <label>Product Name <span style={{ color: "#ff4d62" }}>*</span></label>
                <input type="text" name="name" required placeholder="e.g. Bonnie Adult Dog Food - Beef 15kg" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group-admin">
                  <label>SKU (Stock Keeping Unit)</label>
                  <input type="text" name="sku" placeholder="e.g. VP55UHD" />
                </div>
                <div className="form-group-admin">
                  <label>Category</label>
                  <select name="category">
                    <option value="">Select Category...</option>
                    {allCategories.map((c: any) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group-admin">
                  <label>Regular Price (KSh) <span style={{ color: "#ff4d62" }}>*</span></label>
                  <input type="number" name="regularPrice" required min={0} placeholder="e.g. 54999" />
                </div>
                <div className="form-group-admin">
                  <label>Sale Price (KSh)</label>
                  <input type="number" name="salePrice" min={0} placeholder="e.g. 49999 (optional)" />
                </div>
              </div>

              <div className="form-group-admin">
                <label>Product Status</label>
                <select name="status" defaultValue="publish">
                  <option value="publish">Published</option>
                  <option value="draft">Draft</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                <div className="form-switch-row" style={{ alignSelf: "center", margin: 0 }}>
                  <input type="checkbox" name="manageStock" value="true" defaultChecked className="switch-input" id="newManageStock" />
                  <label htmlFor="newManageStock" style={{ cursor: "pointer", fontSize: "14px", color: "#fff" }}>Manage stock quantity</label>
                </div>
                <div className="form-group-admin" style={{ margin: 0 }}>
                  <label>Stock Quantity</label>
                  <input type="number" name="stockQty" min={0} defaultValue={10} placeholder="e.g. 10" />
                </div>
              </div>

              <div className="form-switch-row" style={{ marginTop: "16px" }}>
                <input type="checkbox" name="inStock" value="true" defaultChecked className="switch-input" id="newInStock" />
                <label htmlFor="newInStock" style={{ cursor: "pointer", fontSize: "14px", color: "#fff" }}>In Stock</label>
              </div>

              <button type="submit" className="btn-action-primary" style={{ width: "100%", marginTop: "24px", height: "44px" }} disabled={isUpdating}>
                {isUpdating ? "Adding..." : "Publish Product"}
              </button>
            </Form>
          </div>
        </div>
      )}

      {/* VIEW: BRANDS */}
      {currentView === "brands" && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff" }}>Brands</h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Manage your store's brands and product manufacturers.</p>
          </div>

          <div className="directory-layout">
            <div className="directory-form-card">
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", marginBottom: "16px" }}>Add New Brand</h3>
              <Form method="post" onSubmit={() => {
                setTimeout(() => {
                  setNewBrandName("");
                  setNewBrandDesc("");
                  setNewBrandSlug("");
                }, 100);
              }}>
                <input type="hidden" name="intent" value="add_brand" />
                <div className="form-group-admin">
                  <label>Name</label>
                  <input type="text" name="name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} required placeholder="e.g. LG Electronics" />
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>How it appears on your site.</span>
                </div>
                <div className="form-group-admin">
                  <label>Slug</label>
                  <input type="text" name="slug" value={newBrandSlug} onChange={(e) => setNewBrandSlug(e.target.value)} placeholder="e.g. lg-electronics (optional)" />
                </div>
                <div className="form-group-admin">
                  <label>Description</label>
                  <textarea name="description" rows={4} value={newBrandDesc} onChange={(e) => setNewBrandDesc(e.target.value)} placeholder="Brand description..."></textarea>
                </div>
                <button type="submit" className="btn-action-primary" style={{ width: "100%", height: "36px" }}>Add New Brand</button>
              </Form>
            </div>

            <div className="directory-table-card">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}><input type="checkbox" /></th>
                      <th style={{ width: "60px" }}>Image</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBrands.map((brand: any) => (
                      <tr key={brand.slug}>
                        <td><input type="checkbox" /></td>
                        <td>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "6px",
                            background: "linear-gradient(135deg, rgba(0, 204, 255, 0.2), rgba(0, 100, 255, 0.2))",
                            border: "1px solid rgba(0, 204, 255, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "#00ccff",
                            fontSize: "12px",
                            textTransform: "uppercase"
                          }}>
                            {brand.name.substring(0, 2)}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "600", color: "#fff", fontSize: "14px" }}>{brand.name}</div>
                          <div className="row-actions">
                            <span onClick={() => setEditingTaxonomy({ type: 'brand', item: brand })} style={{ color: "#00ccff", cursor: "pointer" }}>Edit</span>
                            <span className="row-actions-separator">|</span>
                            <span onClick={() => setEditingTaxonomy({ type: 'brand', item: brand })} style={{ color: "#00ccff", cursor: "pointer" }}>Quick Edit</span>
                            <span className="row-actions-separator">|</span>
                            <Form method="post" style={{ display: "inline" }}>
                              <input type="hidden" name="intent" value="delete_brand" />
                              <input type="hidden" name="slug" value={brand.slug} />
                              <button type="submit" style={{ background: "none", border: "none", color: "#ff4d62", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }} onClick={(e) => { if(!confirm(`Are you sure you want to delete the brand "${brand.name}"?`)) e.preventDefault(); }}>Delete</button>
                            </Form>
                            <span className="row-actions-separator">|</span>
                            <a href={`/brand/${brand.slug}`} target="_blank" rel="noreferrer" style={{ color: "#00ccff", textDecoration: "none" }}>View</a>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{brand.slug}</td>
                        <td style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>{brand.desc || "—"}</td>
                        <td style={{ textAlign: "right", fontWeight: "600", color: "#00ccff" }}>{brand.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CATEGORIES */}
      {currentView === "categories" && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff" }}>Categories</h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Manage product categories to group similar items.</p>
          </div>

          <div className="directory-layout">
            <div className="directory-form-card">
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", marginBottom: "16px" }}>Add New Category</h3>
              <Form method="post" onSubmit={() => {
                setTimeout(() => {
                  setNewCatName("");
                  setNewCatDesc("");
                  setNewCatSlug("");
                }, 100);
              }}>
                <input type="hidden" name="intent" value="add_category" />
                <div className="form-group-admin">
                  <label>Name</label>
                  <input type="text" name="name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required placeholder="e.g. Smart Audio" />
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>How it appears on your site.</span>
                </div>
                <div className="form-group-admin">
                  <label>Slug</label>
                  <input type="text" name="slug" value={newCatSlug} onChange={(e) => setNewCatSlug(e.target.value)} placeholder="e.g. smart-audio (optional)" />
                </div>
                <div className="form-group-admin">
                  <label>Description</label>
                  <textarea name="description" rows={4} value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} placeholder="Category description..."></textarea>
                </div>
                <button type="submit" className="btn-action-primary" style={{ width: "100%", height: "36px" }}>Add New Category</button>
              </Form>
            </div>

            <div className="directory-table-card">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}><input type="checkbox" /></th>
                      <th style={{ width: "60px" }}>Image</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCategories.map((cat: any) => (
                      <tr key={cat.slug}>
                        <td><input type="checkbox" /></td>
                        <td>
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                          ) : (
                            <div style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "6px",
                              background: "linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(46, 180, 100, 0.2))",
                              border: "1px solid rgba(46, 213, 115, 0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              color: "#2ed573",
                              fontSize: "12px",
                              textTransform: "uppercase"
                            }}>
                              {cat.name.substring(0, 2)}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: "600", color: "#fff", fontSize: "14px" }}>{cat.name}</div>
                          <div className="row-actions">
                            <span onClick={() => setEditingTaxonomy({ type: 'category', item: cat })} style={{ color: "#00ccff", cursor: "pointer" }}>Edit</span>
                            <span className="row-actions-separator">|</span>
                            <span onClick={() => setEditingTaxonomy({ type: 'category', item: cat })} style={{ color: "#00ccff", cursor: "pointer" }}>Quick Edit</span>
                            <span className="row-actions-separator">|</span>
                            <Form method="post" style={{ display: "inline" }}>
                              <input type="hidden" name="intent" value="delete_category" />
                              <input type="hidden" name="slug" value={cat.slug} />
                              <button type="submit" style={{ background: "none", border: "none", color: "#ff4d62", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }} onClick={(e) => { if(!confirm(`Are you sure you want to delete the category "${cat.name}"?`)) e.preventDefault(); }}>Delete</button>
                            </Form>
                            <span className="row-actions-separator">|</span>
                            <a href={`/category/${cat.slug}`} target="_blank" rel="noreferrer" style={{ color: "#00ccff", textDecoration: "none" }}>View</a>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{cat.slug}</td>
                        <td style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>{cat.description || "—"}</td>
                        <td style={{ textAlign: "right", fontWeight: "600", color: "#00ccff" }}>{cat.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TAGS */}
      {currentView === "tags" && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff" }}>Tags</h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Add keywords to products to make searching faster.</p>
          </div>

          <div className="directory-layout">
            <div className="directory-form-card">
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", marginBottom: "16px" }}>Add New Tag</h3>
              <Form method="post" onSubmit={() => {
                setTimeout(() => {
                  setNewTagName("");
                  setNewTagDesc("");
                  setNewTagSlug("");
                }, 100);
              }}>
                <input type="hidden" name="intent" value="add_tag" />
                <div className="form-group-admin">
                  <label>Name</label>
                  <input type="text" name="name" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} required placeholder="e.g. LED Screen" />
                </div>
                <div className="form-group-admin">
                  <label>Slug</label>
                  <input type="text" name="slug" value={newTagSlug} onChange={(e) => setNewTagSlug(e.target.value)} placeholder="e.g. led-screen (optional)" />
                </div>
                <div className="form-group-admin">
                  <label>Description</label>
                  <textarea name="description" rows={4} value={newTagDesc} onChange={(e) => setNewTagDesc(e.target.value)} placeholder="Tag description..."></textarea>
                </div>
                <button type="submit" className="btn-action-primary" style={{ width: "100%", height: "36px" }}>Add New Tag</button>
              </Form>
            </div>

            <div className="directory-table-card">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}><input type="checkbox" /></th>
                      <th style={{ width: "60px" }}>Image</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTags.map((tag: any) => (
                      <tr key={tag.slug}>
                        <td><input type="checkbox" /></td>
                        <td>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "6px",
                            background: "linear-gradient(135deg, rgba(255, 168, 1, 0.2), rgba(255, 120, 0, 0.2))",
                            border: "1px solid rgba(255, 168, 1, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "#ffa801",
                            fontSize: "12px",
                            textTransform: "uppercase"
                          }}>
                            {tag.name.substring(0, 2)}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "600", color: "#fff", fontSize: "14px" }}>{tag.name}</div>
                          <div className="row-actions">
                            <span onClick={() => setEditingTaxonomy({ type: 'tag', item: tag })} style={{ color: "#00ccff", cursor: "pointer" }}>Edit</span>
                            <span className="row-actions-separator">|</span>
                            <span onClick={() => setEditingTaxonomy({ type: 'tag', item: tag })} style={{ color: "#00ccff", cursor: "pointer" }}>Quick Edit</span>
                            <span className="row-actions-separator">|</span>
                            <Form method="post" style={{ display: "inline" }}>
                              <input type="hidden" name="intent" value="delete_tag" />
                              <input type="hidden" name="slug" value={tag.slug} />
                              <button type="submit" style={{ background: "none", border: "none", color: "#ff4d62", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }} onClick={(e) => { if(!confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) e.preventDefault(); }}>Delete</button>
                            </Form>
                            <span className="row-actions-separator">|</span>
                            <a href={`/tag/${tag.slug}`} target="_blank" rel="noreferrer" style={{ color: "#00ccff", textDecoration: "none" }}>View</a>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{tag.slug}</td>
                        <td style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>{tag.desc || "—"}</td>
                        <td style={{ textAlign: "right", fontWeight: "600", color: "#00ccff" }}>{tag.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ATTRIBUTES */}
      {currentView === "attributes" && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff" }}>Attributes</h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Define extra details like screen size or resolution for WooCommerce layout.</p>
          </div>

          <div className="directory-layout">
            <div className="directory-form-card">
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#fff", marginBottom: "16px" }}>Add New Attribute</h3>
              <Form method="post" onSubmit={() => {
                setTimeout(() => {
                  setNewAttrName("");
                  setNewAttrSlug("");
                  setNewAttrTerms("");
                }, 100);
              }}>
                <input type="hidden" name="intent" value="add_attribute" />
                <div className="form-group-admin">
                  <label>Name</label>
                  <input type="text" name="name" value={newAttrName} onChange={(e) => setNewAttrName(e.target.value)} required placeholder="e.g. Processor" />
                </div>
                <div className="form-group-admin">
                  <label>Slug</label>
                  <input type="text" name="slug" value={newAttrSlug} onChange={(e) => setNewAttrSlug(e.target.value)} placeholder="e.g. pa_processor (optional)" />
                </div>
                <div className="form-group-admin">
                  <label>Terms / Values (comma separated)</label>
                  <input type="text" name="terms" value={newAttrTerms} onChange={(e) => setNewAttrTerms(e.target.value)} placeholder="e.g. Quad-Core, Dual-Core" required />
                </div>
                <button type="submit" className="btn-action-primary" style={{ width: "100%", height: "36px" }}>Add New Attribute</button>
              </Form>
            </div>

            <div className="directory-table-card">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}><input type="checkbox" /></th>
                      <th style={{ width: "60px" }}>Image</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Type</th>
                      <th>Terms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttributes.map((attr: any) => (
                      <tr key={attr.slug}>
                        <td><input type="checkbox" /></td>
                        <td>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "6px",
                            background: "linear-gradient(135deg, rgba(165, 94, 234, 0.2), rgba(130, 80, 220, 0.2))",
                            border: "1px solid rgba(165, 94, 234, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "#a55efa",
                            fontSize: "12px",
                            textTransform: "uppercase"
                          }}>
                            {attr.name.substring(0, 2)}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: "600", color: "#fff", fontSize: "14px" }}>{attr.name}</div>
                          <div className="row-actions">
                            <span onClick={() => setEditingTaxonomy({ type: 'attribute', item: attr })} style={{ color: "#00ccff", cursor: "pointer" }}>Edit</span>
                            <span className="row-actions-separator">|</span>
                            <span onClick={() => setEditingTaxonomy({ type: 'attribute', item: attr })} style={{ color: "#00ccff", cursor: "pointer" }}>Quick Edit</span>
                            <span className="row-actions-separator">|</span>
                            <Form method="post" style={{ display: "inline" }}>
                              <input type="hidden" name="intent" value="delete_attribute" />
                              <input type="hidden" name="slug" value={attr.slug} />
                              <button type="submit" style={{ background: "none", border: "none", color: "#ff4d62", cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }} onClick={(e) => { if(!confirm(`Are you sure you want to delete the attribute "${attr.name}"?`)) e.preventDefault(); }}>Delete</button>
                            </Form>
                            <span className="row-actions-separator">|</span>
                            <a href={`/attribute/${attr.slug}`} target="_blank" rel="noreferrer" style={{ color: "#00ccff", textDecoration: "none" }}>View</a>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{attr.slug}</td>
                        <td style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>{attr.type}</td>
                        <td style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{attr.terms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: REVIEWS */}
      {currentView === "reviews" && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff" }}>Customer Reviews</h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Read and manage client review scores and comments.</p>
          </div>

          <div className="directory-table-card" style={{ width: "100%" }}>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Author</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Product</th>
                    <th>Submitted On</th>
                    <th style={{ textAlign: "right" }}>Status / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsList.map((rev: any) => (
                    <tr key={rev.id}>
                      <td>
                        <div style={{ fontWeight: "600", color: "#fff" }}>{rev.author}</div>
                      </td>
                      <td style={{ color: "#ffa801" }}>
                        {"★".repeat(rev.rating)}
                        {"☆".repeat(5 - rev.rating)}
                      </td>
                      <td style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", maxWidth: "300px", whiteSpace: "normal" }}>
                        {rev.content}
                      </td>
                      <td style={{ fontSize: "13px", color: "#00ccff" }}>{rev.product}</td>
                      <td style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{rev.date}</td>
                      <td style={{ textAlign: "right" }}>
                        {rev.approved ? (
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <span className="status-badge completed" style={{ fontSize: "11px", padding: "2px 8px" }}>Approved</span>
                            <button type="button" className="edit-badge-btn" onClick={() => handleDeleteReview(rev.id)} style={{ background: "rgba(255, 77, 98, 0.1)", color: "#ff4d62", borderColor: "rgba(255, 77, 98, 0.3)" }}>
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button type="button" className="edit-badge-btn" onClick={() => handleApproveReview(rev.id)}>
                              Approve
                            </button>
                            <button type="button" className="edit-badge-btn" onClick={() => handleDeleteReview(rev.id)} style={{ background: "rgba(255, 77, 98, 0.1)", color: "#ff4d62", borderColor: "rgba(255, 77, 98, 0.3)" }}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* Quick Edit Modal */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>
                Quick Edit Product
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingProduct(null)}
              >
                &times;
              </button>
            </div>

            <Form method="post" encType="multipart/form-data" replace onSubmit={() => setEditingProduct(null)}>
              <input type="hidden" name="intent" value="quick_edit" />
              <input type="hidden" name="id" value={editingProduct.id} />
              <input type="hidden" name="slug" value={editingProduct.slug} />
              <input
                type="hidden"
                name="currentThumbnail"
                value={editingProduct.thumbnail}
              />

              <div style={{ marginBottom: "20px" }}>
                <label className="admin-label">Product Title</label>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    padding: "8px 0",
                  }}
                >
                  {editingProduct.name}
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="admin-label" htmlFor="regularPrice">
                    Regular Price (KSh)
                  </label>
                  <input
                    className="admin-input"
                    type="number"
                    id="regularPrice"
                    name="regularPrice"
                    defaultValue={editingProduct.regularPrice}
                    required
                  />
                </div>
                <div>
                  <label className="admin-label" htmlFor="salePrice">
                    Sale Price (KSh)
                  </label>
                  <input
                    className="admin-input"
                    type="number"
                    id="salePrice"
                    name="salePrice"
                    defaultValue={editingProduct.salePrice || ""}
                    placeholder="No Sale Price"
                  />
                </div>
              </div>

              <div className="form-switch-row">
                <input
                  type="checkbox"
                  id="inStock"
                  name="inStock"
                  value="true"
                  className="switch-input"
                  defaultChecked={editingProduct.inStock}
                />
                <label
                  className="admin-label"
                  style={{ marginBottom: "0", cursor: "pointer" }}
                  htmlFor="inStock"
                >
                  Product is In-Stock & Purchasable
                </label>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label className="admin-label" htmlFor="status">
                  Product Status
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%", height: "38px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", borderRadius: "6px", padding: "0 10px" }}
                  id="status"
                  name="status"
                  defaultValue={editingProduct.status || "publish"}
                >
                  <option value="publish">Published</option>
                  <option value="draft">Draft</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label className="admin-label" htmlFor="thumbnail">
                  Replace Primary Thumbnail Image
                </label>
                <input
                  className="admin-input"
                  style={{ padding: "8px" }}
                  type="file"
                  id="thumbnail"
                  name="thumbnail"
                  accept="image/*"
                />
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>
                  Selected image will be securely uploaded and overwrite the primary file.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: "20px",
                }}
              >
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Product Details"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {editingTaxonomy && (
        <div className="modal-overlay" onClick={() => setEditingTaxonomy(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>
                Edit {editingTaxonomy.type.charAt(0).toUpperCase() + editingTaxonomy.type.slice(1)}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingTaxonomy(null)}
              >
                &times;
              </button>
            </div>

            <Form method="post" replace onSubmit={() => setEditingTaxonomy(null)}>
              <input type="hidden" name="intent" value={`edit_${editingTaxonomy.type}`} />
              <input type="hidden" name="oldSlug" value={editingTaxonomy.item.slug} />

              <div style={{ marginBottom: "20px" }}>
                <label className="admin-label">Name</label>
                <input
                  className="admin-input"
                  type="text"
                  name="name"
                  defaultValue={editingTaxonomy.item.name}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label className="admin-label">Slug</label>
                <input
                  className="admin-input"
                  type="text"
                  name="slug"
                  defaultValue={editingTaxonomy.item.slug}
                  required
                />
              </div>

              {editingTaxonomy.type !== "attribute" ? (
                <div style={{ marginBottom: "20px" }}>
                  <label className="admin-label">Description</label>
                  <textarea
                    className="admin-input"
                    name="description"
                    rows={4}
                    defaultValue={editingTaxonomy.item.desc || editingTaxonomy.item.description || ""}
                    style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", width: "100%", padding: "10px", borderRadius: "6px", resize: "vertical" }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: "20px" }}>
                  <label className="admin-label">Terms / Values (comma separated)</label>
                  <input
                    className="admin-input"
                    type="text"
                    name="terms"
                    defaultValue={editingTaxonomy.item.terms}
                    required
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: "20px",
                }}
              >
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setEditingTaxonomy(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {showBulkEditModal && (
        <div className="modal-overlay" onClick={() => setShowBulkEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>
                Bulk Edit {selectedProductIds.length} Products
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowBulkEditModal(false)}
              >
                &times;
              </button>
            </div>

            <Form method="post" replace onSubmit={() => { setShowBulkEditModal(false); setSelectedProductIds([]); setBulkAction(""); }}>
              <input type="hidden" name="intent" value="bulk_edit" />
              <input type="hidden" name="ids" value={JSON.stringify(selectedProductIds)} />

              <div style={{ marginBottom: "20px" }}>
                <label className="admin-label">Products being edited:</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px", maxHeight: "100px", overflowY: "auto" }}>
                  {allProducts.filter((p: any) => selectedProductIds.includes(p.id)).map((p: any) => (
                    <span key={p.id} style={{ background: "rgba(0, 204, 255, 0.15)", color: "#00ccff", fontSize: "11px", fontWeight: "600", padding: "4px 8px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {p.name}
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "#ff4d62", cursor: "pointer", padding: 0, fontWeight: "bold" }}
                        onClick={() => setSelectedProductIds(selectedProductIds.filter(id => id !== p.id))}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label className="admin-label">Change Regular Price (KSh)</label>
                  <input
                    className="admin-input"
                    type="number"
                    name="changeRegularPrice"
                    placeholder="No change"
                  />
                </div>
                <div>
                  <label className="admin-label">Change Sale Price (KSh)</label>
                  <input
                    className="admin-input"
                    type="number"
                    name="changeSalePrice"
                    placeholder="No change"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label className="admin-label">Stock Status</label>
                <select className="admin-select" name="bulkInStock" style={{ width: "100%" }}>
                  <option value="no-change">No change</option>
                  <option value="instock">In Stock</option>
                  <option value="outofstock">Out of Stock</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label className="admin-label">Add Categories</label>
                <div style={{ maxHeight: "120px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {allCategories.map((c: any) => (
                    <label key={c.slug} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>
                      <input type="checkbox" name="addCategories" value={c.slug} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label className="admin-label">Add Brands</label>
                <div style={{ maxHeight: "120px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {allBrands.map((b: any) => (
                    <label key={b.slug} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>
                      <input type="checkbox" name="addBrands" value={b.slug} />
                      {b.name}
                    </label>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: "20px",
                }}
              >
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setShowBulkEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action-primary"
                  disabled={isUpdating || selectedProductIds.length === 0}
                >
                  {isUpdating ? "Updating..." : "Bulk Update"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
