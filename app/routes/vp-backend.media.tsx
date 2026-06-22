import { useState, useEffect } from "react";
import { Form, useLoaderData, useNavigation, Link, useSearchParams, redirect } from "react-router";
import fs from "fs";
import path from "path";

interface MediaItem {
  name: string;
  url: string;
  size: number;
  date: string; // ISO string
  mimeType: string;
  folder: string; // relative to assets/
  fullPath: string;
}

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  await requireAdminUser(request);

  const ASSETS_DIR = path.join(process.cwd(), "public", "assets");
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // 1. Recursive file scanner
  const mediaItems: MediaItem[] = [];
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".mp4", ".webm", ".mov", ".ogg", ".pdf", ".mp3", ".wav"];

  function scanDirectory(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          // Calculate public URL
          const publicIndex = filePath.indexOf(path.join("public"));
          let url = "";
          if (publicIndex !== -1) {
            url = filePath.substring(publicIndex + "public".length).replace(/\\/g, "/");
          } else {
            url = "/assets/" + path.relative(ASSETS_DIR, filePath).replace(/\\/g, "/");
          }

          // Calculate folder path relative to assets
          const assetsIndex = filePath.indexOf(path.join("public", "assets"));
          let folder = "root";
          if (assetsIndex !== -1) {
            const relativeToAssets = filePath.substring(assetsIndex + path.join("public", "assets").length);
            const dirName = path.dirname(relativeToAssets).replace(/\\/g, "/");
            folder = dirName === "/" || dirName === "." ? "root" : dirName.replace(/^\//, "");
          }

          let mimeType = "application/octet-stream";
          if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) mimeType = `image/${ext.replace(".", "")}`;
          else if (ext === ".svg") mimeType = "image/svg+xml";
          else if ([".mp4", ".webm", ".mov", ".ogg"].includes(ext)) mimeType = `video/${ext.replace(".", "")}`;
          else if (ext === ".pdf") mimeType = "application/pdf";
          else if ([".mp3", ".wav"].includes(ext)) mimeType = `audio/${ext.replace(".", "")}`;

          mediaItems.push({
            name: file,
            url,
            size: stat.size,
            date: stat.mtime.toISOString(),
            mimeType,
            folder,
            fullPath: filePath,
          });
        }
      }
    }
  }

  scanDirectory(ASSETS_DIR);

  // 2. Folder structure scanner
  const folders: string[] = ["root"];
  function scanFolders(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const assetsIndex = filePath.indexOf(path.join("public", "assets"));
        if (assetsIndex !== -1) {
          const relativeToAssets = filePath.substring(assetsIndex + path.join("public", "assets").length);
          const formatted = relativeToAssets.replace(/\\/g, "/").replace(/^\//, "");
          if (formatted) folders.push(formatted);
        }
        scanFolders(filePath);
      }
    }
  }
  scanFolders(ASSETS_DIR);

  return { mediaItems, folders };
}

export async function action({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  await requireAdminUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  const ASSETS_DIR = path.join(process.cwd(), "public", "assets");

  if (intent === "upload") {
    const targetFolder = formData.get("folder")?.toString() || "root";
    const uploadDir = targetFolder === "root"
      ? ASSETS_DIR
      : path.join(ASSETS_DIR, targetFolder);

    fs.mkdirSync(uploadDir, { recursive: true });

    const files = formData.getAll("files") as File[];
    for (const file of files) {
      if (file && file.size > 0 && file.name) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(file.name);
        const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
        const filename = `${Date.now()}-${base}${ext}`;
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
      }
    }
    return redirect("/vp-backend/media");
  }

  if (intent === "delete") {
    const fullPath = formData.get("fullPath")?.toString();
    if (!fullPath) return { error: "Missing file identifier" };

    // Prevent directory traversal attacks
    const resolvedPath = path.resolve(fullPath);
    const publicDir = path.resolve(path.join(process.cwd(), "public"));
    if (!resolvedPath.startsWith(publicDir)) {
      return { error: "Unauthorized file access" };
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      return { success: true };
    }
    return { error: "File not found" };
  }

  if (intent === "bulk_delete") {
    const pathsStr = formData.get("fullPaths")?.toString();
    if (!pathsStr) return { error: "No files specified" };
    try {
      const paths = JSON.parse(pathsStr) as string[];
      const publicDir = path.resolve(path.join(process.cwd(), "public"));
      for (const fp of paths) {
        const resolvedPath = path.resolve(fp);
        if (resolvedPath.startsWith(publicDir) && fs.existsSync(resolvedPath)) {
          fs.unlinkSync(resolvedPath);
        }
      }
      return { success: true };
    } catch (err) {
      console.error("Bulk delete failed:", err);
      return { error: "Bulk delete failed" };
    }
  }

  if (intent === "create_folder") {
    const parentFolder = formData.get("parentFolder")?.toString() || "root";
    const folderName = formData.get("folderName")?.toString();

    if (!folderName) return { error: "Folder name is required" };

    const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const parentDir = parentFolder === "root" ? ASSETS_DIR : path.join(ASSETS_DIR, parentFolder);
    const newDir = path.join(parentDir, sanitizedFolderName);

    fs.mkdirSync(newDir, { recursive: true });
    return { success: true };
  }

  return null;
}

export default function MediaRoute() {
  const { mediaItems, folders } = useLoaderData() as { mediaItems: MediaItem[]; folders: string[] };
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const actionParam = searchParams.get("action");
  const [showNotice, setShowNotice] = useState(true);

  const [uploaderMode, setUploaderMode] = useState<"multi" | "browser">("multi");

  // UI Filter State
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Screen Options States (WordPress style)
  const [showOptions, setShowOptions] = useState(false);
  const [showPreviewColumn, setShowPreviewColumn] = useState(true);
  const [showFolderColumn, setShowFolderColumn] = useState(true);
  const [showSizeColumn, setShowSizeColumn] = useState(true);
  const [showDateColumn, setShowDateColumn] = useState(true);

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [tempItemsPerPage, setTempItemsPerPage] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFolder, searchQuery, selectedType, selectedDate]);

  // Dialog States
  const [activeDetailItem, setActiveDetailItem] = useState<MediaItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [newFolderParent, setNewFolderParent] = useState<string>("root");
  const [copiedUrl, setCopiedUrl] = useState<string>("");
  const [isBulkSelectMode, setIsBulkSelectMode] = useState<boolean>(false);
  const [selectedItemPaths, setSelectedItemPaths] = useState<string[]>([]);

  // Helper: Format bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // Helper: Format Date
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Extract dynamic dates (Months/Years) for filtering
  const dateOptions = Array.from(
    new Set(
      mediaItems.map((item) => {
        const date = new Date(item.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
      })
    )
  ).sort((a, b) => b.localeCompare(a));

  // Filter Logic
  const filteredItems = mediaItems.filter((item) => {
    // 1. Folder filter
    if (activeFolder !== "all") {
      if (activeFolder === "root" && item.folder !== "root") return false;
      if (activeFolder !== "root" && item.folder !== activeFolder && !item.folder.startsWith(activeFolder + "/")) return false;
    }

    // 2. Type filter
    if (selectedType !== "all") {
      if (selectedType === "image" && !item.mimeType.startsWith("image/")) return false;
      if (selectedType === "video" && !item.mimeType.startsWith("video/")) return false;
      if (selectedType === "audio" && !item.mimeType.startsWith("audio/")) return false;
      if (selectedType === "document" && !item.mimeType.includes("pdf")) return false;
    }

    // 3. Date filter
    if (selectedDate !== "all") {
      const itemDate = new Date(item.date);
      const itemYearMonth = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, "0")}`;
      if (itemYearMonth !== selectedDate) return false;
    }

    // 4. Search Query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(query) || item.url.toLowerCase().includes(query);
    }

    return true;
  });

  // Sorting states
  const [sortKey, setSortKey] = useState<"name" | "folder" | "size" | "date">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (key: "name" | "folder" | "size" | "date") => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "date" || key === "size" ? "desc" : "asc");
    }
  };

  const renderSortIndicator = (key: "name" | "folder" | "size" | "date") => {
    if (sortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#ff4d62" }}>{sortDirection === "asc" ? "▲" : "▼"}</span>;
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    let result = 0;
    if (sortKey === "name") {
      result = (a.name || "").localeCompare(b.name || "");
    } else if (sortKey === "folder") {
      result = (a.folder || "").localeCompare(b.folder || "");
    } else if (sortKey === "size") {
      result = (a.size || 0) - (b.size || 0);
    } else if (sortKey === "date") {
      result = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
    }
    return sortDirection === "asc" ? result : -result;
  });

  // Pagination logic
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate file counts per folder for UI sidebar badges
  const getFolderFileCount = (folderPath: string) => {
    return mediaItems.filter((item) => {
      if (folderPath === "all") return true;
      if (folderPath === "root") return item.folder === "root";
      return item.folder === folderPath || item.folder.startsWith(folderPath + "/");
    }).length;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(""), 2000);
  };

  // Close modals and reset bulk select when submitting action is successful
  useEffect(() => {
    if (isSubmitting) return;
    setShowUploadModal(false);
    setShowNewFolderModal(false);
    setNewFolderName("");
    setSelectedItemPaths([]);
    setIsBulkSelectMode(false);
  }, [isSubmitting]);

  return (
    <div className="media-console-wrapper">
      <style dangerouslySetInnerHTML={{
        __html: `
        .media-console-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
          color: #f3f4f6;
          font-family: 'Poppins', sans-serif;
        }

        /* Screen Options Styling */
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
          margin-top: 16px;
        }
        .screen-options-title:first-of-type {
          margin-top: 0;
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
          accent-color: #472f8f;
        }

        /* Top Header Action Bar */
        .media-header-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px 24px;
        }

        .media-banner-left h2 {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .media-banner-left p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin: 4px 0 0 0;
        }

        .btn-add-media {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #472f8f;
          border: none;
          color: #fff;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-add-media:hover {
          background: #ff2a43;
          transform: translateY(-1px);
        }

        /* Layout Grid */
        .media-layout-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 960px) {
          .media-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Folder Sidebar Tree */
        .folder-tree-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
        }
        .folder-tree-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .folder-tree-header h3 {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .btn-icon-addfolder {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .btn-icon-addfolder:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .folder-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .folder-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          text-align: left;
          width: 100%;
          transition: all 0.2s ease;
        }
        .folder-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
        }
        .folder-item.active {
          background: rgba(71, 47, 143, 0.1);
          border-left: 3px solid #472f8f;
          color: #fff;
          font-weight: 600;
          padding-left: 9px;
        }

        .folder-badge {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .folder-item.active .folder-badge {
          background: #472f8f;
          color: #fff;
        }

        /* Filter Toolbar */
        .filter-toolbar {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .filters-left {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }

        .filter-select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 8px 12px;
          color: #fff;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }

        .search-container {
          position: relative;
          min-width: 240px;
        }
        .search-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 8px 12px 8px 36px;
          color: #fff;
          font-size: 13px;
          outline: none;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
          pointer-events: none;
        }

        .layout-toggle-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }
        .layout-toggle-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Media Grid Layout */
        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 20px;
        }

        .media-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          cursor: pointer;
        }
        .media-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
          transform: translateY(-2px);
        }
        .media-card.selected {
          border-color: #472f8f !important;
          box-shadow: 0 0 15px rgba(71, 47, 143, 0.3) !important;
        }
        .media-card-checkbox {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 10;
          cursor: pointer;
          accent-color: #472f8f;
          width: 18px;
          height: 18px;
        }

        .media-thumbnail-container {
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.2);
          overflow: hidden;
          position: relative;
          padding: 8px;
        }
        .media-thumbnail-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 4px;
        }

        .media-type-icon {
          font-size: 36px;
          color: rgba(255, 255, 255, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .media-type-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.4);
        }

        .media-info-bar {
          background: rgba(7, 7, 10, 0.95);
          padding: 10px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .media-name {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .media-meta-text {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Hover Overlay Actions */
        .media-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(2px);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.25s ease;
        }
        .media-card:hover .media-card-overlay {
          opacity: 1;
        }

        .overlay-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          color: #fff;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .overlay-action-btn.view {
          background: rgba(255, 255, 255, 0.1);
        }
        .overlay-action-btn.view:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .overlay-action-btn.copy {
          background: rgba(255, 255, 255, 0.1);
        }
        .overlay-action-btn.copy:hover {
          background: #472f8f;
        }
        .overlay-action-btn.delete {
          background: rgba(71, 47, 143, 0.2);
          color: #ff4d62;
        }
        .overlay-action-btn.delete:hover {
          background: #472f8f;
          color: #fff;
        }

        /* Media List Layout */
        .media-list-wrapper {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 8px 16px;
        }
        .media-list-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .media-list-table th {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .media-list-table td {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 13px;
        }
        .list-preview {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .list-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        /* Modal Dialogs */
        .media-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }
        .media-modal-card {
          background: #0f0f15;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          color: #ffffff;
        }
        .media-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .media-modal-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff !important;
          margin: 0;
        }
        .btn-close-modal {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 20px;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .btn-close-modal:hover {
          color: #fff;
        }

        .media-modal-body {
          padding: 24px;
        }

        /* Upload Modal Drag Zone */
        .upload-dragzone {
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          background: rgba(255, 255, 255, 0.01);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .upload-dragzone:hover {
          border-color: #472f8f;
          background: rgba(71, 47, 143, 0.02);
        }
        .upload-dragzone-icon {
          font-size: 40px;
          margin-bottom: 12px;
          display: block;
        }
        .upload-dragzone p {
          margin: 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .upload-form-row {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .upload-form-row label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .btn-submit-upload {
          width: 100%;
          background: #472f8f;
          border: none;
          color: #fff;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 24px;
          transition: background 0.3s ease;
        }
        .btn-submit-upload:hover {
          background: #ff2a43;
        }

        /* Detail Modal Specifics */
        .detail-preview-box {
          width: 100%;
          height: 240px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .detail-preview-box img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .detail-preview-box video {
          max-width: 100%;
          max-height: 100%;
        }

        .detail-metadata-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.02);
          padding: 12px;
          border-radius: 8px;
        }
        .detail-meta-row {
          display: flex;
          justify-content: space-between;
        }
        .detail-meta-label {
          color: rgba(255, 255, 255, 0.4);
        }
        .detail-meta-value {
          font-weight: 500;
          word-break: break-all;
          max-width: 70%;
          text-align: right;
        }

        .detail-actions-row {
          display: flex;
          gap: 12px;
        }
        .btn-detail-action {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          text-align: center;
          transition: all 0.2s ease;
        }
        .btn-detail-action.copy {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .btn-detail-action.copy:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .btn-detail-action.delete {
          background: rgba(71, 47, 143, 0.15);
          color: #ff4d62;
          border: 1px solid rgba(71, 47, 143, 0.3);
        }
        .btn-detail-action.delete:hover {
          background: #472f8f;
          color: #fff;
        }

        /* Success toast/copy alert */
        .toast-copy-notify {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #2ed573;
          color: #fff;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(46, 213, 115, 0.3);
          z-index: 1100;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* New folder dialog form elements */
        .newfolder-form-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .newfolder-input-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .newfolder-input-row label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
        }
        .newfolder-input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 10px;
          color: #fff;
          font-size: 13px;
          outline: none;
        }
      ` }} />

      {/* Copy Notification Toast */}
      {copiedUrl && (
        <div className="toast-copy-notify">
          🔗 Path copied to clipboard!
        </div>
      )}

      {actionParam === "upload" ? (
        <div className="upload-media-page">
          <style dangerouslySetInnerHTML={{
            __html: `
            .upload-media-page {
              display: flex;
              flex-direction: column;
              gap: 20px;
              font-family: 'Poppins', sans-serif;
            }

            .notice-banner {
              background: #fffdf5;
              border: 1px solid #f5ebd0;
              border-left: 4px solid #f1c40f;
              color: #2c3e50;
              padding: 16px 20px;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 13px;
              font-weight: 500;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }

            .notice-banner a {
              color: #0088cc;
              text-decoration: underline;
              font-weight: 600;
              cursor: pointer;
            }

            .notice-close {
              background: transparent;
              border: none;
              color: #7f8c8d;
              font-size: 16px;
              cursor: pointer;
              font-weight: 700;
            }

            .upload-workspace {
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-radius: 12px;
              padding: 40px;
              display: flex;
              flex-direction: column;
              gap: 24px;
            }

            .upload-header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);
              padding-bottom: 16px;
            }

            .upload-header-row h2 {
              font-size: 20px;
              font-weight: 700;
              color: #fff;
              margin: 0;
            }

            .drag-drop-area {
              border: 2px dashed rgba(255, 255, 255, 0.15);
              border-radius: 12px;
              padding: 80px 40px;
              text-align: center;
              background: rgba(255, 255, 255, 0.01);
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 12px;
            }

            .drag-drop-area:hover {
              border-color: #472f8f;
              background: rgba(71, 47, 143, 0.02);
            }

            .drag-drop-title {
              font-size: 20px;
              font-weight: 500;
              color: rgba(255, 255, 255, 0.8);
            }

            .drag-drop-or {
              font-size: 13px;
              color: rgba(255, 255, 255, 0.4);
            }

            .btn-select-files {
              background: transparent;
              border: 1.5px solid #0088cc;
              color: #0088cc;
              padding: 8px 24px;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .btn-select-files:hover {
              background: rgba(0, 136, 204, 0.1);
              border-color: #0099ff;
              color: #0099ff;
            }

            .upload-footer-text {
              font-size: 13px;
              color: rgba(255, 255, 255, 0.6);
              margin-top: 12px;
              line-height: 1.6;
            }

            .upload-footer-text a {
              color: #0088cc;
              text-decoration: underline;
              cursor: pointer;
            }

            .upload-footer-text a:hover {
              color: #0099ff;
            }

            .browser-uploader-row {
              display: flex;
              align-items: center;
              gap: 20px;
              margin: 20px 0;
            }

            .btn-browser-upload {
              background: #e2e2e2;
              border: 1px solid #cccccc;
              color: #2c3e50;
              padding: 8px 24px;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .btn-browser-upload:hover {
              background: #d5d5d5;
              border-color: #b8b8b8;
            }

            .browser-file-input {
              color: #fff;
              font-size: 13px;
            }

            .upload-footer-actions {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              margin-top: 12px;
              gap: 16px;
            }

            .upload-footer-actions .upload-footer-text {
              margin-top: 0;
            }

            .upload-footer-actions .btn-submit-upload {
              margin-top: 0;
            }
          ` }} />

          <div className="upload-workspace">
            <div className="upload-header-row">
              <h2>Upload Media</h2>
              <Link to="/vp-backend/media" className="layout-toggle-btn" style={{ textDecoration: "none" }}>
                📁 View Library
              </Link>
            </div>

            <Form method="post" encType="multipart/form-data" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <input type="hidden" name="intent" value="upload" />

              <div className="upload-form-row">
                <label style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: "8px", display: "block" }}>
                  Destination Folder
                </label>
                <select name="folder" defaultValue="root" className="filter-select" style={{ width: "100%", maxWidth: "300px" }}>
                  <option value="root">assets/ (Root)</option>
                  {folders.filter(f => f !== "root").map(f => {
                    const parts = f.split("/");
                    const formattedParts = parts.map(p => p.toLowerCase() === "downloads" ? "Downloadables" : p.charAt(0).toUpperCase() + p.slice(1));
                    return (
                      <option key={f} value={f}>
                        assets/{formattedParts.join("/")}
                      </option>
                    );
                  })}
                </select>
              </div>

              {uploaderMode === "multi" ? (
                <>
                  <div onClick={() => document.getElementById("page-file-upload-input")?.click()} className="drag-drop-area">
                    <span style={{ fontSize: "48px" }}>📤</span>
                    <span className="drag-drop-title">Drop files to upload</span>
                    <span className="drag-drop-or">or</span>
                    <button type="button" className="btn-select-files">Select Files</button>
                    <input
                      id="page-file-upload-input"
                      type="file"
                      name="files"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const label = document.getElementById("page-file-upload-label");
                        if (label && e.target.files) {
                          label.textContent = `${e.target.files.length} file(s) selected`;
                        }
                      }}
                    />
                    <div id="page-file-upload-label" style={{ marginTop: "12px", fontSize: "14px", color: "#2ed573", fontWeight: 600 }}></div>
                  </div>

                  <div className="upload-footer-actions">
                    <div className="upload-footer-text">
                      You are using the multi-file uploader. Problems? Try the <a onClick={() => setUploaderMode("browser")}>browser uploader</a> instead.
                      <div style={{ marginTop: "4px" }}>Maximum upload file size: 100 MB.</div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="btn-submit-upload" style={{ maxWidth: "200px" }}>
                      {isSubmitting ? "Uploading files..." : "Start Upload"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="browser-uploader-row">
                    <input
                      type="file"
                      name="files"
                      multiple
                      className="browser-file-input"
                    />
                    <button type="submit" disabled={isSubmitting} className="btn-browser-upload">
                      {isSubmitting ? "Uploading..." : "Upload"}
                    </button>
                  </div>

                  <div className="upload-footer-text">
                    You are using the browser's built-in file uploader. The WordPress uploader includes multiple file selection and drag and drop capability. <a onClick={() => setUploaderMode("multi")}>Switch to the multi-file uploader</a>.
                    <div style={{ marginTop: "4px" }}>Maximum upload file size: 100 MB.</div>
                  </div>
                </>
              )}
            </Form>
          </div>
        </div>
      ) : (
        <>
          {/* Screen Options Drawer */}
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
              <div className="checkbox-group-grid" style={{ marginBottom: "20px" }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showPreviewColumn}
                    onChange={(e) => setShowPreviewColumn(e.target.checked)}
                  />
                  Preview
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showFolderColumn}
                    onChange={(e) => setShowFolderColumn(e.target.checked)}
                  />
                  Folder
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showSizeColumn}
                    onChange={(e) => setShowSizeColumn(e.target.checked)}
                  />
                  Size
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showDateColumn}
                    onChange={(e) => setShowDateColumn(e.target.checked)}
                  />
                  Date Modified
                </label>
              </div>

              <div className="screen-options-title">Pagination</div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>Number of items per page:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tempItemsPerPage}
                  onChange={(e) => setTempItemsPerPage(Number(e.target.value))}
                  style={{
                    width: "60px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "4px",
                    color: "#fff",
                    padding: "4px 8px",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setItemsPerPage(tempItemsPerPage);
                    setCurrentPage(1);
                    setShowOptions(false);
                  }}
                  style={{
                    background: "#472f8f",
                    border: "none",
                    color: "#fff",
                    padding: "5px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Apply
                </button>
              </div>

              <div className="screen-options-title">View mode</div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  style={{
                    background: viewMode === "grid" ? "rgba(71, 47, 143, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    border: viewMode === "grid" ? "1px solid #472f8f" : "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    padding: "6px 16px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setViewMode("grid");
                    setShowOptions(false);
                  }}
                >
                  Grid View
                </button>
                <button
                  type="button"
                  style={{
                    background: viewMode === "list" ? "rgba(71, 47, 143, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    border: viewMode === "list" ? "1px solid #472f8f" : "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    padding: "6px 16px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setViewMode("list");
                    setShowOptions(false);
                  }}
                >
                  List View
                </button>
              </div>
            </div>
          </div>

          {/* Media Header Banner */}
          <div className="media-header-banner">
            <div className="media-banner-left">
              <h2>Media Library</h2>
              <p>Manage, upload, organize, and copy local media files</p>
            </div>
            <Link to="/vp-backend/media?action=upload" className="btn-add-media" style={{ textDecoration: "none" }}>
              <span>➕</span> Add Media File
            </Link>
          </div>

          {/* Layout Grid */}
          <div className="media-layout-grid">
            {/* Left Folder Tree */}
            <aside className="folder-tree-card">
              <div className="folder-tree-header">
                <h3>Folders / Groups</h3>
                <button
                  onClick={() => {
                    setNewFolderParent(activeFolder === "all" ? "root" : activeFolder);
                    setShowNewFolderModal(true);
                  }}
                  className="btn-icon-addfolder"
                  title="Create new subfolder"
                >
                  📁⁺
                </button>
              </div>
              <nav className="folder-list">
                <button
                  onClick={() => setActiveFolder("all")}
                  className={`folder-item ${activeFolder === "all" ? "active" : ""}`}
                >
                  <span>🌎 All Assets</span>
                  <span className="folder-badge">{getFolderFileCount("all")}</span>
                </button>
                <button
                  onClick={() => setActiveFolder("root")}
                  className={`folder-item ${activeFolder === "root" ? "active" : ""}`}
                >
                  <span>🏠 Root /assets</span>
                  <span className="folder-badge">{getFolderFileCount("root")}</span>
                </button>

                {folders.filter(f => f !== "root").map((folder) => {
                  const base = folder.split("/").pop() || "";
                  const formattedName = base.toLowerCase() === "downloads" ? "Downloads" : base.charAt(0).toUpperCase() + base.slice(1);
                  return (
                    <button
                      key={folder}
                      onClick={() => setActiveFolder(folder)}
                      className={`folder-item ${activeFolder === folder ? "active" : ""}`}
                      style={{ paddingLeft: `${12 + (folder.split("/").length - 1) * 8}px` }}
                    >
                      <span>📂 {formattedName}</span>
                      <span className="folder-badge">{getFolderFileCount(folder)}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Right Media Grid View */}
            <div className="media-right-section">
              {/* Force refresh */}
              {/* Filter Toolbar */}
              <div className="filter-toolbar">
                <div className="filters-left">
                  {/* Type Filter */}
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All types</option>
                    <option value="image">🖼️ Images</option>
                    <option value="video">🎥 Videos</option>
                    <option value="audio">🎵 Audio</option>
                    <option value="document">📄 Documents</option>
                  </select>

                  {/* Date Filter */}
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All dates</option>
                    {dateOptions.map((dateStr) => {
                      const [year, month] = dateStr.split("-");
                      const dateObj = new Date(Number(year), Number(month) - 1);
                      const label = dateObj.toLocaleString("en-US", { month: "long", year: "numeric" });
                      return (
                        <option key={dateStr} value={dateStr}>
                          {label}
                        </option>
                      );
                    })}
                  </select>

                  {/* View Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    className="layout-toggle-btn"
                  >
                    {viewMode === "grid" ? "🗒️ List View" : "🎴 Grid View"}
                  </button>

                  {/* Bulk Select Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkSelectMode(!isBulkSelectMode);
                      setSelectedItemPaths([]);
                    }}
                    className="layout-toggle-btn"
                    style={{
                      borderColor: isBulkSelectMode ? "#472f8f" : "rgba(255,255,255,0.08)",
                      background: isBulkSelectMode ? "rgba(71,47,143,0.15)" : "rgba(255,255,255,0.05)",
                      color: isBulkSelectMode ? "#fff" : "rgba(255,255,255,0.6)"
                    }}
                  >
                    {isBulkSelectMode ? "❌ Cancel Bulk Select" : "✔️ Bulk Select"}
                  </button>

                  {isBulkSelectMode && selectedItemPaths.length > 0 && (
                    <>
                      <Form method="post" style={{ display: "inline" }}>
                        <input type="hidden" name="intent" value="bulk_delete" />
                        <input type="hidden" name="fullPaths" value={JSON.stringify(selectedItemPaths)} />
                        <button
                          type="submit"
                          className="layout-toggle-btn"
                          style={{
                            background: "#472f8f",
                            borderColor: "#472f8f",
                            color: "#fff",
                            fontWeight: 600
                          }}
                          onClick={(e) => {
                            if (!confirm(`Are you sure you want to permanently delete all ${selectedItemPaths.length} selected items?`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          🗑️ Delete Selected ({selectedItemPaths.length})
                        </button>
                      </Form>

                      <button
                        type="button"
                        onClick={() => setSelectedItemPaths([])}
                        className="layout-toggle-btn"
                      >
                        🧹 Clear
                      </button>
                    </>
                  )}
                </div>

                {/* Search Bar */}
                <div className="search-container">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {/* Media Items View */}
              {filteredItems.length === 0 ? (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.01)",
                    border: "2px dashed rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                    padding: "60px 20px",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>📁</span>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: "0 0 8px 0" }}>
                    No assets found
                  </h3>
                  <p style={{ fontSize: "12px", margin: 0 }}>
                    Try selecting a different folder, filtering parameters, or uploading new files.
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="media-grid">
                  {paginatedItems.map((item) => {
                    const isImage = item.mimeType.startsWith("image/");
                    const isVideo = item.mimeType.startsWith("video/");
                    const isAudio = item.mimeType.startsWith("audio/");

                    return (
                      <div
                        key={item.url}
                        className={`media-card ${selectedItemPaths.includes(item.fullPath) ? "selected" : ""}`}
                        onClick={() => {
                          if (isBulkSelectMode) {
                            if (selectedItemPaths.includes(item.fullPath)) {
                              setSelectedItemPaths(selectedItemPaths.filter(p => p !== item.fullPath));
                            } else {
                              setSelectedItemPaths([...selectedItemPaths, item.fullPath]);
                            }
                          } else {
                            setActiveDetailItem(item);
                          }
                        }}
                      >
                        {isBulkSelectMode && (
                          <input
                            type="checkbox"
                            checked={selectedItemPaths.includes(item.fullPath)}
                            onChange={() => { }}
                            className="media-card-checkbox"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}

                        <div className="media-thumbnail-container">
                          {isImage ? (
                            <img src={item.url} alt={item.name} className="media-thumbnail-img" />
                          ) : isVideo ? (
                            <div className="media-type-icon">
                              <span>🎥</span>
                              <span className="media-type-label">{item.mimeType.split("/").pop()}</span>
                            </div>
                          ) : isAudio ? (
                            <div className="media-type-icon">
                              <span>🎵</span>
                              <span className="media-type-label">audio</span>
                            </div>
                          ) : (
                            <div className="media-type-icon">
                              <span>📄</span>
                              <span className="media-type-label">doc</span>
                            </div>
                          )}
                        </div>
                        <div className="media-info-bar">
                          <span className="media-name" title={item.name}>
                            {item.name}
                          </span>
                          <span className="media-meta-text">
                            {formatBytes(item.size)}
                          </span>
                        </div>

                        {/* Hover Actions Overlay */}
                        {!isBulkSelectMode && (
                          <div className="media-card-overlay" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setActiveDetailItem(item)}
                              className="overlay-action-btn view"
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => copyToClipboard(item.url)}
                              className="overlay-action-btn copy"
                              title="Copy Relative Path"
                            >
                              🔗
                            </button>
                            <Form method="post" style={{ display: "inline" }}>
                              <input type="hidden" name="intent" value="delete" />
                              <input type="hidden" name="fullPath" value={item.fullPath} />
                              <button
                                type="submit"
                                onClick={(e) => {
                                  if (!confirm("Are you sure you want to permanently delete this media file?")) {
                                    e.preventDefault();
                                  }
                                }}
                                className="overlay-action-btn delete"
                                title="Delete File"
                              >
                                🗑️
                              </button>
                            </Form>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="media-list-wrapper">
                  <table className="media-list-table">
                    <thead>
                      <tr>
                        {isBulkSelectMode && (
                          <th style={{ width: "40px" }}>
                            <input
                              type="checkbox"
                              checked={filteredItems.length > 0 && filteredItems.every((item) => selectedItemPaths.includes(item.fullPath))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItemPaths(Array.from(new Set([...selectedItemPaths, ...filteredItems.map((item) => item.fullPath)])));
                                } else {
                                  const filteredPaths = filteredItems.map((item) => item.fullPath);
                                  setSelectedItemPaths(selectedItemPaths.filter((p) => !filteredPaths.includes(p)));
                                }
                              }}
                              style={{ accentColor: "#472f8f", cursor: "pointer", width: "16px", height: "16px" }}
                            />
                          </th>
                        )}
                        {showPreviewColumn && <th>Preview</th>}
                        <th onClick={() => handleSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                          Name {renderSortIndicator("name")}
                        </th>
                        {showFolderColumn && (
                          <th onClick={() => handleSort("folder")} style={{ cursor: "pointer", userSelect: "none" }}>
                            Folder {renderSortIndicator("folder")}
                          </th>
                        )}
                        {showSizeColumn && (
                          <th onClick={() => handleSort("size")} style={{ cursor: "pointer", userSelect: "none" }}>
                            Size {renderSortIndicator("size")}
                          </th>
                        )}
                        {showDateColumn && (
                          <th onClick={() => handleSort("date")} style={{ cursor: "pointer", userSelect: "none" }}>
                            Date Modified {renderSortIndicator("date")}
                          </th>
                        )}
                        {!isBulkSelectMode && <th style={{ textAlign: "right" }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((item) => {
                        const isImage = item.mimeType.startsWith("image/");
                        const isSelected = selectedItemPaths.includes(item.fullPath);
                        return (
                          <tr
                            key={item.url}
                            onClick={() => {
                              if (isBulkSelectMode) {
                                if (isSelected) {
                                  setSelectedItemPaths(selectedItemPaths.filter((p) => p !== item.fullPath));
                                } else {
                                  setSelectedItemPaths([...selectedItemPaths, item.fullPath]);
                                }
                              }
                            }}
                            style={{
                              cursor: isBulkSelectMode ? "pointer" : "default",
                              background: isSelected ? "rgba(71, 47, 143, 0.05)" : "transparent",
                            }}
                          >
                            {isBulkSelectMode && (
                              <td>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => { }}
                                  style={{ accentColor: "#472f8f", cursor: "pointer", width: "16px", height: "16px" }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                            )}
                            {showPreviewColumn && (
                              <td>
                                <div className="list-preview">
                                  {isImage ? (
                                    <img src={item.url} alt={item.name} />
                                  ) : (
                                    <span style={{ fontSize: "20px" }}>
                                      {item.mimeType.startsWith("video/") ? "🎥" : item.mimeType.startsWith("audio/") ? "🎵" : "📄"}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}
                            <td>
                              <div style={{ fontWeight: 600, color: "#fff" }}>{item.name}</div>
                              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{item.url}</div>
                            </td>
                            {showFolderColumn && (
                              <td>
                                <span className="folder-badge" style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
                                  {item.folder === "root" ? "assets" : item.folder}
                                </span>
                              </td>
                            )}
                            {showSizeColumn && <td>{formatBytes(item.size)}</td>}
                            {showDateColumn && <td>{formatDate(item.date)}</td>}
                            {!isBulkSelectMode && (
                              <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                  <button
                                    onClick={() => setActiveDetailItem(item)}
                                    className="btn-icon-addfolder"
                                    title="Details"
                                  >
                                    👁️
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(item.url)}
                                    className="btn-icon-addfolder"
                                    title="Copy URL"
                                  >
                                    🔗
                                  </button>
                                  <Form method="post" style={{ display: "inline" }}>
                                    <input type="hidden" name="intent" value="delete" />
                                    <input type="hidden" name="fullPath" value={item.fullPath} />
                                    <button
                                      type="submit"
                                      onClick={(e) => {
                                        if (!confirm("Are you sure you want to permanently delete this media file?")) {
                                          e.preventDefault();
                                        }
                                      }}
                                      className="btn-icon-addfolder"
                                      style={{ background: "rgba(71, 47, 143, 0.15)", color: "#ff4d62", borderColor: "rgba(71, 47, 143, 0.3)" }}
                                      title="Delete"
                                    >
                                      🗑️
                                    </button>
                                  </Form>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls at the bottom */}
              {sortedItems.length > 0 && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  marginTop: "24px"
                }}>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedItems.length)} of {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"}
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        type="button"
                        className="layout-toggle-btn"
                        style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                      >
                        ◀ Previous
                      </button>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        className="layout-toggle-btn"
                        style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                      >
                        Next ▶
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="media-modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div className="media-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="media-modal-header">
              <h3>Upload Media Files</h3>
              <button onClick={() => setShowUploadModal(false)} className="btn-close-modal">
                ×
              </button>
            </div>
            <Form method="post" encType="multipart/form-data" className="media-modal-body">
              <input type="hidden" name="intent" value="upload" />

              {/* Target folder selection */}
              <div className="upload-form-row" style={{ marginBottom: "20px" }}>
                <label>Target Destination Folder</label>
                <select name="folder" defaultValue={activeFolder === "all" ? "root" : activeFolder} className="filter-select" style={{ width: "100%" }}>
                  <option value="root">assets/ (Root)</option>
                  {folders.filter(f => f !== "root").map(f => (
                    <option key={f} value={f}>
                      assets/{f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag Zone Input */}
              <div onClick={() => document.getElementById("file-upload-input")?.click()} className="upload-dragzone">
                <span className="upload-dragzone-icon">📤</span>
                <p>Click here to choose files or drag them in</p>
                <input
                  id="file-upload-input"
                  type="file"
                  name="files"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const label = document.getElementById("file-upload-label");
                    if (label && e.target.files) {
                      label.textContent = `${e.target.files.length} file(s) selected`;
                    }
                  }}
                />
                <div id="file-upload-label" style={{ marginTop: "12px", fontSize: "12px", color: "#2ed573", fontWeight: 600 }}></div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-submit-upload">
                {isSubmitting ? "Uploading files..." : "Start Upload"}
              </button>
            </Form>
          </div>
        </div>
      )}

      {/* Create New Folder Modal */}
      {showNewFolderModal && (
        <div className="media-modal-backdrop" onClick={() => setShowNewFolderModal(false)}>
          <div className="media-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="media-modal-header">
              <h3>Create New Folder</h3>
              <button onClick={() => setShowNewFolderModal(false)} className="btn-close-modal">
                ×
              </button>
            </div>
            <Form method="post" className="media-modal-body newfolder-form-grid">
              <input type="hidden" name="intent" value="create_folder" />

              <div className="newfolder-input-row">
                <label>Parent Folder</label>
                <select
                  name="parentFolder"
                  value={newFolderParent}
                  onChange={(e) => setNewFolderParent(e.target.value)}
                  className="filter-select"
                  style={{ width: "100%" }}
                >
                  <option value="root">assets/ (Root)</option>
                  {folders.filter(f => f !== "root").map(f => (
                    <option key={f} value={f}>
                      assets/{f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="newfolder-input-row">
                <label>New Folder Name</label>
                <input
                  type="text"
                  name="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. appliances-gallery"
                  required
                  className="newfolder-input"
                  autoFocus
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-submit-upload" style={{ marginTop: "12px" }}>
                {isSubmitting ? "Creating folder..." : "Create Folder"}
              </button>
            </Form>
          </div>
        </div>
      )}

      {/* Detail Viewer Modal */}
      {activeDetailItem && (
        <div className="media-modal-backdrop" onClick={() => setActiveDetailItem(null)}>
          <div className="media-modal-card" style={{ maxWidth: "640px" }} onClick={(e) => e.stopPropagation()}>
            <div className="media-modal-header">
              <h3>Asset Details</h3>
              <button onClick={() => setActiveDetailItem(null)} className="btn-close-modal">
                ×
              </button>
            </div>
            <div className="media-modal-body">
              <div className="detail-preview-box">
                {activeDetailItem.mimeType.startsWith("image/") ? (
                  <img src={activeDetailItem.url} alt={activeDetailItem.name} />
                ) : activeDetailItem.mimeType.startsWith("video/") ? (
                  <video src={activeDetailItem.url} controls />
                ) : activeDetailItem.mimeType.startsWith("audio/") ? (
                  <audio src={activeDetailItem.url} controls />
                ) : (
                  <div className="media-type-icon">
                    <span>📄</span>
                    <span className="media-type-label">{activeDetailItem.mimeType}</span>
                  </div>
                )}
              </div>

              <div className="detail-metadata-grid">
                <div className="detail-meta-row">
                  <span className="detail-meta-label">File Name</span>
                  <span className="detail-meta-value" style={{ fontWeight: 600, color: "#fff" }}>
                    {activeDetailItem.name}
                  </span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-label">File URL</span>
                  <span className="detail-meta-value" style={{ color: "#2ed573" }}>
                    {activeDetailItem.url}
                  </span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Folder Location</span>
                  <span className="detail-meta-value">
                    {activeDetailItem.folder === "root" ? "assets/" : `assets/${activeDetailItem.folder}`}
                  </span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-label">File Size</span>
                  <span className="detail-meta-value">{formatBytes(activeDetailItem.size)}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-label">MIME Type</span>
                  <span className="detail-meta-value">{activeDetailItem.mimeType}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Last Modified</span>
                  <span className="detail-meta-value">{formatDate(activeDetailItem.date)}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-label">System Filepath</span>
                  <span className="detail-meta-value" style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                    {activeDetailItem.fullPath}
                  </span>
                </div>
              </div>

              <div className="detail-actions-row">
                <button onClick={() => copyToClipboard(activeDetailItem.url)} className="btn-detail-action copy">
                  📋 Copy Path
                </button>
                <a
                  href={activeDetailItem.url}
                  download={activeDetailItem.name}
                  className="btn-detail-action copy"
                  style={{ textDecoration: "none" }}
                >
                  📥 Download
                </a>
                <Form method="post" style={{ flex: 1, display: "flex" }}>
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="fullPath" value={activeDetailItem.fullPath} />
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!confirm("Are you sure you want to permanently delete this media file?")) {
                        e.preventDefault();
                      } else {
                        setActiveDetailItem(null);
                      }
                    }}
                    className="btn-detail-action delete"
                  >
                    🗑Permanent Delete
                  </button>
                </Form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
