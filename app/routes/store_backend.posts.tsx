import { useState, useEffect } from "react";
import { Form, useLoaderData, useSearchParams, redirect, Link } from "react-router";
import VisualCodeEditor from "~/components/VisualCodeEditor";
import { db } from "~/lib/db.server";
import {
  getBlogCategories,
  saveBlogCategories,
  getBlogTags,
  saveBlogTags,
  logHistoryEvent
} from "~/lib/content.server";
import type { BlogPost, BlogCategory, BlogTag } from "~/lib/content.server";

function getSlugFromLink(link: string): string {
  if (!link) return "untitled-post";
  try {
    if (link.startsWith("http://") || link.startsWith("https://")) {
      const url = new URL(link);
      const pathname = url.pathname.replace(/^\/|\/$/g, "");
      return pathname || "untitled-post";
    }
    return link.replace(/^\/|\/$/g, "");
  } catch {
    return link.replace(/^\/|\/$/g, "");
  }
}

function formatTitleWithBreak(title: string) {
  if (!title) return "";
  const words = title.split(" ");
  if (words.length <= 9) return title;

  const chunks = [];
  for (let i = 0; i < words.length; i += 9) {
    chunks.push(words.slice(i, i + 9).join(" "));
  }

  return chunks.map((chunk, index) => (
    <span key={index}>
      {chunk}
      {index < chunks.length - 1 && <br />}
    </span>
  ));
}

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const posts = await db.post.findMany();
  const categories = getBlogCategories();
  const tags = getBlogTags();

  const url = new URL(request.url);
  const editId = url.searchParams.get("id");
  let editPost = null;
  if (editId) {
    editPost = posts.find(p => p.id === editId) || null;
  }

  return { posts, categories, tags, editPost, currentUser };
}

export async function action({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  const posts = await db.post.findMany();

  if (intent === "add_post" || intent === "save_post_details") {
    const id = formData.get("id")?.toString() || "post-" + Date.now();
    const title = formData.get("title")?.toString() || "";
    const image = formData.get("image")?.toString() || "";
    const link = formData.get("link")?.toString() || "";
    const tag = formData.get("tag")?.toString() || "Audio";
    const status = formData.get("status")?.toString() || "publish";
    const date = formData.get("date")?.toString() || new Date().toISOString();
    const content = formData.get("content")?.toString() || "";
    const slug = formData.get("slug")?.toString() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const newPost: BlogPost = {
      id,
      title,
      image,
      link,
      tag,
      status,
      date,
      author: currentUser.name,
      content,
      slug
    };

    if (intent === "add_post") {
      await db.post.create(newPost);
      logHistoryEvent(currentUser.name, "Post Created", `Created blog post "${title}"`, "📝");
    } else {
      await db.post.update({ where: { id }, data: newPost });
      logHistoryEvent(currentUser.name, "Post Updated", `Updated blog post details for "${title}"`, "📝");
    }
    return redirect("/store_backend/posts?view=all");
  }

  if (intent === "quick_edit") {
    const id = formData.get("id")?.toString() || "";
    const status = formData.get("status")?.toString() || "publish";
    const tag = formData.get("tag")?.toString() || "Audio";
    const link = formData.get("link")?.toString() || "";
    const date = formData.get("date")?.toString() || "";
    const slug = formData.get("slug")?.toString() || "";

    const idx = posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      const updateData: Partial<BlogPost> = { status, tag, link };
      if (date) updateData.date = date;
      if (slug) updateData.slug = slug;
      await db.post.update({ where: { id }, data: updateData });
      logHistoryEvent(currentUser.name, "Post Quick-Edited", `Quick-edited status/link/slug for "${posts[idx].title}"`, "📝");
    }
    return { success: true };
  }

  if (intent === "duplicate_post") {
    const id = formData.get("id")?.toString() || "";
    const original = posts.find(p => p.id === id);
    if (original) {
      const clone: BlogPost = {
        ...original,
        id: "post-" + Date.now(),
        title: `Copy of ${original.title}`,
        date: new Date().toISOString(),
        author: currentUser.name,
        slug: original.slug ? `${original.slug}-copy` : undefined
      };
      await db.post.create(clone);
      logHistoryEvent(currentUser.name, "Post Duplicated", `Cloned blog post "${original.title}"`, "📝");
    }
    return { success: true };
  }

  if (intent === "trash_post") {
    const id = formData.get("id")?.toString() || "";
    const original = posts.find(p => p.id === id);
    if (original) {
      await db.post.delete({ where: { id } });
      logHistoryEvent(currentUser.name, "Post Deleted", `Permanently deleted blog post "${original.title}"`, "🗑️");
    }
    return { success: true };
  }

  if (intent === "add_category") {
    const name = formData.get("name")?.toString() || "";
    const slug = formData.get("slug")?.toString() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const description = formData.get("description")?.toString() || "";

    const categories = getBlogCategories();
    if (categories.some(c => c.slug === slug)) {
      return { error: "Category slug already exists" };
    }

    const newCat: BlogCategory = {
      id: "cat-" + Date.now(),
      name,
      slug,
      description
    };
    categories.push(newCat);
    saveBlogCategories(categories);
    logHistoryEvent(currentUser.name, "Category Added", `Created blog post category "${name}"`, "📁");
    return { success: true };
  }

  if (intent === "delete_category") {
    const id = formData.get("id")?.toString() || "";
    const categories = getBlogCategories();
    const target = categories.find(c => c.id === id);
    if (target) {
      const updated = categories.filter(c => c.id !== id);
      saveBlogCategories(updated);
      logHistoryEvent(currentUser.name, "Category Deleted", `Deleted blog post category "${target.name}"`, "🗑️");
    }
    return { success: true };
  }

  if (intent === "add_tag") {
    const name = formData.get("name")?.toString() || "";
    const slug = formData.get("slug")?.toString() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const description = formData.get("description")?.toString() || "";

    const tags = getBlogTags();
    if (tags.some(t => t.slug === slug)) {
      return { error: "Tag slug already exists" };
    }

    const newTag: BlogTag = {
      id: "tag-" + Date.now(),
      name,
      slug,
      description
    };
    tags.push(newTag);
    saveBlogTags(tags);
    logHistoryEvent(currentUser.name, "Tag Added", `Created blog post tag "${name}"`, "🏷️");
    return { success: true };
  }

  if (intent === "delete_tag") {
    const id = formData.get("id")?.toString() || "";
    const tags = getBlogTags();
    const target = tags.find(t => t.id === id);
    if (target) {
      const updated = tags.filter(t => t.id !== id);
      saveBlogTags(updated);
      logHistoryEvent(currentUser.name, "Tag Deleted", `Deleted blog post tag "${target.name}"`, "🗑️");
    }
    return { success: true };
  }

  return null;
}

export default function VpBackendPosts() {
  const { posts, categories, tags, editPost } = useLoaderData() as any;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "all";

  const [contentVal, setContentVal] = useState("");
  useEffect(() => {
    if (editPost) {
      setContentVal(editPost.content || "");
    } else {
      setContentVal("");
    }
  }, [editPost]);

  // Dynamic posts status counts
  const countAll = posts.length;
  const countPublished = posts.filter((p: any) => p.status === "publish").length;
  const countDrafts = posts.filter((p: any) => p.status === "draft").length;
  const countTrash = posts.filter((p: any) => p.status === "trash").length;

  // Filter and search states for All Posts
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Screen Options States (WordPress style)
  const [showOptions, setShowOptions] = useState(false);
  const [showAuthor, setShowAuthor] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [showDate, setShowDate] = useState(true);

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [tempItemsPerPage, setTempItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // View mode
  const [viewMode, setViewMode] = useState<"compact" | "extended">("compact");

  // Reset page when filters or limits change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter, itemsPerPage]);

  // Sorting states
  const [postSortKey, setPostSortKey] = useState<"title" | "author" | "category" | "date" | "status">("date");
  const [postSortDir, setPostSortDir] = useState<"asc" | "desc">("desc");

  const [catSortKey, setCatSortKey] = useState<"name" | "slug" | "description" | "count">("name");
  const [catSortDir, setCatSortDir] = useState<"asc" | "desc">("asc");

  const [tagSortKey, setTagSortKey] = useState<"name" | "slug" | "description">("name");
  const [tagSortDir, setTagSortDir] = useState<"asc" | "desc">("asc");

  const handlePostSort = (key: "title" | "author" | "category" | "date" | "status") => {
    if (postSortKey === key) {
      setPostSortDir((prev: "asc" | "desc") => prev === "asc" ? "desc" : "asc");
    } else {
      setPostSortKey(key);
      setPostSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const renderPostSortIndicator = (key: "title" | "author" | "category" | "date" | "status") => {
    if (postSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#ff4d62" }}>{postSortDir === "asc" ? "▲" : "▼"}</span>;
  };

  const handleCatSort = (key: "name" | "slug" | "description" | "count") => {
    if (catSortKey === key) {
      setCatSortDir((prev: "asc" | "desc") => prev === "asc" ? "desc" : "asc");
    } else {
      setCatSortKey(key);
      setCatSortDir("asc");
    }
  };

  const renderCatSortIndicator = (key: "name" | "slug" | "description" | "count") => {
    if (catSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#ff4d62" }}>{catSortDir === "asc" ? "▲" : "▼"}</span>;
  };

  const handleTagSort = (key: "name" | "slug" | "description") => {
    if (tagSortKey === key) {
      setTagSortDir((prev: "asc" | "desc") => prev === "asc" ? "desc" : "asc");
    } else {
      setTagSortKey(key);
      setTagSortDir("asc");
    }
  };

  const renderTagSortIndicator = (key: "name" | "slug" | "description") => {
    if (tagSortKey !== key) return <span style={{ marginLeft: "4px", opacity: 0.35 }}>⇅</span>;
    return <span style={{ marginLeft: "4px", color: "#ff4d62" }}>{tagSortDir === "asc" ? "▲" : "▼"}</span>;
  };

  // Quick edit states
  const [quickEditPost, setQuickEditPost] = useState<any>(null);

  // Filter posts
  const filteredPosts = posts.filter((p: any) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || p.tag === categoryFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedPosts = [...filteredPosts].sort((a: any, b: any) => {
    let result = 0;
    if (postSortKey === "title") {
      result = (a.title || "").localeCompare(b.title || "");
    } else if (postSortKey === "author") {
      result = (a.author || "").localeCompare(b.author || "");
    } else if (postSortKey === "category") {
      result = (a.tag || "").localeCompare(b.tag || "");
    } else if (postSortKey === "date") {
      result = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
    } else if (postSortKey === "status") {
      result = (a.status || "").localeCompare(b.status || "");
    }
    return postSortDir === "asc" ? result : -result;
  });

  const totalPages = Math.ceil(sortedPosts.length / itemsPerPage);
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const sortedCategories = [...categories].sort((a: any, b: any) => {
    let result = 0;
    if (catSortKey === "name") {
      result = (a.name || "").localeCompare(b.name || "");
    } else if (catSortKey === "slug") {
      result = (a.slug || "").localeCompare(b.slug || "");
    } else if (catSortKey === "description") {
      result = (a.description || "").localeCompare(b.description || "");
    } else if (catSortKey === "count") {
      result = (a.count || 0) - (b.count || 0);
    }
    return catSortDir === "asc" ? result : -result;
  });

  const sortedTags = [...tags].sort((a: any, b: any) => {
    let result = 0;
    if (tagSortKey === "name") {
      result = (a.name || "").localeCompare(b.name || "");
    } else if (tagSortKey === "slug") {
      result = (a.slug || "").localeCompare(b.slug || "");
    } else if (tagSortKey === "description") {
      result = (a.description || "").localeCompare(b.description || "");
    }
    return tagSortDir === "asc" ? result : -result;
  });

  const handleDuplicate = async (id: string) => {
    const body = new FormData();
    body.append("intent", "duplicate_post");
    body.append("id", id);
    await fetch(window.location.href, { method: "POST", body });
    window.location.reload();
  };

  const handleTrash = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this blog post?")) return;
    const body = new FormData();
    body.append("intent", "trash_post");
    body.append("id", id);
    await fetch(window.location.href, { method: "POST", body });
    window.location.href = "/store_backend/posts?view=all";
  };

  const handleQuickEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form);
    await fetch(window.location.href, { method: "POST", body });
    setQuickEditPost(null);
    window.location.reload();
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    const body = new FormData();
    body.append("intent", "delete_category");
    body.append("id", id);
    await fetch(window.location.href, { method: "POST", body });
    window.location.reload();
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete tag "${name}"?`)) return;
    const body = new FormData();
    body.append("intent", "delete_tag");
    body.append("id", id);
    await fetch(window.location.href, { method: "POST", body });
    window.location.reload();
  };

  return (
    <div className="posts-page">
      <style dangerouslySetInnerHTML={{
        __html: `
        .posts-page {
          color: #f3f4f6;
          font-family: 'Poppins', sans-serif;
        }

        .posts-tabs {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 24px;
          padding-bottom: 8px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 6px;
          text-decoration: none;
        }

        .tab-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
        }

        .tab-btn.active {
          color: #ff4d62;
          background: rgba(255, 77, 98, 0.08);
          font-weight: 600;
        }

        /* Filter Controls */
        .posts-filters {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-select, .search-input, .form-input, .form-textarea {
          background: #09090d;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 6px;
          outline: none;
          transition: all 0.3s ease;
        }

        .filter-select:focus, .search-input:focus, .form-input:focus, .form-textarea:focus {
          border-color: rgba(255, 77, 98, 0.4);
          box-shadow: 0 0 10px rgba(255, 77, 98, 0.15);
        }

        .search-input { min-width: 240px; }
        .filter-select { min-width: 160px; }

        /* Data table */
        .posts-table-wrap {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          overflow: hidden;
        }

        .posts-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .posts-table th {
          background: rgba(255, 255, 255, 0.03);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.4);
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .posts-table td {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          font-size: 13px;
          vertical-align: middle;
        }

        .posts-table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }

        .post-title-cell {
          font-weight: 600;
          color: #fff;
        }

        .row-actions {
          display: flex;
          gap: 12px;
          margin-top: 6px;
          opacity: 0.5;
          transition: opacity 0.2s ease;
        }

        .posts-table tr:hover .row-actions {
          opacity: 1;
        }

        .action-link {
          font-size: 11px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 0;
          cursor: pointer;
          text-decoration: none;
        }

        .action-link:hover {
          color: #ff4d62;
        }

        .action-link.trash-action:hover {
          color: #ff3333;
        }

        /* Badges */
        .status-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0, 204, 255, 0.1);
          color: #00ccff;
          border: 1px solid rgba(0, 204, 255, 0.2);
        }

        .status-badge.publish {
          background: rgba(0, 204, 85, 0.1);
          color: #00cc55;
          border-color: rgba(0, 204, 85, 0.2);
        }

        .status-badge.draft {
          background: rgba(255, 170, 0, 0.1);
          color: #ffaa00;
          border-color: rgba(255, 170, 0, 0.2);
        }

        .status-badge.trash {
          background: rgba(255, 51, 51, 0.1);
          color: #ff3333;
          border-color: rgba(255, 51, 51, 0.2);
        }

        /* Forms Layout */
        .editor-form {
          max-width: 720px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-row label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        /* Split Columns for Categories/Tags */
        .split-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
        }

        .split-left {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 20px;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Quick Edit Overlay */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-card {
          background: #0d0d12;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          width: 500px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 12px;
        }

        .btn-primary {
          background: #ff4d62;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 77, 98, 0.2);
        }

        .btn-primary:hover {
          background: #472f8f;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
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
          accent-color: #ff4d62;
        }
      ` }} />

      <div className="posts-tabs">
        <a href="/store_backend/posts?view=all" className={`tab-btn ${currentView === "all" ? "active" : ""}`}>
          📋 All Posts
        </a>
        <a href="/store_backend/posts?view=new" className={`tab-btn ${currentView === "new" || currentView === "edit" ? "active" : ""}`}>
          ➕ Add Post
        </a>
        <a href="/store_backend/posts?view=categories" className={`tab-btn ${currentView === "categories" ? "active" : ""}`}>
          📂 Categories
        </a>
        <a href="/store_backend/posts?view=tags" className={`tab-btn ${currentView === "tags" ? "active" : ""}`}>
          🏷️ Tags
        </a>
      </div>

      {/* VIEW: ALL POSTS */}
      {currentView === "all" && (
        <div>
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
                    checked={showAuthor}
                    onChange={(e) => setShowAuthor(e.target.checked)}
                  />
                  Author
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
                    checked={showComments}
                    onChange={(e) => setShowComments(e.target.checked)}
                  />
                  Comments
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showDate}
                    onChange={(e) => setShowDate(e.target.checked)}
                  />
                  Date
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
                    background: "#09090d",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontSize: "13px",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    width: "60px",
                    outline: "none"
                  }}
                />
              </div>

              <div className="screen-options-title">View mode</div>
              <div style={{ display: "flex", gap: "24px", marginBottom: "20px" }}>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="viewMode"
                    checked={viewMode === "compact"}
                    onChange={() => setViewMode("compact")}
                  />
                  Compact view
                </label>
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="viewMode"
                    checked={viewMode === "extended"}
                    onChange={() => setViewMode("extended")}
                  />
                  Extended view
                </label>
              </div>

              <div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: "8px 18px", fontSize: "12px" }}
                  onClick={() => {
                    setItemsPerPage(tempItemsPerPage);
                    setShowOptions(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Page Sub-Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", marginTop: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#fff", margin: 0 }}>Posts</h2>
              <Link to="?view=new" className="btn-action-secondary" style={{ padding: "4px 12px", fontSize: "12px", height: "30px", display: "flex", alignItems: "center", borderColor: "rgba(255, 77, 98, 0.4)", color: "#ff4d62", textDecoration: "none", background: "rgba(255, 77, 98, 0.05)" }}>Add New Post</Link>
            </div>
          </div>

          {/* Search and Status links row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
            {/* Status links (WordPress style) */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "rgba(255,255,255,0.3)", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                  cursor: "pointer",
                  color: statusFilter === "all" ? "#ff4d62" : "rgba(255,255,255,0.7)",
                  fontWeight: statusFilter === "all" ? "600" : "normal"
                }}
              >
                All ({countAll})
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => setStatusFilter("publish")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                  cursor: "pointer",
                  color: statusFilter === "publish" ? "#ff4d62" : "rgba(255,255,255,0.7)",
                  fontWeight: statusFilter === "publish" ? "600" : "normal"
                }}
              >
                Published ({countPublished})
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => setStatusFilter("draft")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                  cursor: "pointer",
                  color: statusFilter === "draft" ? "#ff4d62" : "rgba(255,255,255,0.7)",
                  fontWeight: statusFilter === "draft" ? "600" : "normal"
                }}
              >
                Drafts ({countDrafts})
              </button>
              {countTrash > 0 && (
                <>
                  <span>|</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("trash")}
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
                placeholder="Search posts..."
                className="search-input"
                style={{ height: "32px", width: "200px", padding: "4px 10px", fontSize: "13px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="btn-action-secondary"
                style={{ height: "32px", padding: "0 12px", fontSize: "12px", cursor: "pointer" }}
              >
                Search posts
              </button>
            </div>
          </div>

          {/* Toolbar of Filters (Dropdowns & Action buttons) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            <select
              className="filter-select"
              style={{ minWidth: "150px", width: "auto", background: "rgba(0,0,0,0.3)", height: "32px", padding: "4px 8px", fontSize: "13px" }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="posts-table-wrap">
            <table className="posts-table">
              <thead>
                <tr>
                  <th onClick={() => handlePostSort("title")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Title {renderPostSortIndicator("title")}
                  </th>
                  {showAuthor && (
                    <th onClick={() => handlePostSort("author")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Author {renderPostSortIndicator("author")}
                    </th>
                  )}
                  {showCategories && (
                    <th onClick={() => handlePostSort("category")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Category {renderPostSortIndicator("category")}
                    </th>
                  )}
                  {showTags && <th>Tags</th>}
                  {showComments && <th style={{ textAlign: "center" }}>💬</th>}
                  {showDate && (
                    <th onClick={() => handlePostSort("date")} style={{ cursor: "pointer", userSelect: "none" }}>
                      Date {renderPostSortIndicator("date")}
                    </th>
                  )}

                  <th onClick={() => handlePostSort("status")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Status {renderPostSortIndicator("status")}
                  </th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPosts.length > 0 ? (
                  paginatedPosts.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ padding: viewMode === "extended" ? "18px 20px" : "12px 20px" }}>
                        <div className="post-title-cell">{formatTitleWithBreak(p.title)}</div>
                        {viewMode === "extended" && p.content && (
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px", maxWidth: "600px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {p.content.replace(/<[^>]*>/g, '')}
                          </div>
                        )}
                        <div className="row-actions">
                          <a href={`/store_backend/posts?view=edit&id=${p.id}`} className="action-link">Edit</a>
                          <span>|</span>
                          <button
                            type="button"
                            onClick={() => setQuickEditPost(p)}
                            className="action-link"
                          >
                            Quick Edit
                          </button>
                          <span>|</span>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p.id)}
                            className="action-link"
                          >
                            Duplicate
                          </button>
                          <span>|</span>
                          <button
                            type="button"
                            onClick={() => handleTrash(p.id)}
                            className="action-link trash-action"
                          >
                            Trash
                          </button>
                        </div>
                      </td>
                      {showAuthor && <td>{p.author || "System Admin"}</td>}
                      {showCategories && <td>{p.tag}</td>}
                      {showTags && <td>{p.tag === "Audio" ? "Speakers, Soundbars" : p.tag === "TVs" ? "Smart TV, 4K" : "Home"}</td>}
                      {showComments && (
                        <td style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                          <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => alert("No comments on this post yet.")}>0</span>
                        </td>
                      )}
                      {showDate && <td>{new Date(p.date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}</td>}
                      <td>
                        <span className={`status-badge ${p.status}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <a href={`/discover/${p.slug || getSlugFromLink(p.link)}`} target="_blank" rel="noopener noreferrer" className="action-link" style={{ textDecoration: "underline" }}>
                          View Link
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={
                      3 +
                      (showAuthor ? 1 : 0) +
                      (showCategories ? 1 : 0) +
                      (showTags ? 1 : 0) +
                      (showComments ? 1 : 0) +
                      (showDate ? 1 : 0)
                    } style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                      No blog posts matched your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {sortedPosts.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              marginTop: "20px"
            }}>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedPosts.length)} of {sortedPosts.length} {sortedPosts.length === 1 ? "post" : "posts"}
              </div>
              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                  >
                    ◀ Previous Page
                  </button>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                  >
                    Next Page ▶
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ADD / EDIT POST */}
      {(currentView === "new" || currentView === "edit") && (
        <Form method="post" className="editor-form">
          <input type="hidden" name="intent" value={currentView === "new" ? "add_post" : "save_post_details"} />
          {currentView === "edit" && <input type="hidden" name="id" value={editPost?.id} />}

          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "10px" }}>
            {currentView === "new" ? "Create New Blog Post" : `Edit Post: ${editPost?.title}`}
          </h3>

          <div className="form-row">
            <label htmlFor="title">Post Title</label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={editPost?.title || ""}
              required
              placeholder="e.g. Why the TowerSpeaker 240W is a Great Buy..."
              className="form-input"
            />
          </div>

          <div className="form-row">
            <label htmlFor="image">Image Source URL</label>
            <input
              type="text"
              id="image"
              name="image"
              defaultValue={editPost?.image || ""}
              required
              placeholder="https://..."
              className="form-input"
            />
            {editPost?.image && (
              <div style={{ marginTop: "10px", width: "120px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                <img src={editPost.image} alt="Preview" style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="link">Redirect / Post External Link (Optional)</label>
            <input
              type="text"
              id="link"
              name="link"
              defaultValue={editPost?.link || ""}
              placeholder="e.g. https://petstore.co.ke/my-post (leave blank to use local post slug)"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <label htmlFor="slug">Post URL Slug (Auto-generated from title if blank)</label>
            <input
              type="text"
              id="slug"
              name="slug"
              defaultValue={editPost?.slug || (editPost?.link ? editPost.link.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "") : "")}
              placeholder="e.g. why-the-towerspeaker-240w-is-the-best"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <label htmlFor="content" style={{ marginBottom: "8px", display: "block" }}>Post Body Content (HTML allowed)</label>
            <VisualCodeEditor
              name="content"
              value={contentVal}
              onChange={setContentVal}
              placeholder="Write the full body content of your article here... HTML formatting tags are supported."
              rows={16}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-row">
              <label htmlFor="tag">Category</label>
              <select id="tag" name="tag" defaultValue={editPost?.tag || "Audio"} className="filter-select">
                {categories.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="status">Publish Status</label>
              <select id="status" name="status" defaultValue={editPost?.status || "publish"} className="filter-select">
                <option value="publish">Published</option>
                <option value="draft">Draft</option>
                <option value="trash">Trash</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="date">Publish Date</label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              defaultValue={editPost?.date ? new Date(editPost.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
              required
              className="form-input"
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "10px", alignItems: "center" }}>
            <button type="submit" className="btn-primary">
              💾 Save Blog Post
            </button>
            {currentView === "edit" && editPost && (
              <button
                type="button"
                className="btn-secondary"
                style={{ backgroundColor: "rgba(255, 51, 51, 0.15)", color: "#ff3333", borderColor: "rgba(255, 51, 51, 0.3)" }}
                onClick={() => handleTrash(editPost.id)}
              >
                🗑️ Delete Post
              </button>
            )}
            <a href="/store_backend/posts?view=all" className="btn-secondary" style={{ textDecoration: "none", textAlign: "center" }}>
              Cancel
            </a>
          </div>
        </Form>
      )}

      {/* VIEW: CATEGORIES */}
      {currentView === "categories" && (
        <div className="split-layout">
          <div className="split-left">
            <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#fff", marginBottom: "4px" }}>Add New Category</h4>
            <Form method="post" onSubmit={async (e) => {
              e.preventDefault();
              const body = new FormData(e.currentTarget);
              body.append("intent", "add_category");
              await fetch(window.location.href, { method: "POST", body });
              window.location.reload();
            }}>
              <div className="form-row" style={{ marginBottom: "12px" }}>
                <label>Name</label>
                <input type="text" name="name" required placeholder="e.g. Accessories" className="form-input" />
              </div>
              <div className="form-row" style={{ marginBottom: "12px" }}>
                <label>Slug</label>
                <input type="text" name="slug" placeholder="e.g. accessories" className="form-input" />
              </div>
              <div className="form-row" style={{ marginBottom: "16px" }}>
                <label>Description</label>
                <textarea name="description" rows={3} placeholder="Provide category info..." className="form-textarea" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                📁 Add Category
              </button>
            </Form>
          </div>

          <div className="posts-table-wrap">
            <table className="posts-table">
              <thead>
                <tr>
                  <th onClick={() => handleCatSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Name {renderCatSortIndicator("name")}
                  </th>
                  <th onClick={() => handleCatSort("slug")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Slug {renderCatSortIndicator("slug")}
                  </th>
                  <th onClick={() => handleCatSort("description")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Description {renderCatSortIndicator("description")}
                  </th>
                  <th onClick={() => handleCatSort("count")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Post Count {renderCatSortIndicator("count")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <div className="post-title-cell">{c.name}</div>
                      {c.slug !== "audio" && c.slug !== "tvs" && (
                        <div className="row-actions">
                          <button type="button" onClick={() => handleDeleteCategory(c.id, c.name)} className="action-link trash-action">
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                    <td>{c.slug}</td>
                    <td>{c.description || "—"}</td>
                    <td>{c.count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: TAGS */}
      {currentView === "tags" && (
        <div className="split-layout">
          <div className="split-left">
            <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#fff", marginBottom: "4px" }}>Add New Tag</h4>
            <Form method="post" onSubmit={async (e) => {
              e.preventDefault();
              const body = new FormData(e.currentTarget);
              body.append("intent", "add_tag");
              await fetch(window.location.href, { method: "POST", body });
              window.location.reload();
            }}>
              <div className="form-row" style={{ marginBottom: "12px" }}>
                <label>Name</label>
                <input type="text" name="name" required placeholder="e.g. Flash Sale" className="form-input" />
              </div>
              <div className="form-row" style={{ marginBottom: "12px" }}>
                <label>Slug</label>
                <input type="text" name="slug" placeholder="e.g. flash-sale" className="form-input" />
              </div>
              <div className="form-row" style={{ marginBottom: "16px" }}>
                <label>Description</label>
                <textarea name="description" rows={3} placeholder="Provide tag details..." className="form-textarea" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                🏷️ Add Tag
              </button>
            </Form>
          </div>

          <div className="posts-table-wrap">
            <table className="posts-table">
              <thead>
                <tr>
                  <th onClick={() => handleTagSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Name {renderTagSortIndicator("name")}
                  </th>
                  <th onClick={() => handleTagSort("slug")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Slug {renderTagSortIndicator("slug")}
                  </th>
                  <th onClick={() => handleTagSort("description")} style={{ cursor: "pointer", userSelect: "none" }}>
                    Description {renderTagSortIndicator("description")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTags.map((t: any) => (
                  <tr key={t.id}>
                    <td>
                      <div className="post-title-cell">{t.name}</div>
                      <div className="row-actions">
                        <button type="button" onClick={() => handleDeleteTag(t.id, t.name)} className="action-link trash-action">
                          Delete
                        </button>
                      </div>
                    </td>
                    <td>{t.slug}</td>
                    <td>{t.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK EDIT MODAL */}
      {quickEditPost && (
        <div className="modal-overlay">
          <Form method="post" onSubmit={handleQuickEditSave} className="modal-card">
            <input type="hidden" name="intent" value="quick_edit" />
            <input type="hidden" name="id" value={quickEditPost.id} />

            <div className="modal-header">
              <h4 style={{ fontSize: "15px", fontWeight: "600", color: "#fff" }}>Quick Edit: {quickEditPost.title}</h4>
              <button type="button" onClick={() => setQuickEditPost(null)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "16px" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-row">
                <label>Post Redirect Link (Optional)</label>
                <input type="text" name="link" defaultValue={quickEditPost.link || ""} className="form-input" />
              </div>

              <div className="form-row">
                <label>Post Slug</label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={quickEditPost.slug || (quickEditPost.link ? quickEditPost.link.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "") : "")}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <label>Category</label>
                <select name="tag" defaultValue={quickEditPost.tag} className="filter-select">
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Publish Status</label>
                <select name="status" defaultValue={quickEditPost.status} className="filter-select">
                  <option value="publish">Published</option>
                  <option value="draft">Draft</option>
                  <option value="trash">Trash</option>
                </select>
              </div>

              <div className="form-row">
                <label>Date</label>
                <input type="datetime-local" name="date" defaultValue={new Date(quickEditPost.date).toISOString().slice(0, 16)} required className="form-input" />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button type="button" onClick={() => setQuickEditPost(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update Post
              </button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}
