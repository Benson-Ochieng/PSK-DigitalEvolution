import { useState, useEffect } from "react";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { db } from "~/lib/db.server";
import type { Coupon } from "~/lib/db.server";
import VisualCodeEditor from "~/components/VisualCodeEditor";

export async function loader() {
  const { getAllProducts, getAllCategories, getAllBrands } = await import("~/lib/content.server");
  const coupons = await db.coupon.findMany();
  const products = getAllProducts(true) || [];
  const categories = getAllCategories(true) || [];
  const brands = getAllBrands(true) || [];
  return { coupons, products, categories, brands };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "create_coupon" || intent === "update_coupon") {
    const code = formData.get("code")?.toString().trim().toUpperCase();
    const discountValue = Number(formData.get("discountValue"));
    const discountType = formData.get("discountType")?.toString() as "percentage" | "fixed";
    const status = formData.get("status")?.toString() || "active";
    const active = status === "active";

    if (!code || isNaN(discountValue) || discountValue <= 0 || !discountType) {
      return { error: "Please enter a valid coupon code and positive discount value." };
    }

    const description = formData.get("description")?.toString() || "";
    const expiryDate = formData.get("expiryDate")?.toString() || "";
    const allowFreeShipping = formData.get("allowFreeShipping") === "true";
    
    const minimumSpend = formData.get("minimumSpend") ? Number(formData.get("minimumSpend")) : undefined;
    const maximumSpend = formData.get("maximumSpend") ? Number(formData.get("maximumSpend")) : undefined;
    const individualUse = formData.get("individualUse") === "true";
    const excludeSaleItems = formData.get("excludeSaleItems") === "true";
    
    const usageLimitPerCoupon = formData.get("usageLimitPerCoupon") ? Number(formData.get("usageLimitPerCoupon")) : undefined;
    const usageLimitPerUser = formData.get("usageLimitPerUser") ? Number(formData.get("usageLimitPerUser")) : undefined;

    const productsStr = formData.get("products")?.toString() || "[]";
    const excludeProductsStr = formData.get("excludeProducts")?.toString() || "[]";
    const productCategoriesStr = formData.get("productCategories")?.toString() || "[]";
    const excludeCategoriesStr = formData.get("excludeCategories")?.toString() || "[]";
    const allowedEmails = formData.get("allowedEmails")?.toString() || "";
    const productBrandsStr = formData.get("productBrands")?.toString() || "[]";
    const excludeBrandsStr = formData.get("excludeBrands")?.toString() || "[]";

    let products: string[] = [];
    let excludeProducts: string[] = [];
    let productCategories: string[] = [];
    let excludeCategories: string[] = [];
    let productBrands: string[] = [];
    let excludeBrands: string[] = [];

    try { products = JSON.parse(productsStr); } catch {}
    try { excludeProducts = JSON.parse(excludeProductsStr); } catch {}
    try { productCategories = JSON.parse(productCategoriesStr); } catch {}
    try { excludeCategories = JSON.parse(excludeCategoriesStr); } catch {}
    try { productBrands = JSON.parse(productBrandsStr); } catch {}
    try { excludeBrands = JSON.parse(excludeBrandsStr); } catch {}
    if (intent === "create_coupon") {
      const existing = await db.coupon.findUnique({ where: { code } });
      if (existing) {
        return { error: `Coupon code '${code}' already exists.` };
      }

      await db.coupon.create({
        code,
        discountValue,
        discountType,
        active,
        status,
        description,
        expiryDate,
        allowFreeShipping,
        minimumSpend,
        maximumSpend,
        individualUse,
        excludeSaleItems,
        usageLimitPerCoupon,
        usageLimitPerUser,
        products,
        excludeProducts,
        productCategories,
        excludeCategories,
        allowedEmails,
        productBrands,
        excludeBrands,
      });
    } else {
      const oldCode = formData.get("oldCode")?.toString().trim().toUpperCase();
      if (oldCode && code !== oldCode) {
        const existing = await db.coupon.findUnique({ where: { code } });
        if (existing) {
          return { error: `Coupon code '${code}' already exists.` };
        }
      }

      await db.coupon.update({
        where: { code: oldCode || code },
        data: {
          code,
          discountValue,
          discountType,
          active,
          status,
          description,
          expiryDate,
          allowFreeShipping,
          minimumSpend,
          maximumSpend,
          individualUse,
          excludeSaleItems,
          usageLimitPerCoupon,
          usageLimitPerUser,
          products,
          excludeProducts,
          productCategories,
          excludeCategories,
          allowedEmails,
          productBrands,
          excludeBrands,
        },
      });
    }

    return { success: true };
  }

  if (intent === "toggle_active") {
    const code = formData.get("code")?.toString();
    if (!code) return null;
    const coupon = await db.coupon.findUnique({ where: { code } });
    if (!coupon) return null;

    const newActive = !coupon.active;
    const newStatus = newActive ? "active" : "inactive";

    await db.coupon.update({
      where: { code },
      data: {
        active: newActive,
        status: newStatus
      },
    });

    return { success: true };
  }

  if (intent === "delete_coupon") {
    const code = formData.get("code")?.toString();
    if (!code) return null;

    await db.coupon.delete({ where: { code } });
    return { success: true };
  }

  return null;
}

// Custom select element that behaves like a Select2 pill selector
function MultiSelect({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  name,
  helpText
}: {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  name: string;
  helpText?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter(
    opt =>
      opt.label.toLowerCase().includes(search.toLowerCase()) &&
      !selectedValues.includes(opt.value)
  );

  return (
    <div className="coupon-field-row" style={{ position: "relative" }}>
      <label>{label}</label>
      <div className="coupon-field-input-wrapper" style={{ position: "relative" }}>
        <input type="hidden" name={name} value={JSON.stringify(selectedValues)} />
        
        <div
          className="admin-input"
          style={{
            minHeight: "36px",
            height: "auto",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            alignItems: "center",
            padding: "4px 8px",
            cursor: "pointer",
            background: "rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px"
          }}
          onClick={() => setIsOpen(true)}
        >
          {selectedValues.map(val => {
            const matched = options.find(o => o.value === val);
            return (
              <span
                key={val}
                style={{
                  background: "rgba(0, 204, 255, 0.12)",
                  color: "#00ccff",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: "500"
                }}
              >
                {matched ? matched.label : val}
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#00ccff",
                    cursor: "pointer",
                    fontSize: "12px",
                    lineHeight: "1",
                    padding: "0 1px"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(selectedValues.filter(v => v !== val));
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
          
          <input
            type="text"
            placeholder={selectedValues.length === 0 ? placeholder : ""}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: "12px",
              flex: "1",
              minWidth: "80px",
              padding: "2px 0"
            }}
          />
        </div>

        {isOpen && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99
              }}
              onClick={() => {
                setIsOpen(false);
                setSearch("");
              }}
            />
            
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#18181c",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                maxHeight: "160px",
                overflowY: "auto",
                zIndex: 100,
                marginTop: "4px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map(opt => (
                  <div
                    key={opt.value}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.8)",
                      borderBottom: "1px solid rgba(255,255,255,0.03)"
                    }}
                    onClick={() => {
                      onChange([...selectedValues, opt.value]);
                      setSearch("");
                      setIsOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0, 204, 255, 0.1)";
                      e.currentTarget.style.color = "#00ccff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                    }}
                  >
                    {opt.label}
                  </div>
                ))
              ) : (
                <div style={{ padding: "6px 10px", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                  No options found
                </div>
              )}
            </div>
          </>
        )}
        {helpText && <div className="coupon-field-description">{helpText}</div>}
      </div>
    </div>
  );
}

export default function VpBackendCoupons() {
  const { coupons, products, categories, brands } = useLoaderData() as any;
  const actionData = useActionData() as { error?: string; success?: boolean } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const productOptions = (products || []).map((p: any) => ({ value: p.slug, label: p.name }));
  const categoryOptions = (categories || []).map((c: any) => ({ value: c.slug, label: c.name }));
  const brandOptions = (brands || []).map((b: any) => ({ value: b.slug, label: b.name }));

  // Tab State for Coupon metabox
  const [activeTab, setActiveTab] = useState<"general" | "restriction" | "limits">("general");

  // Form Field State
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [status, setStatus] = useState("active");
  const [expiryDate, setExpiryDate] = useState("");
  const [allowFreeShipping, setAllowFreeShipping] = useState(false);
  const [minimumSpend, setMinimumSpend] = useState<number | "">("");
  const [maximumSpend, setMaximumSpend] = useState<number | "">("");
  const [individualUse, setIndividualUse] = useState(false);
  const [excludeSaleItems, setExcludeSaleItems] = useState(false);
  const [usageLimitPerCoupon, setUsageLimitPerCoupon] = useState<number | "">("");
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number | "">("");

  // Usage Restriction fields
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedExcludeProducts, setSelectedExcludeProducts] = useState<string[]>([]);
  const [selectedProductCategories, setSelectedProductCategories] = useState<string[]>([]);
  const [selectedExcludeCategories, setSelectedExcludeCategories] = useState<string[]>([]);
  const [allowedEmails, setAllowedEmails] = useState("");
  const [selectedProductBrands, setSelectedProductBrands] = useState<string[]>([]);
  const [selectedExcludeBrands, setSelectedExcludeBrands] = useState<string[]>([]);

  // Handle successful save/edit (reset form state)
  useEffect(() => {
    if (actionData?.success) {
      resetForm();
    }
  }, [actionData]);

  const resetForm = () => {
    setEditingCoupon(null);
    setCode("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue("");
    setStatus("active");
    setExpiryDate("");
    setAllowFreeShipping(false);
    setMinimumSpend("");
    setMaximumSpend("");
    setIndividualUse(false);
    setExcludeSaleItems(false);
    setUsageLimitPerCoupon("");
    setUsageLimitPerUser("");
    setSelectedProducts([]);
    setSelectedExcludeProducts([]);
    setSelectedProductCategories([]);
    setSelectedExcludeCategories([]);
    setAllowedEmails("");
    setSelectedProductBrands([]);
    setSelectedExcludeBrands([]);
    setActiveTab("general");
  };

  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || "");
    setDiscountType(coupon.discountType || "percentage");
    setDiscountValue(coupon.discountValue || "");
    setStatus(coupon.status || (coupon.active ? "active" : "inactive"));
    setExpiryDate(coupon.expiryDate || "");
    setAllowFreeShipping(!!coupon.allowFreeShipping);
    setMinimumSpend(coupon.minimumSpend !== undefined && coupon.minimumSpend !== null ? coupon.minimumSpend : "");
    setMaximumSpend(coupon.maximumSpend !== undefined && coupon.maximumSpend !== null ? coupon.maximumSpend : "");
    setIndividualUse(!!coupon.individualUse);
    setExcludeSaleItems(!!coupon.excludeSaleItems);
    setUsageLimitPerCoupon(coupon.usageLimitPerCoupon !== undefined && coupon.usageLimitPerCoupon !== null ? coupon.usageLimitPerCoupon : "");
    setUsageLimitPerUser(coupon.usageLimitPerUser !== undefined && coupon.usageLimitPerUser !== null ? coupon.usageLimitPerUser : "");
    setSelectedProducts(coupon.products || []);
    setSelectedExcludeProducts(coupon.excludeProducts || []);
    setSelectedProductCategories(coupon.productCategories || []);
    setSelectedExcludeCategories(coupon.excludeCategories || []);
    setAllowedEmails(coupon.allowedEmails || "");
    setSelectedProductBrands(coupon.productBrands || []);
    setSelectedExcludeBrands(coupon.excludeBrands || []);
    setActiveTab("general");
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "VP-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  // Sorting states
  const [sortKey, setSortKey] = useState<"code" | "value" | "date" | "status" | "expiry">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (key: "code" | "value" | "date" | "status" | "expiry") => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "date" || key === "value" || key === "expiry" ? "desc" : "asc");
    }
  };

  const renderSortIndicator = (key: "code" | "value" | "date" | "status" | "expiry") => {
    if (sortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{sortDirection === "asc" ? "▲" : "▼"}</span>;
  };

  const sortedCoupons = [...coupons].sort((a: Coupon, b: Coupon) => {
    let result = 0;
    if (sortKey === "code") {
      result = (a.code || "").localeCompare(b.code || "");
    } else if (sortKey === "value") {
      result = (a.discountValue || 0) - (b.discountValue || 0);
    } else if (sortKey === "date") {
      result = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    } else if (sortKey === "status") {
      result = (a.active ? 1 : 0) - (b.active ? 1 : 0);
    } else if (sortKey === "expiry") {
      result = (a.expiryDate || "").localeCompare(b.expiryDate || "");
    }
    return sortDirection === "asc" ? result : -result;
  });

  const formatDiscount = (c: Coupon) => {
    if (c.discountType === "percentage") {
      return `${c.discountValue}% Off`;
    }
    return `KSh ${c.discountValue.toLocaleString("en-KE")} Off`;
  };

  return (
    <div className="coupons-view">
      <style dangerouslySetInnerHTML={{ __html: `
        .coupon-console-grid {
          display: grid;
          grid-template-columns: 1.2fr 1.8fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1100px) {
          .coupon-console-grid {
            grid-template-columns: 1fr;
          }
        }

        .coupon-form-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .coupons-list-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .coupon-code-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          color: #fff;
          font-family: monospace;
          font-size: 14px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        .btn-toggle-coupon {
          background: transparent;
          border: 1px solid;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-toggle-coupon.deactivate {
          border-color: rgba(255, 77, 98, 0.3);
          color: #ff4d62;
        }

        .btn-toggle-coupon.deactivate:hover {
          background: rgba(255, 77, 98, 0.1);
        }

        .btn-toggle-coupon.activate {
          border-color: rgba(46, 213, 115, 0.3);
          color: #2ed573;
        }

        .btn-toggle-coupon.activate:hover {
          background: rgba(46, 213, 115, 0.1);
        }

        .btn-toggle-coupon.edit {
          border-color: rgba(0, 204, 255, 0.3);
          color: #00ccff;
        }

        .btn-toggle-coupon.edit:hover {
          background: rgba(0, 204, 255, 0.1);
        }

        .btn-delete-coupon {
          background: rgba(255, 77, 98, 0.05);
          border: 1px solid rgba(255, 77, 98, 0.2);
          color: #ff4d62;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-delete-coupon:hover {
          background: #ff4d62;
          color: #fff;
        }

        .status-badge.draft {
          background: rgba(255, 170, 0, 0.1) !important;
          color: #ffaa00 !important;
          border-color: rgba(255, 170, 0, 0.2) !important;
        }

        /* Coupon Data Metabox (WooCommerce Style) */
        .coupon-data-box {
          display: flex;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.15);
          overflow: hidden;
          margin-top: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 600px) {
          .coupon-data-box {
            flex-direction: column;
          }
        }

        .coupon-tabs-sidebar {
          width: 170px;
          background: rgba(255, 255, 255, 0.01);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        @media (max-width: 600px) {
          .coupon-tabs-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            flex-direction: row;
            overflow-x: auto;
          }
        }

        .coupon-tab-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 12px 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 3px solid transparent;
        }

        .coupon-tab-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
        }

        .coupon-tab-btn.active {
          background: rgba(255, 255, 255, 0.05);
          color: #00ccff;
          border-left-color: #00ccff;
        }

        @media (max-width: 600px) {
          .coupon-tab-btn {
            border-left: none;
            border-bottom: 3px solid transparent;
            padding: 10px 14px;
            white-space: nowrap;
          }
          .coupon-tab-btn.active {
            border-bottom-color: #00ccff;
          }
        }

        .coupon-tab-content {
          flex: 1;
          padding: 20px;
        }

        .coupon-field-row {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .coupon-field-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }

        .coupon-field-row label {
          width: 150px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .coupon-field-row label {
            width: 100%;
          }
        }

        .coupon-field-input-wrapper {
          flex: 1;
          width: 100%;
        }

        .coupon-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8) !important;
          cursor: pointer;
          user-select: none;
          width: auto !important;
        }

        .coupon-field-description {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 4px;
          line-height: 1.3;
        }
      ` }} />

      {actionData?.error && (
        <div
          style={{
            background: "rgba(255,77,98,0.15)",
            border: "1px solid rgba(255,77,98,0.3)",
            color: "#ff4d62",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          {actionData.error}
        </div>
      )}

      <div className="coupon-console-grid">
        {/* Left: WooCommerce Style Creator / Editor Form */}
        <div className="coupon-form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
              {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Add New Coupon"}
            </h3>
            {editingCoupon && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#aaa",
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <Form method="post">
            <input type="hidden" name="intent" value={editingCoupon ? "update_coupon" : "create_coupon"} />
            {editingCoupon && <input type="hidden" name="oldCode" value={editingCoupon.code} />}

            {/* Coupon Code Input & Generator */}
            <div style={{ marginBottom: "16px" }}>
              <label className="admin-label" htmlFor="code">
                Coupon Code
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  className="admin-input"
                  style={{ textTransform: "uppercase" }}
                  type="text"
                  id="code"
                  name="code"
                  placeholder="e.g. FLASH25"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                {!editingCoupon && (
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    style={{
                      background: "rgba(0, 204, 255, 0.1)",
                      border: "1px solid rgba(0, 204, 255, 0.2)",
                      color: "#00ccff",
                      padding: "0 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Generate code
                  </button>
                )}
              </div>
            </div>

            {/* Description Field */}
            <div style={{ marginBottom: "20px" }}>
              <label className="admin-label" htmlFor="description">
                Description (optional)
              </label>
              <VisualCodeEditor
                name="description"
                value={description}
                onChange={setDescription}
                placeholder="Describe this promotion coupon (supports HTML)..."
                rows={4}
              />
            </div>

            {/* Coupon Data Metabox Panel (WooCommerce tabs menu style) */}
            <h4 style={{ fontSize: "12px", fontWeight: "600", color: "#fff", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Coupon data
            </h4>
            <div className="coupon-data-box">
              {/* Tab selector buttons */}
              <div className="coupon-tabs-sidebar">
                <button
                  type="button"
                  className={`coupon-tab-btn ${activeTab === "general" ? "active" : ""}`}
                  onClick={() => setActiveTab("general")}
                >
                  ⚙️ General
                </button>
                <button
                  type="button"
                  className={`coupon-tab-btn ${activeTab === "restriction" ? "active" : ""}`}
                  onClick={() => setActiveTab("restriction")}
                >
                  🚫 Usage restriction
                </button>
                <button
                  type="button"
                  className={`coupon-tab-btn ${activeTab === "limits" ? "active" : ""}`}
                  onClick={() => setActiveTab("limits")}
                >
                  📊 Usage limits
                </button>
              </div>

              {/* Tab content panels */}
              <div className="coupon-tab-content">
                <div style={{ display: activeTab === "general" ? "block" : "none" }}>
                  {/* Discount Type */}
                  <div className="coupon-field-row">
                    <label htmlFor="discountType">Discount type</label>
                    <div className="coupon-field-input-wrapper">
                      <select
                        className="admin-select"
                        id="discountType"
                        name="discountType"
                        required
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                      >
                        <option value="percentage">Percentage discount (%)</option>
                        <option value="fixed">Fixed cart discount (KSh)</option>
                      </select>
                    </div>
                  </div>

                  {/* Discount Value */}
                  <div className="coupon-field-row">
                    <label htmlFor="discountValue">Coupon amount</label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        className="admin-input"
                        type="number"
                        id="discountValue"
                        name="discountValue"
                        placeholder="e.g. 10 or 500"
                        min="1"
                        required
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
                      />
                    </div>
                  </div>

                  {/* Allow Free Shipping Checkbox */}
                  <div className="coupon-field-row">
                    <label></label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        type="hidden"
                        name="allowFreeShipping"
                        value={allowFreeShipping ? "true" : "false"}
                      />
                      <label className="coupon-checkbox-label">
                        <input
                          type="checkbox"
                          style={{ accentColor: "#00ccff" }}
                          checked={allowFreeShipping}
                          onChange={(e) => setAllowFreeShipping(e.target.checked)}
                        />
                        Allow free shipping
                      </label>
                      <div className="coupon-field-description">
                        Check this box if the coupon grants free shipping. A free shipping option will be applied automatically at checkout.
                      </div>
                    </div>
                  </div>

                  {/* Expiry Date (Calendar Picker) */}
                  <div className="coupon-field-row" style={{ marginBottom: "0" }}>
                    <label htmlFor="expiryDate">Coupon expiry date</label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        className="admin-input"
                        type="date"
                        id="expiryDate"
                        name="expiryDate"
                        style={{ colorScheme: "dark" }}
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                      <div className="coupon-field-description">
                        The coupon will expire on the specified date at 00:00 (UTC). Leaves empty for unlimited use.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: activeTab === "restriction" ? "block" : "none" }}>
                  {/* Minimum Spend */}
                  <div className="coupon-field-row">
                    <label htmlFor="minimumSpend">Minimum spend</label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        className="admin-input"
                        type="number"
                        id="minimumSpend"
                        name="minimumSpend"
                        placeholder="No minimum"
                        value={minimumSpend}
                        onChange={(e) => setMinimumSpend(e.target.value ? Number(e.target.value) : "")}
                      />
                      <div className="coupon-field-description">
                        This field allows you to set the minimum subtotal allowed to use the coupon.
                      </div>
                    </div>
                  </div>

                  {/* Maximum Spend */}
                  <div className="coupon-field-row">
                    <label htmlFor="maximumSpend">Maximum spend</label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        className="admin-input"
                        type="number"
                        id="maximumSpend"
                        name="maximumSpend"
                        placeholder="No maximum"
                        value={maximumSpend}
                        onChange={(e) => setMaximumSpend(e.target.value ? Number(e.target.value) : "")}
                      />
                      <div className="coupon-field-description">
                        This field allows you to set the maximum subtotal allowed to use the coupon.
                      </div>
                    </div>
                  </div>

                  {/* Individual Use */}
                  <div className="coupon-field-row">
                    <label></label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        type="hidden"
                        name="individualUse"
                        value={individualUse ? "true" : "false"}
                      />
                      <label className="coupon-checkbox-label">
                        <input
                          type="checkbox"
                          style={{ accentColor: "#00ccff" }}
                          checked={individualUse}
                          onChange={(e) => setIndividualUse(e.target.checked)}
                        />
                        Individual use only
                      </label>
                      <div className="coupon-field-description">
                        Check this box if the coupon cannot be used in conjunction with other coupons.
                      </div>
                    </div>
                  </div>

                  {/* Exclude Sale Items */}
                  <div className="coupon-field-row">
                    <label></label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        type="hidden"
                        name="excludeSaleItems"
                        value={excludeSaleItems ? "true" : "false"}
                      />
                      <label className="coupon-checkbox-label">
                        <input
                          type="checkbox"
                          style={{ accentColor: "#00ccff" }}
                          checked={excludeSaleItems}
                          onChange={(e) => setExcludeSaleItems(e.target.checked)}
                        />
                        Exclude sale items
                      </label>
                      <div className="coupon-field-description">
                        Check this box if the coupon should not apply to items on sale.
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <MultiSelect
                    label="Products"
                    placeholder="Search for a product..."
                    options={productOptions}
                    selectedValues={selectedProducts}
                    onChange={setSelectedProducts}
                    name="products"
                    helpText="Products that the coupon will be applied to, or that need to be in the cart for the coupon to be applied."
                  />

                  {/* Exclude Products */}
                  <MultiSelect
                    label="Exclude products"
                    placeholder="Search for a product..."
                    options={productOptions}
                    selectedValues={selectedExcludeProducts}
                    onChange={setSelectedExcludeProducts}
                    name="excludeProducts"
                    helpText="Products that the coupon will not be applied to, or that cannot be in the cart for the coupon to be applied."
                  />

                  {/* Product Categories */}
                  <MultiSelect
                    label="Product categories"
                    placeholder="Any category"
                    options={categoryOptions}
                    selectedValues={selectedProductCategories}
                    onChange={setSelectedProductCategories}
                    name="productCategories"
                    helpText="Product categories that the coupon will be applied to, or that need to be in the cart for the coupon to be applied."
                  />

                  {/* Exclude Categories */}
                  <MultiSelect
                    label="Exclude categories"
                    placeholder="No categories"
                    options={categoryOptions}
                    selectedValues={selectedExcludeCategories}
                    onChange={setSelectedExcludeCategories}
                    name="excludeCategories"
                    helpText="Product categories that the coupon will not be applied to, or that cannot be in the cart for the coupon to be applied."
                  />

                  {/* Allowed Emails */}
                  <div className="coupon-field-row">
                    <label htmlFor="allowedEmails">Allowed emails</label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        className="admin-input"
                        type="text"
                        id="allowedEmails"
                        name="allowedEmails"
                        placeholder="No restrictions"
                        value={allowedEmails}
                        onChange={(e) => setAllowedEmails(e.target.value)}
                      />
                      <div className="coupon-field-description">
                        Comma-separated list of email addresses to check against the customer's billing email. Use wildcards like *@gmail.com to match domain names.
                      </div>
                    </div>
                  </div>

                  {/* Product Brands */}
                  <MultiSelect
                    label="Product brands"
                    placeholder="Any brand"
                    options={brandOptions}
                    selectedValues={selectedProductBrands}
                    onChange={setSelectedProductBrands}
                    name="productBrands"
                    helpText="Product brands that the coupon will be applied to, or that need to be in the cart for the coupon to be applied."
                  />

                  {/* Exclude Brands */}
                  <MultiSelect
                    label="Exclude brands"
                    placeholder="No brands"
                    options={brandOptions}
                    selectedValues={selectedExcludeBrands}
                    onChange={setSelectedExcludeBrands}
                    name="excludeBrands"
                    helpText="Product brands that the coupon will not be applied to, or that cannot be in the cart for the coupon to be applied."
                  />
                </div>

                <div style={{ display: activeTab === "limits" ? "block" : "none" }}>
                  {/* Usage Limit Per Coupon */}
                  <div className="coupon-field-row">
                    <label htmlFor="usageLimitPerCoupon">Usage limit per coupon</label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        className="admin-input"
                        type="number"
                        id="usageLimitPerCoupon"
                        name="usageLimitPerCoupon"
                        placeholder="Unlimited usage"
                        value={usageLimitPerCoupon}
                        onChange={(e) => setUsageLimitPerCoupon(e.target.value ? Number(e.target.value) : "")}
                      />
                      <div className="coupon-field-description">
                        How many times this coupon can be used by all users before voiding.
                      </div>
                    </div>
                  </div>

                  {/* Usage Limit Per User */}
                  <div className="coupon-field-row" style={{ marginBottom: "0" }}>
                    <label htmlFor="usageLimitPerUser">Usage limit per user</label>
                    <div className="coupon-field-input-wrapper">
                      <input
                        className="admin-input"
                        type="number"
                        id="usageLimitPerUser"
                        name="usageLimitPerUser"
                        placeholder="Unlimited usage"
                        value={usageLimitPerUser}
                        onChange={(e) => setUsageLimitPerUser(e.target.value ? Number(e.target.value) : "")}
                      />
                      <div className="coupon-field-description">
                        How many times this coupon can be used by an individual user.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Submit */}
            <div style={{ marginBottom: "24px" }}>
              <label className="admin-label" htmlFor="status">
                Coupon Status
              </label>
              <select
                className="admin-select"
                id="status"
                name="status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active (Published)</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <button
              className="btn-action-primary"
              style={{ width: "100%" }}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : (editingCoupon ? "Update Coupon" : "Create Coupon")}
            </button>
          </Form>
        </div>

        {/* Right: List Table */}
        <div className="coupons-list-card">
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#fff", marginBottom: "20px" }}>
            Configured Discount Coupons
          </h3>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("code")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Promo Code {renderSortIndicator("code")}
                  </th>
                  <th onClick={() => handleSort("value")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Value {renderSortIndicator("value")}
                  </th>
                  <th onClick={() => handleSort("expiry")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Expiry Date {renderSortIndicator("expiry")}
                  </th>
                  <th onClick={() => handleSort("status")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Status {renderSortIndicator("status")}
                  </th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCoupons.map((coupon: Coupon) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isExpired = coupon.expiryDate ? today > coupon.expiryDate : false;

                  return (
                    <tr key={coupon.code}>
                      <td>
                        <span className="coupon-code-badge">{coupon.code}</span>
                        {coupon.description && (
                          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "4px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={coupon.description}>
                            {coupon.description}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: "600", color: "#00ccff" }}>
                        <div>{formatDiscount(coupon)}</div>
                        {coupon.allowFreeShipping && (
                          <span style={{ fontSize: "10px", color: "#2ed573", background: "rgba(46, 213, 115, 0.1)", padding: "1px 4px", borderRadius: "3px", display: "inline-block", marginTop: "2px" }}>
                            + Free Shipping
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: "12px", color: isExpired ? "#ff4d62" : "rgba(255,255,255,0.7)" }}>
                        {coupon.expiryDate ? (
                          <span>
                            {coupon.expiryDate}
                            {isExpired && (
                              <span style={{ marginLeft: "6px", fontSize: "9px", background: "rgba(255, 77, 98, 0.15)", color: "#ff4d62", padding: "1px 3px", borderRadius: "3px", fontWeight: "bold" }}>
                                Expired
                              </span>
                            )}
                          </span>
                        ) : (
                          <span style={{ opacity: 0.35 }}>No expiry</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${coupon.status === "draft" ? "draft" : (coupon.active ? "completed" : "failed")}`}>
                          {coupon.status === "draft" ? "Draft" : (coupon.active ? "Active" : "Inactive")}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleEditClick(coupon)}
                            className="btn-toggle-coupon edit"
                          >
                            Edit
                          </button>

                          <Form method="post">
                            <input type="hidden" name="intent" value="toggle_active" />
                            <input type="hidden" name="code" value={coupon.code} />
                            <button
                              type="submit"
                              className={`btn-toggle-coupon ${coupon.active ? "deactivate" : "activate"}`}
                            >
                              {coupon.active ? "Deactivate" : "Activate"}
                            </button>
                          </Form>

                          <Form
                            method="post"
                            onSubmit={(e) => {
                              if (!confirm(`Confirm deletion of coupon ${coupon.code}? This cannot be undone.`)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="intent" value="delete_coupon" />
                            <input type="hidden" name="code" value={coupon.code} />
                            <button type="submit" className="btn-delete-coupon">
                              Delete
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

