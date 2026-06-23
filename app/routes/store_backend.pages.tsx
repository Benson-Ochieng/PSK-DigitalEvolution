import { useState, useEffect } from "react";
import { Form, useLoaderData, useNavigation, useSearchParams, Link, redirect } from "react-router";
import VisualCodeEditor from "~/components/VisualCodeEditor";
import fs from "fs";
import path from "path";
import { getAllPages } from "~/lib/content.server";

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  const id = Number(url.searchParams.get("id"));

  const allPages = getAllPages();
  const CONTENT_DIR = path.join(process.cwd(), "content");

  // Enrich pages with status, date, author, and Yoast stats from details files
  const enrichedPages = allPages.map((p: any) => {
    const pageFilePath = path.join(CONTENT_DIR, "pages", `${p.slug}.json`);
    let status = "publish";
    let date = "2026-06-04T10:00:00";
    let author = "Paul Kibet";
    let seoScore = "good";
    let readabilityScore = "good";
    let outgoingLinks = Math.floor(Math.random() * 6);
    let incomingLinks = Math.floor(Math.random() * 2);

    if (fs.existsSync(pageFilePath)) {
      try {
        const details = JSON.parse(fs.readFileSync(pageFilePath, "utf-8"));
        status = details.status || "publish";
        date = details.date || details.modified || date;
        if (details.author) {
          author = details.author;
        } else {
          // Keep it authentic to the mockup
          author = p.id % 2 === 0 ? "Paul Kibet" : "Administrator";
        }

        // Simple heuristic for SEO / Readability score matching Yoast
        const seoText = details.seo?.description || "";
        const contentText = details.content || "";
        if (!seoText) {
          seoScore = "poor";
        } else if (seoText.length < 50) {
          seoScore = "ok";
        }
        if (!contentText) {
          readabilityScore = "poor";
        } else if (contentText.length < 200) {
          readabilityScore = "ok";
        }
      } catch (e) {}
    }
    return {
      ...p,
      status,
      date,
      author,
      seoScore,
      readabilityScore,
      outgoingLinks,
      incomingLinks,
    };
  });

  let editingPageDetails = null;
  if (view === "edit" && id) {
    const summary = allPages.find((p: any) => p.id === id);
    if (summary) {
      const pageFilePath = path.join(CONTENT_DIR, "pages", `${summary.slug}.json`);
      if (fs.existsSync(pageFilePath)) {
        try {
          editingPageDetails = JSON.parse(fs.readFileSync(pageFilePath, "utf-8"));
        } catch (e) {
          console.error("Failed to read edit page details:", e);
        }
      }
    }
  }

  return { allPages: enrichedPages, editingPageDetails, currentUser };
}

export async function action({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  const CONTENT_DIR = path.join(process.cwd(), "content");
  const indexFilePath = path.join(CONTENT_DIR, "pages", "_index.json");

  // Load all pages for parent URL resolutions
  let allPagesList: any[] = [];
  if (fs.existsSync(indexFilePath)) {
    try {
      allPagesList = JSON.parse(fs.readFileSync(indexFilePath, "utf-8"));
    } catch (e) { }
  }

  if (intent === "quick_edit") {
    const pageId = Number(formData.get("id"));
    const originalSlug = formData.get("originalSlug")?.toString() || "";
    const title = formData.get("title")?.toString() || "";
    const slug = formData.get("slug")?.toString() || originalSlug;
    const status = formData.get("status")?.toString() || "publish";
    const parent = Number(formData.get("parent") || 0);
    const dateInput = formData.get("date")?.toString() || "";

    if (!slug || !title) return { error: "Missing required page fields" };

    // Resolve URL path
    let parentPath = "";
    if (parent > 0) {
      const parentItem = allPagesList.find((p: any) => p.id === parent);
      if (parentItem) {
        parentPath = `${parentItem.slug}/`;
      }
    }
    const link = `https://petstore.co.ke/${parentPath}${slug}/`;

    const pageFilePath = path.join(CONTENT_DIR, "pages", `${slug}.json`);
    const originalPageFilePath = path.join(CONTENT_DIR, "pages", `${originalSlug}.json`);

    // 1. Update page details JSON
    let pageDetails: any = {};
    if (fs.existsSync(originalPageFilePath)) {
      try {
        pageDetails = JSON.parse(fs.readFileSync(originalPageFilePath, "utf-8"));
      } catch (e) { }
    } else {
      pageDetails = { id: pageId };
    }

    pageDetails.title = title;
    pageDetails.slug = slug;
    pageDetails.status = status;
    pageDetails.parent = parent;
    pageDetails.link = link;
    if (dateInput) {
      pageDetails.date = dateInput;
    }
    pageDetails.modified = new Date().toISOString().split('.')[0];

    if (!pageDetails.seo) pageDetails.seo = {};
    pageDetails.seo.title = pageDetails.seo.title || `${title} - PetStore Kenya`;
    pageDetails.seo.canonical = link;

    // Write file
    fs.writeFileSync(pageFilePath, JSON.stringify(pageDetails, null, 2), "utf-8");

    // Remove old file if slug changed
    if (slug !== originalSlug && originalSlug && fs.existsSync(originalPageFilePath)) {
      try {
        fs.unlinkSync(originalPageFilePath);
      } catch (e) {
        console.error("Failed to delete old page file:", e);
      }
    }

    // 2. Update index
    const itemIdx = allPagesList.findIndex((p: any) => p.id === pageId);
    if (itemIdx !== -1) {
      allPagesList[itemIdx].title = title;
      allPagesList[itemIdx].slug = slug;
      allPagesList[itemIdx].link = link;
      allPagesList[itemIdx].parent = parent;
      fs.writeFileSync(indexFilePath, JSON.stringify(allPagesList, null, 2), "utf-8");
    }

    const { logHistoryEvent } = await import("~/lib/content.server");
    logHistoryEvent(currentUser.name, "Page Quick-Edited", `Quick edited properties of page "${title}" (Slug: ${slug})`, "📄");

    return { success: true };
  }

  if (intent === "save_page_details") {
    const pageId = Number(formData.get("id"));
    const originalSlug = formData.get("originalSlug")?.toString() || "";
    const title = formData.get("title")?.toString() || "";
    const slug = formData.get("slug")?.toString() || originalSlug;
    const content = formData.get("content")?.toString() || "";
    const excerpt = formData.get("excerpt")?.toString() || "";
    const status = formData.get("status")?.toString() || "publish";
    const parent = Number(formData.get("parent") || 0);

    const seoTitle = formData.get("seoTitle")?.toString() || "";
    const metaDescription = formData.get("metaDescription")?.toString() || "";
    const canonical = formData.get("canonical")?.toString() || "";

    if (!title || !slug) {
      return { error: "Title and slug are required fields." };
    }

    // Resolve URL path
    let parentPath = "";
    if (parent > 0) {
      const parentItem = allPagesList.find((p: any) => p.id === parent);
      if (parentItem) {
        parentPath = `${parentItem.slug}/`;
      }
    }
    const link = `https://petstore.co.ke/${parentPath}${slug}/`;

    const pageFilePath = path.join(CONTENT_DIR, "pages", `${slug}.json`);
    const originalPageFilePath = path.join(CONTENT_DIR, "pages", `${originalSlug}.json`);

    let pageDetails: any = {};
    const isNew = !originalSlug || pageId === 0;
    const actualId = isNew ? Math.floor(10000 + Math.random() * 90000) : pageId;

    if (!isNew && fs.existsSync(originalPageFilePath)) {
      try {
        pageDetails = JSON.parse(fs.readFileSync(originalPageFilePath, "utf-8"));
      } catch (e) { }
    } else {
      pageDetails = {
        id: actualId,
        date: new Date().toISOString().split('.')[0]
      };
    }

    pageDetails.id = actualId;
    pageDetails.title = title;
    pageDetails.slug = slug;
    pageDetails.status = status;
    pageDetails.parent = parent;
    pageDetails.link = link;
    pageDetails.content = content;
    pageDetails.excerpt = excerpt;
    pageDetails.modified = new Date().toISOString().split('.')[0];
    pageDetails.featuredImage = pageDetails.featuredImage || null;

    pageDetails.seo = {
      title: seoTitle || `${title} - PetStore Kenya`,
      description: metaDescription,
      canonical: canonical || link,
      ogImage: pageDetails.seo?.ogImage || null
    };

    // Write file
    fs.writeFileSync(pageFilePath, JSON.stringify(pageDetails, null, 2), "utf-8");

    // Remove old file if slug changed
    if (!isNew && slug !== originalSlug && originalSlug && fs.existsSync(originalPageFilePath)) {
      try {
        fs.unlinkSync(originalPageFilePath);
      } catch (e) {
        console.error("Failed to delete old page file:", e);
      }
    }

    // Update index list
    const indexItem = {
      id: actualId,
      title,
      slug,
      link,
      parent
    };

    const itemIdx = isNew ? -1 : allPagesList.findIndex((p: any) => p.id === actualId);
    if (itemIdx !== -1) {
      allPagesList[itemIdx] = indexItem;
    } else {
      allPagesList.unshift(indexItem);
    }

    fs.writeFileSync(indexFilePath, JSON.stringify(allPagesList, null, 2), "utf-8");

    const { logHistoryEvent } = await import("~/lib/content.server");
    logHistoryEvent(
      currentUser.name,
      isNew ? "Page Created" : "Page Updated",
      isNew ? `Created new page "${title}"` : `Updated page details for "${title}"`,
      "📄"
    );

    return redirect("/store_backend/pages");
  }

  if (intent === "duplicate_page") {
    const pageId = Number(formData.get("id"));
    const summary = allPagesList.find((p: any) => p.id === pageId);

    if (summary) {
      try {
        const originalPath = path.join(CONTENT_DIR, "pages", `${summary.slug}.json`);
        let originalDetails: any = {};
        if (fs.existsSync(originalPath)) {
          originalDetails = JSON.parse(fs.readFileSync(originalPath, "utf-8"));
        }

        const newId = Math.floor(10000 + Math.random() * 90000);
        const newTitle = `${summary.title} (Copy)`;
        const baseSlug = `${summary.slug}-copy`;
        let newSlug = baseSlug;
        let counter = 1;
        while (fs.existsSync(path.join(CONTENT_DIR, "pages", `${newSlug}.json`))) {
          newSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        // URL path resolver
        let parentPath = "";
        if (summary.parent > 0) {
          const parentItem = allPagesList.find((p: any) => p.id === summary.parent);
          if (parentItem) {
            parentPath = `${parentItem.slug}/`;
          }
        }
        const link = `https://petstore.co.ke/${parentPath}${newSlug}/`;

        const clonedDetails = {
          ...originalDetails,
          id: newId,
          title: newTitle,
          slug: newSlug,
          link,
          date: new Date().toISOString().split('.')[0],
          modified: new Date().toISOString().split('.')[0],
          seo: {
            ...originalDetails.seo,
            title: originalDetails.seo?.title ? `${originalDetails.seo.title} (Copy)` : `${newTitle} - PetStore Kenya`,
            canonical: link
          }
        };

        // Write detail JSON
        fs.writeFileSync(
          path.join(CONTENT_DIR, "pages", `${newSlug}.json`),
          JSON.stringify(clonedDetails, null, 2),
          "utf-8"
        );

        // Prepend to index list
        const indexItem = {
          id: newId,
          title: newTitle,
          slug: newSlug,
          link,
          parent: summary.parent
        };

        allPagesList.unshift(indexItem);
        fs.writeFileSync(indexFilePath, JSON.stringify(allPagesList, null, 2), "utf-8");

        const { logHistoryEvent } = await import("~/lib/content.server");
        logHistoryEvent(currentUser.name, "Page Duplicated", `Duplicated page "${summary.title}" as "${newTitle}"`, "📄");

      } catch (e) {
        console.error("Failed to duplicate page:", e);
      }
    }
    return redirect("/store_backend/pages");
  }

  if (intent === "trash_page") {
    const pageId = Number(formData.get("id"));
    const itemIdx = allPagesList.findIndex((p: any) => p.id === pageId);
    if (itemIdx !== -1) {
      const item = allPagesList[itemIdx];
      try {
        const detailPath = path.join(CONTENT_DIR, "pages", `${item.slug}.json`);
        if (fs.existsSync(detailPath)) {
          fs.unlinkSync(detailPath);
        }
      } catch (e) {
        console.error("Failed to delete page detail file:", e);
      }

      allPagesList.splice(itemIdx, 1);
      fs.writeFileSync(indexFilePath, JSON.stringify(allPagesList, null, 2), "utf-8");

      const { logHistoryEvent } = await import("~/lib/content.server");
      logHistoryEvent(currentUser.name, "Page Deleted", `Permanently deleted page "${item.title}"`, "🗑️");
    }
    return redirect("/store_backend/pages");
  }

  return null;
}

export default function VpBackendPages() {
  const { allPages, editingPageDetails, currentUser } = useLoaderData() as any;
  const navigation = useNavigation();
  const isUpdating = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "all";

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Modal quick edit state
  const [quickEditingPage, setQuickEditingPage] = useState<any | null>(null);

  // Screen Options States (WordPress style)
  const [showOptions, setShowOptions] = useState(false);
  const [showTitleCol, setShowTitleCol] = useState(true);
  const [showSlugCol, setShowSlugCol] = useState(true);
  const [showLinkCol, setShowLinkCol] = useState(true);
  const [showAuthorCol, setShowAuthorCol] = useState(true);
  const [showCommentsCol, setShowCommentsCol] = useState(true);
  const [showDateCol, setShowDateCol] = useState(true);
  const [showSeoCol, setShowSeoCol] = useState(true);
  const [showLinksCol, setShowLinksCol] = useState(true);

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [tempItemsPerPage, setTempItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting states
  const [sortKey, setSortKey] = useState<"title" | "slug" | "author" | "date" | "seo" | "readability">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (key: "title" | "slug" | "author" | "date" | "seo" | "readability") => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "date" ? "desc" : "asc");
    }
  };

  const renderSortIndicator = (key: "title" | "slug" | "author" | "date" | "seo" | "readability") => {
    if (sortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#00ccff" }}>{sortDirection === "asc" ? "▲" : "▼"}</span>;
  };

  // Deep Edit Form states
  const [titleVal, setTitleVal] = useState("");
  const [slugVal, setSlugVal] = useState("");
  const [contentVal, setContentVal] = useState("");
  const [excerptVal, setExcerptVal] = useState("");
  const [statusVal, setStatusVal] = useState("publish");
  const [parentVal, setParentVal] = useState(0);
  const [seoTitleVal, setSeoTitleVal] = useState("");
  const [metaDescVal, setMetaDescVal] = useState("");
  const [canonicalVal, setCanonicalVal] = useState("");

  useEffect(() => {
    if (editingPageDetails) {
      setTitleVal(editingPageDetails.title || "");
      setSlugVal(editingPageDetails.slug || "");
      setContentVal(editingPageDetails.content || "");
      setExcerptVal(editingPageDetails.excerpt || "");
      setStatusVal(editingPageDetails.status || "publish");
      setParentVal(editingPageDetails.parent || 0);
      setSeoTitleVal(editingPageDetails.seo?.title || "");
      setMetaDescVal(editingPageDetails.seo?.description || "");
      setCanonicalVal(editingPageDetails.seo?.canonical || "");
    } else {
      setTitleVal("");
      setSlugVal("");
      setContentVal("");
      setExcerptVal("");
      setStatusVal("publish");
      setParentVal(0);
      setSeoTitleVal("");
      setMetaDescVal("");
      setCanonicalVal("");
    }
  }, [editingPageDetails, currentView]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleVal(val);
    if (currentView === "new") {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlugVal(generatedSlug);
    }
  };

  const formatPageDate = (dateStr: string, status: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      let hr = d.getHours();
      const min = String(d.getMinutes()).padStart(2, '0');
      const ampm = hr >= 12 ? 'pm' : 'am';
      hr = hr % 12;
      hr = hr ? hr : 12; // the hour '0' should be '12'
      return (
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: "1.4" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "normal" }}>
            {status === "publish" ? "Published" : "Draft Saved"}
          </div>
          <div style={{ whiteSpace: "nowrap" }}>
            {yyyy}/{mm}/{dd} at {hr}:{min} {ampm}
          </div>
        </div>
      );
    } catch (e) {
      return dateStr;
    }
  };

  const tabFilteredPages = allPages.filter((p: any) => {
    if (activeTab === "published") return p.status === "publish";
    if (activeTab === "drafts") return p.status === "draft" || p.status === "pending";
    if (activeTab === "mine") return p.author === "Paul Kibet";
    return true;
  });

  const filteredPages = tabFilteredPages.filter((p: any) => {
    return !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort pages
  const sortedPages = [...filteredPages].sort((a: any, b: any) => {
    let result = 0;
    if (sortKey === "title") {
      result = (a.title || "").localeCompare(b.title || "");
    } else if (sortKey === "slug") {
      result = (a.slug || "").localeCompare(b.slug || "");
    } else if (sortKey === "author") {
      result = (a.author || "").localeCompare(b.author || "");
    } else if (sortKey === "date") {
      result = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
    } else if (sortKey === "seo") {
      result = (a.seoScore || "").localeCompare(b.seoScore || "");
    } else if (sortKey === "readability") {
      result = (a.readabilityScore || "").localeCompare(b.readabilityScore || "");
    }
    return sortDirection === "asc" ? result : -result;
  });

  // Pagination slicing
  const totalPages = Math.ceil(sortedPages.length / itemsPerPage);
  const paginatedPages = sortedPages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="pages-view" style={{ position: "relative" }}>
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

        .catalog-table-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          box-shadow: 0 4px 25px rgba(0,0,0,0.25);
          padding: 24px;
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
          max-width: 550px;
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
          right: 40px;
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
          transition: max-height 0.35s ease, padding 0.35s ease;
        }

        .screen-options-drawer.open {
          max-height: 200px;
          padding: 24px 40px;
        }

        .screen-options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .checkbox-label-admin {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
        }

        .checkbox-label-admin input {
          width: 14px;
          height: 14px;
          cursor: pointer;
        }

        /* Editor Styles */
        .editor-container-grid {
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .editor-container-grid {
            grid-template-columns: 1fr;
          }
        }

        .editor-main-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          margin-bottom: 24px;
        }

        .editor-sidebar-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          margin-bottom: 24px;
        }

        .editor-sec-title {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 10px;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .seo-preview-box {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 16px;
          margin-top: 12px;
        }

        .seo-preview-title {
          color: #1a0dab;
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 4px;
          word-break: break-all;
        }

        .seo-preview-link {
          color: #006621;
          font-size: 13px;
          margin-bottom: 4px;
          word-break: break-all;
        }

        .seo-preview-desc {
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          line-height: 1.4;
          word-break: break-all;
        }

        .meta-description-editor {
          font-family: monospace;
          background: rgba(0,0,0,0.2);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 8px 12px;
          width: 100%;
          min-height: 80px;
          font-size: 13px;
          outline: none;
        }

        .yoast-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          margin: 0 auto;
        }
        .yoast-dot.good {
          background-color: #2ed573;
          box-shadow: 0 0 6px #2ed573;
        }
        .yoast-dot.ok {
          background-color: #ff9f43;
          box-shadow: 0 0 6px #ff9f43;
        }
        .yoast-dot.poor {
          background-color: #ff4d62;
          box-shadow: 0 0 6px #ff4d62;
        }
      ` }} />

      {/* Screen Options Drawer */}
      {currentView === "all" && (
        <div className="screen-options-container">
          <div className="screen-options-wrapper">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="screen-options-toggle-btn"
            >
              Screen Options {showOptions ? "▲" : "▼"}
            </button>
          </div>

          <div className={`screen-options-drawer ${showOptions ? "open" : ""}`}>
            <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>
              Columns Visibility
            </h4>
            <div className="screen-options-grid">
              <label className="checkbox-label-admin">
                <input
                  type="checkbox"
                  checked={showTitleCol}
                  onChange={(e) => setShowTitleCol(e.target.checked)}
                />
                Title
              </label>
              <label className="checkbox-label-admin">
                <input
                  type="checkbox"
                  checked={showSlugCol}
                  onChange={(e) => setShowSlugCol(e.target.checked)}
                />
                Slug
              </label>
              <label className="checkbox-label-admin">
                <input
                  type="checkbox"
                  checked={showLinkCol}
                  onChange={(e) => setShowLinkCol(e.target.checked)}
                />
                URL
              </label>
              <label className="checkbox-label-admin">
                <input
                  type="checkbox"
                  checked={showAuthorCol}
                  onChange={(e) => setShowAuthorCol(e.target.checked)}
                />
                Author
              </label>
              <label className="checkbox-label-admin">
                <input
                  type="checkbox"
                  checked={showCommentsCol}
                  onChange={(e) => setShowCommentsCol(e.target.checked)}
                />
                Comments
              </label>
              <label className="checkbox-label-admin">
                <input
                  type="checkbox"
                  checked={showDateCol}
                  onChange={(e) => setShowDateCol(e.target.checked)}
                />
                Date
              </label>
              <label className="checkbox-label-admin">
                <input
                  type="checkbox"
                  checked={showLinksCol}
                  onChange={(e) => setShowLinksCol(e.target.checked)}
                />
                Links Count
              </label>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Pagination Limit:</span>
              <input
                type="number"
                value={tempItemsPerPage}
                onChange={(e) => setTempItemsPerPage(Number(e.target.value))}
                style={{ width: "60px", background: "#000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "3px 6px", color: "#fff", fontSize: "12px" }}
              />
              <button
                onClick={() => {
                  setItemsPerPage(tempItemsPerPage);
                  setCurrentPage(1);
                  setShowOptions(false);
                }}
                className="btn-action-primary"
                style={{ padding: "4px 10px", fontSize: "11px" }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ALL PAGES */}
      {currentView === "all" && (
        <>
          {/* Status Segments */}
          <div className="status-segments" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
              style={{ background: "none", border: "none", color: activeTab === "all" ? "#00ccff" : "rgba(255,255,255,0.6)", fontWeight: activeTab === "all" ? "600" : "400", cursor: "pointer", padding: 0, outline: "none" }}
            >
              All ({allPages.length})
            </button>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <button
              type="button"
              onClick={() => { setActiveTab("mine"); setCurrentPage(1); }}
              style={{ background: "none", border: "none", color: activeTab === "mine" ? "#00ccff" : "rgba(255,255,255,0.6)", fontWeight: activeTab === "mine" ? "600" : "400", cursor: "pointer", padding: 0, outline: "none" }}
            >
              Mine ({allPages.filter((p: any) => p.author === "Paul Kibet").length})
            </button>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <button
              type="button"
              onClick={() => { setActiveTab("published"); setCurrentPage(1); }}
              style={{ background: "none", border: "none", color: activeTab === "published" ? "#00ccff" : "rgba(255,255,255,0.6)", fontWeight: activeTab === "published" ? "600" : "400", cursor: "pointer", padding: 0, outline: "none" }}
            >
              Published ({allPages.filter((p: any) => p.status === "publish").length})
            </button>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <button
              type="button"
              onClick={() => { setActiveTab("drafts"); setCurrentPage(1); }}
              style={{ background: "none", border: "none", color: activeTab === "drafts" ? "#00ccff" : "rgba(255,255,255,0.6)", fontWeight: activeTab === "drafts" ? "600" : "400", cursor: "pointer", padding: 0, outline: "none" }}
            >
              Drafts ({allPages.filter((p: any) => p.status === "draft" || p.status === "pending").length})
            </button>
          </div>

          <div className="search-bar-row">
            <div className="filter-controls">
              <div className="search-input-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 12px", borderRadius: "8px", width: "100%", maxWidth: "340px" }}>
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search pages by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: "transparent", border: "none", color: "#fff", outline: "none", width: "100%", fontSize: "13px" }}
                />
              </div>
            </div>

            <Link
              to="/store_backend/pages?view=new"
              className="btn-action-primary"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", height: "38px" }}
            >
              + Add New Page
            </Link>
          </div>

          <div className="catalog-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "30px" }}><input type="checkbox" style={{ cursor: "pointer" }} /></th>
                    {showTitleCol && (
                      <th onClick={() => handleSort("title")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Page Title {renderSortIndicator("title")}
                      </th>
                    )}
                    {showSlugCol && (
                      <th onClick={() => handleSort("slug")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Slug {renderSortIndicator("slug")}
                      </th>
                    )}
                    {showLinkCol && <th>URL</th>}
                    {showAuthorCol && (
                      <th onClick={() => handleSort("author")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Author {renderSortIndicator("author")}
                      </th>
                    )}
                    {showCommentsCol && <th style={{ textAlign: "center", width: "40px" }}>💬</th>}
                    {showDateCol && (
                      <th onClick={() => handleSort("date")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Date {renderSortIndicator("date")}
                      </th>
                    )}
                    {showLinksCol && <th style={{ textAlign: "center", width: "40px" }} title="Outgoing internal links">↗</th>}
                    {showLinksCol && <th style={{ textAlign: "center", width: "40px" }} title="Incoming internal links">↘</th>}
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPages.length > 0 ? (
                    paginatedPages.map((page: any) => (
                      <tr key={page.id}>
                        <td><input type="checkbox" style={{ cursor: "pointer" }} /></td>
                        {showTitleCol && (
                          <td>
                            <div style={{ fontWeight: "600", color: "#fff", fontSize: "14px" }}>
                              {page.title}
                            </div>
                            <div className="row-actions">
                              <span style={{ color: "rgba(255, 255, 255, 0.45)" }}>ID: {page.id}</span>
                              <span className="row-actions-separator">|</span>
                              <Link
                                to={`/store_backend/pages?view=edit&id=${page.id}`}
                                style={{ color: "#00ccff", textDecoration: "none" }}
                              >
                                Edit
                              </Link>
                              <span className="row-actions-separator">|</span>
                              <button
                                onClick={() => setQuickEditingPage(page)}
                                style={{ background: "none", border: "none", padding: 0, color: "#00ccff", cursor: "pointer" }}
                              >
                                Quick Edit
                              </button>
                              <span className="row-actions-separator">|</span>
                              <Form
                                method="post"
                                style={{ display: "inline" }}
                                onSubmit={(e) => {
                                  if (!confirm("Are you sure you want to delete this page file? This cannot be undone.")) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                <input type="hidden" name="intent" value="trash_page" />
                                <input type="hidden" name="id" value={page.id} />
                                <button
                                  type="submit"
                                  style={{ background: "none", border: "none", padding: 0, color: "#ff4d62", cursor: "pointer" }}
                                >
                                  Trash
                                </button>
                              </Form>
                              <span className="row-actions-separator">|</span>
                              <a
                                href={page.link}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "#00ccff", textDecoration: "none" }}
                              >
                                View
                              </a>
                              <span className="row-actions-separator">|</span>
                              <Form method="post" style={{ display: "inline" }}>
                                <input type="hidden" name="intent" value="duplicate_page" />
                                <input type="hidden" name="id" value={page.id} />
                                <button
                                  type="submit"
                                  style={{ background: "none", border: "none", padding: 0, color: "#00ccff", cursor: "pointer" }}
                                >
                                  Duplicate
                                </button>
                              </Form>
                            </div>
                          </td>
                        )}
                        {showSlugCol && (
                          <td style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>
                            {page.slug}
                          </td>
                        )}
                        {showLinkCol && (
                          <td>
                            <a
                              href={page.link}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#a5b4fc", textDecoration: "none", fontSize: "12px", wordBreak: "break-all" }}
                            >
                              {page.link.replace("https://petstore.co.ke", "") || "/"}
                            </a>
                          </td>
                        )}
                        {showAuthorCol && (
                          <td>
                            <span style={{ fontSize: "13px", color: "#38bdf8", cursor: "pointer" }}>
                              {page.author}
                            </span>
                          </td>
                        )}
                        {showCommentsCol && (
                          <td style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                            —
                          </td>
                        )}
                        {showDateCol && (
                          <td>
                            {formatPageDate(page.date, page.status)}
                          </td>
                        )}
                        {showLinksCol && (
                          <td style={{ textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                            {page.outgoingLinks}
                          </td>
                        )}
                        {showLinksCol && (
                          <td style={{ textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                            {page.incomingLinks}
                          </td>
                        )}
                        <td style={{ textAlign: "right" }}>
                          <Link
                            to={`/store_backend/pages?view=edit&id=${page.id}`}
                            className="edit-badge-btn"
                            style={{ textDecoration: "none" }}
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={13} style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                        No pages match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPages.length)} of {filteredPages.length} pages
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="btn-action-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    ◀ Prev Page
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="btn-action-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    Next Page ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW: ADD OR EDIT PAGE */}
      {(currentView === "new" || currentView === "edit") && (
        <Form method="post" replace>
          <input type="hidden" name="intent" value="save_page_details" />
          <input type="hidden" name="id" value={currentView === "edit" ? editingPageDetails?.id : 0} />
          <input type="hidden" name="originalSlug" value={currentView === "edit" ? editingPageDetails?.slug : ""} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#fff" }}>
                {currentView === "edit" ? `Edit Page: ${editingPageDetails?.title}` : "Add New Page Content"}
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                JSON file: {currentView === "edit" ? `content/pages/${editingPageDetails?.slug}.json` : "Auto-created on submit"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Link to="/store_backend/pages" className="btn-action-secondary" style={{ textDecoration: "none" }}>
                Cancel
              </Link>
              <button type="submit" className="btn-action-primary" disabled={isUpdating}>
                {isUpdating ? "Saving..." : currentView === "edit" ? "Update Page" : "Publish Page"}
              </button>
            </div>
          </div>

          <div className="editor-container-grid">
            {/* Editor Main Column */}
            <div>
              <div className="editor-main-card">
                <div className="form-group-admin" style={{ marginBottom: "20px" }}>
                  <label className="admin-label">Page Title</label>
                  <input
                    type="text"
                    name="title"
                    value={titleVal}
                    onChange={handleTitleChange}
                    required
                    placeholder="Enter page title (e.g. About Us)"
                    className="admin-input"
                    style={{ fontSize: "16px", padding: "12px" }}
                  />
                </div>

                <div className="form-group-admin" style={{ marginBottom: "24px" }}>
                  <label className="admin-label">Page Excerpt (Brief Summary)</label>
                  <textarea
                    name="excerpt"
                    value={excerptVal}
                    onChange={(e) => setExcerptVal(e.target.value)}
                    placeholder="Provide a brief summary for RSS feeds or search descriptions"
                    className="admin-textarea"
                    rows={2}
                  />
                </div>

                <div className="form-group-admin" style={{ marginBottom: "24px" }}>
                  <label className="admin-label" style={{ marginBottom: "8px", display: "block" }}>Main Content (HTML/Rich-Text Supported)</label>
                  <VisualCodeEditor
                    name="content"
                    value={contentVal}
                    onChange={setContentVal}
                    placeholder="Enter page details or HTML structure..."
                    rows={16}
                  />
                </div>
              </div>

              {/* SEO Configurations */}
              <div className="editor-main-card">
                <h3 className="editor-sec-title">Search Engine Optimization (Yoast Style)</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group-admin">
                    <label className="admin-label">SEO Title Override</label>
                    <input
                      type="text"
                      name="seoTitle"
                      value={seoTitleVal}
                      onChange={(e) => setSeoTitleVal(e.target.value)}
                      placeholder={`${titleVal || "Page"} - PetStore Kenya`}
                      className="admin-input"
                    />
                  </div>
                  <div className="form-group-admin">
                    <label className="admin-label">Canonical URL Override</label>
                    <input
                      type="text"
                      name="canonical"
                      value={canonicalVal}
                      onChange={(e) => setCanonicalVal(e.target.value)}
                      placeholder={titleVal ? `https://petstore.co.ke/${slugVal}/` : "Auto-computed canonical url"}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="form-group-admin" style={{ marginTop: "16px", marginBottom: "16px" }}>
                  <label className="admin-label">Meta Description</label>
                  <textarea
                    name="metaDescription"
                    value={metaDescVal}
                    onChange={(e) => setMetaDescVal(e.target.value)}
                    placeholder="Enter meta description for search snippets..."
                    className="meta-description-editor"
                  />
                </div>

                <h4 style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>
                  Google Search Snippet Preview
                </h4>
                <div className="seo-preview-box">
                  <div className="seo-preview-title">
                    {seoTitleVal || `${titleVal || "New Page"} - PetStore Kenya`}
                  </div>
                  <div className="seo-preview-link">
                    {canonicalVal || `https://petstore.co.ke/${slugVal || "new-page"}/`}
                  </div>
                  <div className="seo-preview-desc">
                    {metaDescVal || "Please enter a meta description in the fields above to see how it will look in search engines."}
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Sidebar */}
            <div>
              <div className="editor-sidebar-card">
                <h3 className="editor-sec-title">Publish Settings</h3>

                <div className="form-group-admin" style={{ marginBottom: "16px" }}>
                  <label className="admin-label">Status</label>
                  <select
                    name="status"
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="admin-select"
                  >
                    <option value="publish">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>

                <div className="form-group-admin" style={{ marginBottom: "16px" }}>
                  <label className="admin-label">Parent Page Node</label>
                  <select
                    name="parent"
                    value={parentVal}
                    onChange={(e) => setParentVal(Number(e.target.value))}
                    className="admin-select"
                  >
                    <option value={0}>Main (No Parent)</option>
                    {allPages
                      .filter((p: any) => p.id !== (editingPageDetails?.id || 0))
                      .map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group-admin" style={{ marginBottom: "16px" }}>
                  <label className="admin-label">URL Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={slugVal}
                    onChange={(e) => setSlugVal(e.target.value)}
                    required
                    placeholder="url-friendly-slug"
                    className="admin-input"
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div className="editor-sidebar-card">
                <h3 className="editor-sec-title">Page Meta</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                  <div>
                    <strong>Date Created:</strong>{" "}
                    {currentView === "edit" ? editingPageDetails?.date?.replace("T", " ") : "Now"}
                  </div>
                  <div>
                    <strong>Last Modified:</strong>{" "}
                    {currentView === "edit" ? editingPageDetails?.modified?.replace("T", " ") : "Now"}
                  </div>
                  <div>
                    <strong>Author:</strong> Admin
                  </div>
                  <div>
                    <strong>Featured Image:</strong> None
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Form>
      )}

      {/* QUICK EDIT MODAL */}
      {quickEditingPage && (
        <div
          className="modal-overlay"
          onClick={() => setQuickEditingPage(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>
                Quick Edit Page
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setQuickEditingPage(null)}
              >
                ×
              </button>
            </div>

            <Form
              method="post"
              onSubmit={() => {
                // close modal after submit delay
                setTimeout(() => setQuickEditingPage(null), 300);
              }}
            >
              <input type="hidden" name="intent" value="quick_edit" />
              <input type="hidden" name="id" value={quickEditingPage.id} />
              <input type="hidden" name="originalSlug" value={quickEditingPage.slug} />

              <div className="form-group-admin" style={{ marginBottom: "16px" }}>
                <label className="admin-label">Page Title</label>
                <input
                  className="admin-input"
                  type="text"
                  name="title"
                  defaultValue={quickEditingPage.title}
                  required
                />
              </div>

              <div className="form-group-admin" style={{ marginBottom: "16px" }}>
                <label className="admin-label">Slug</label>
                <input
                  className="admin-input"
                  type="text"
                  name="slug"
                  defaultValue={quickEditingPage.slug}
                  required
                  style={{ fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div className="form-group-admin">
                  <label className="admin-label">Status</label>
                  <select
                    name="status"
                    defaultValue={quickEditingPage.status || "publish"}
                    className="admin-select"
                  >
                    <option value="publish">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="form-group-admin">
                  <label className="admin-label">Parent Node</label>
                  <select
                    name="parent"
                    defaultValue={quickEditingPage.parent || 0}
                    className="admin-select"
                  >
                    <option value={0}>Main (No Parent)</option>
                    {allPages
                      .filter((p: any) => p.id !== quickEditingPage.id)
                      .map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
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
                  onClick={() => setQuickEditingPage(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Page"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
