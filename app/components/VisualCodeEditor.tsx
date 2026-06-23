import React, { useState, useEffect, useRef } from "react";

interface VisualCodeEditorProps {
  name: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

const EXISTING_CONTENT = [
  { title: "Home Page", url: "/" },
  { title: "Shop Storefront", url: "/shop" },
  { title: "About Us", url: "/about" },
  { title: "Support / Contact Us", url: "/support" },
  { title: "Lipia Pole Pole (Installments)", url: "/lipiapolepole" },
  { title: "My Account Dashboard", url: "/my-account" },
  { title: "Shopping Cart", url: "/cart" },
  { title: "Checkout Page", url: "/checkout" },
  { title: "Televisions Category", url: "/televisions" },
  { title: "Refrigerators Category", url: "/shop/refrigerators" },
  { title: "Home Audio Systems", url: "/home-audio" },
  { title: "Portable Audio Devices", url: "/portable-audio" },
  { title: "Accessories Category", url: "/accessories" },
  { title: "Extended Warranty", url: "/extended-warranty" },
  { title: "Giveaway Terms", url: "/giveaway-terms" },
  { title: "Promotion Terms", url: "/promotion-terms" }
];

export default function VisualCodeEditor({
  name,
  value,
  onChange,
  placeholder,
  rows = 12,
}: VisualCodeEditorProps) {
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEditingRef = useRef(false);

  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");

  // Advanced link options state
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Inline Link Popup State
  const [showInlineLinkPopup, setShowInlineLinkPopup] = useState(false);
  const [inlineLinkUrl, setInlineLinkUrl] = useState("");
  const [inlineLinkText, setInlineLinkText] = useState("");
  const [inlineLinkPopupPos, setInlineLinkPopupPos] = useState({ top: 0, left: 0 });

  const savedRangeRef = useRef<Range | null>(null);
  const inlineLinkPopupRef = useRef<HTMLDivElement>(null);

  // Close inline link popup when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (
        showInlineLinkPopup &&
        inlineLinkPopupRef.current &&
        !inlineLinkPopupRef.current.contains(e.target as Node) &&
        editorRef.current &&
        !editorRef.current.contains(e.target as Node)
      ) {
        setShowInlineLinkPopup(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [showInlineLinkPopup]);

  // Keep Visual editor content in sync with the value prop (only when not typing)
  useEffect(() => {
    if (mode === "visual" && editorRef.current && !isEditingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [mode, value]);

  const triggerChange = (val: string) => {
    onChange(val);
  };

  const handleVisualInput = (e: React.FormEvent<HTMLDivElement>) => {
    isEditingRef.current = true;
    triggerChange(e.currentTarget.innerHTML);
  };

  const handleVisualBlur = () => {
    isEditingRef.current = false;
  };

  const saveSelectionBeforeColor = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  // Visual formatting command execution
  const execCommand = (command: string, arg: string | undefined = undefined) => {
    restoreSelection();
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      triggerChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Tab") {
      e.preventDefault(); // Prevent page jumping
      
      if (mode === "visual") {
        // Check if cursor is in a list
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          let node = selection.anchorNode;
          let inList = false;
          while (node && node !== editorRef.current) {
            if (node.nodeName === "LI" || node.nodeName === "UL" || node.nodeName === "OL") {
              inList = true;
              break;
            }
            node = node.parentNode;
          }
          
          if (inList) {
            if (e.shiftKey) {
              execCommand("outdent");
            } else {
              execCommand("indent");
            }
          } else {
            // Not in a list: insert 4 non-breaking spaces
            document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
          }
        }
      } else {
        // Code mode
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const val = textarea.value;
          const tab = "\t";
          
          const newValue = val.substring(0, start) + tab + val.substring(end);
          triggerChange(newValue);
          
          // Reset cursor position
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + tab.length, start + tab.length);
          }, 0);
        }
      }
    }
  };

  // Code Mode helper: Insert markup at cursor selection in textarea
  const insertCodeMarkup = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    const replacement = before + selectedText + after;
    const newValue = currentText.substring(0, start) + replacement + currentText.substring(end);
    triggerChange(newValue);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  // Close unclosed tags in Code Mode
  const handleCloseTags = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const text = textarea.value;
    
    // Simple stack-based parser to find unclosed HTML tags
    const stack: string[] = [];
    const tagRegex = /<\/?([a-zA-Z1-6]+)(?:\s+[^>]*)*>/g;
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();
      
      // Ignore self-closing or empty-type tags
      if (
        fullTag.endsWith("/>") || 
        ["img", "br", "hr", "input", "meta", "link", "source", "embed"].includes(tagName)
      ) {
        continue;
      }
      
      if (fullTag.startsWith("</")) {
        const index = stack.lastIndexOf(tagName);
        if (index !== -1) {
          stack.splice(index, 1);
        }
      } else {
        stack.push(tagName);
      }
    }
    
    if (stack.length === 0) return;
    
    // Close in reverse order
    const closingStr = stack.reverse().map(t => `</${t}>`).join("");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = text.substring(0, start) + closingStr + text.substring(end);
    triggerChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + closingStr.length, start + closingStr.length);
    }, 0);
  };

  // Restore selection helper
  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
    }
  };

  // Selection change handler for inline link popup
  const handleEditorSelectionChange = () => {
    if (mode !== "visual") return;
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && editorRef.current) {
        let node = selection.anchorNode;
        let isInside = false;
        while (node) {
          if (node === editorRef.current) {
            isInside = true;
            break;
          }
          node = node.parentNode;
        }

        if (isInside && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          savedRangeRef.current = range.cloneRange();
          
          if (selection.isCollapsed) {
            // If selection is collapsed, only hide if active element is not within the popup itself
            if (
              !inlineLinkPopupRef.current ||
              !inlineLinkPopupRef.current.contains(document.activeElement)
            ) {
              setShowInlineLinkPopup(false);
            }
          }
        }
      }
    }, 0);
  };

  // Apply inline link directly
  const handleApplyInlineLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineLinkUrl) return;

    restoreSelection();

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const content = range.extractContents();
      const a = document.createElement("a");
      a.href = inlineLinkUrl.trim();
      a.target = openInNewTab ? "_blank" : "_self";
      a.rel = "noopener noreferrer";
      a.appendChild(content);
      range.insertNode(a);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNode(a);
      selection.addRange(newRange);
    } else {
      const aHTML = `<a href="${inlineLinkUrl.trim()}" target="${openInNewTab ? "_blank" : "_self"}" rel="noopener noreferrer">${inlineLinkText || inlineLinkUrl}</a>`;
      document.execCommand("insertHTML", false, aHTML);
    }

    if (editorRef.current) {
      triggerChange(editorRef.current.innerHTML);
    }

    setShowInlineLinkPopup(false);
    setInlineLinkUrl("");
  };

  // Modal Submissions
  const submitLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;

    restoreSelection();

    if (mode === "visual") {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const content = range.extractContents();
        const a = document.createElement("a");
        a.href = linkUrl.trim();
        a.target = openInNewTab ? "_blank" : "_self";
        a.rel = "noopener noreferrer";
        a.appendChild(content);
        range.insertNode(a);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNode(a);
        selection.addRange(newRange);
      } else {
        const aHTML = `<a href="${linkUrl.trim()}" target="${openInNewTab ? "_blank" : "_self"}" rel="noopener noreferrer">${linkText || linkUrl}</a>`;
        document.execCommand("insertHTML", false, aHTML);
      }
      if (editorRef.current) {
        triggerChange(editorRef.current.innerHTML);
      }
    } else {
      // Code mode
      const openTag = `<a href="${linkUrl.trim()}" target="${openInNewTab ? "_blank" : "_self"}" rel="noopener noreferrer">`;
      const closeTag = `</a>`;
      insertCodeMarkup(openTag, closeTag);
    }

    setLinkUrl("");
    setLinkText("");
    setShowLinkModal(false);
  };

  const submitMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return;

    if (mode === "visual") {
      if (editorRef.current) {
        editorRef.current.focus();
        const imgHTML = `<img src="${mediaUrl}" alt="${mediaAlt || ""}" style="max-width:100%; height:auto; border-radius:8px;" />`;
        document.execCommand("insertHTML", false, imgHTML);
        triggerChange(editorRef.current.innerHTML);
      }
    } else {
      const imgHTML = `<img src="${mediaUrl}" alt="${mediaAlt || ""}" style="max-width:100%; height:auto; border-radius:8px;" />`;
      insertCodeMarkup(imgHTML);
    }

    setMediaUrl("");
    setMediaAlt("");
    setShowMediaModal(false);
  };

  return (
    <div 
      className={`vp-html-editor ${isFullscreen ? "fullscreen-active" : ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        overflow: isFullscreen ? "hidden" : "visible",
        background: "#0d0d14",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        width: isFullscreen ? "100vw" : "100%",
        height: isFullscreen ? "100vh" : "auto",
        zIndex: isFullscreen ? 99999 : 1,
        boxShadow: isFullscreen ? "0 0 50px rgba(0,0,0,0.8)" : "none",
        transition: "all 0.2s ease"
      }}
    >
      <style>{`
        .vp-editor-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
          user-select: none;
        }
        .vp-editor-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.15);
        }
        .vp-editor-btn:active {
          transform: translateY(1px);
        }
        .vp-tab-btn {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }
        .vp-tab-btn.active {
          color: #ff4d62;
          border-bottom-color: #ff4d62;
          background: rgba(255, 77, 98, 0.03);
        }
        .vp-editor-toolbar-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.01);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vp-editor-toolbar-separator {
          width: 1px;
          height: 18px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 4px;
        }
        .vp-visual-textarea ul {
          list-style-type: disc !important;
          margin-left: 20px !important;
          margin-bottom: 14px !important;
          padding-left: 10px !important;
        }
        .vp-visual-textarea ol {
          list-style-type: decimal !important;
          margin-left: 20px !important;
          margin-bottom: 14px !important;
          padding-left: 10px !important;
        }
        .vp-visual-textarea li {
          margin-bottom: 6px !important;
          color: #e2e8f0 !important;
          line-height: 1.6;
        }
        .vp-visual-textarea p {
          margin-bottom: 14px !important;
          line-height: 1.6 !important;
          color: #e2e8f0 !important;
        }
        .vp-visual-textarea a {
          color: #ff4d62 !important;
          text-decoration: underline !important;
          cursor: pointer;
        }
        .vp-visual-textarea h1, .vp-visual-textarea h2, .vp-visual-textarea h3, 
        .vp-visual-textarea h4, .vp-visual-textarea h5, .vp-visual-textarea h6 {
          color: #fff !important;
          font-weight: 600 !important;
          margin-top: 18px !important;
          margin-bottom: 10px !important;
          line-height: 1.4 !important;
        }
        .vp-visual-textarea h1 { font-size: 2em !important; }
        .vp-visual-textarea h2 { font-size: 1.5em !important; }
        .vp-visual-textarea h3 { font-size: 1.25em !important; }
        .vp-visual-textarea blockquote {
          border-left: 4px solid #ff4d62 !important;
          background: rgba(255, 255, 255, 0.02) !important;
          padding: 12px 20px !important;
          margin: 14px 0 !important;
          font-style: italic !important;
          color: #cbd5e1 !important;
        }
        .vp-visual-textarea pre {
          background: #09090d !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 12px !important;
          border-radius: 6px !important;
          font-family: monospace !important;
          font-size: 13px !important;
          overflow-x: auto !important;
          color: #a7f3d0 !important;
        }
        .vp-visual-textarea:empty::before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.35) !important;
          font-style: italic;
        }
        .vp-dropdown {
          background: #09090d;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }
        .vp-dropdown option {
          background: #0d0d14;
          color: #fff;
        }
        .vp-editor-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          animation: fadeIn 0.2s ease-out;
        }
        .vp-editor-modal {
          background: #12121a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 24px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .vp-modal-title {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          margin-top: 0;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 8px;
        }
        .vp-modal-field {
          margin-bottom: 14px;
        }
        .vp-modal-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin-bottom: 6px;
        }
        .vp-modal-field input {
          width: 100%;
          background: #08080c;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          padding: 8px 12px;
          color: #fff;
          font-size: 13px;
          outline: none;
        }
        .vp-modal-field input:focus {
          border-color: #ff4d62;
        }
        .vp-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Sticky Header/Toolbar Container */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 90,
          background: "#0d0d14",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px"
        }}
      >
        {/* Top Header Row: External Tools & Mode Tabs */}
        <div 
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 12px",
            background: "rgba(255, 255, 255, 0.02)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          {/* Left Side: Media & Shortcodes */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <button 
              type="button" 
              className="vp-editor-btn"
              onClick={() => setShowMediaModal(true)}
              style={{ borderColor: "rgba(56, 189, 248, 0.3)", color: "#38bdf8" }}
            >
              🖼️ Add Media
            </button>
          </div>

          {/* Right Side: Tab Buttons */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.15)", borderRadius: "6px", padding: "2px" }}>
            <button
              type="button"
              className={`vp-tab-btn ${mode === "visual" ? "active" : ""}`}
              style={{ borderRadius: "4px 0 0 4px" }}
              onClick={() => setMode("visual")}
            >
              Visual
            </button>
            <button
              type="button"
              className={`vp-tab-btn ${mode === "code" ? "active" : ""}`}
              style={{ borderRadius: "0 4px 4px 0" }}
              onClick={() => setMode("code")}
            >
              Code
            </button>
          </div>
        </div>

        {/* Editor Toolbar (Conditional on Mode) */}
        {mode === "visual" ? (
          <div className="vp-editor-toolbar-row">
            {/* Format block dropdown */}
            <select 
              className="vp-dropdown"
              onChange={(e) => execCommand("formatBlock", e.target.value)}
              defaultValue="<p>"
            >
              <option value="<p>">Paragraph</option>
              <option value="<h1>">Heading 1</option>
              <option value="<h2>">Heading 2</option>
              <option value="<h3>">Heading 3</option>
              <option value="<h4>">Heading 4</option>
              <option value="<h5>">Heading 5</option>
              <option value="<h6>">Heading 6</option>
              <option value="<pre>">Preformatted</option>
              <option value="<blockquote>">Blockquote</option>
            </select>

            <div className="vp-editor-toolbar-separator" />

            {/* Text Style formatting */}
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "4px 8px", fontWeight: "bold" }}
              onClick={() => execCommand("bold")}
              title="Bold"
            >
              B
            </button>
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "4px 8px", fontStyle: "italic" }}
              onClick={() => execCommand("italic")}
              title="Italic"
            >
              I
            </button>
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "4px 8px", textDecoration: "underline" }}
              onClick={() => execCommand("underline")}
              title="Underline"
            >
              U
            </button>
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "4px 8px", textDecoration: "line-through" }}
              onClick={() => execCommand("strikeThrough")}
              title="Strikethrough"
            >
              S
            </button>

            <div className="vp-editor-toolbar-separator" />

            {/* List items */}
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => execCommand("insertUnorderedList")}
              title="Bullet List"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => execCommand("insertOrderedList")}
              title="Numbered List"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="10" y1="6" x2="21" y2="6"></line>
                <line x1="10" y1="12" x2="21" y2="12"></line>
                <line x1="10" y1="18" x2="21" y2="18"></line>
                <path d="M4 6h1v4"></path>
                <path d="M4 10h2"></path>
                <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
              </svg>
            </button>
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => execCommand("formatBlock", "<blockquote>")}
              title="Blockquote"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
              </svg>
            </button>

            <div className="vp-editor-toolbar-separator" />

            {/* Alignment */}
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => execCommand("justifyLeft")}
              title="Align Left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="17" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="17" y1="18" x2="3" y2="18"></line>
              </svg>
            </button>
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => execCommand("justifyCenter")}
              title="Align Center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="10" x2="6" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="18" y1="18" x2="6" y2="18"></line>
              </svg>
            </button>
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => execCommand("justifyRight")}
              title="Align Right"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="21" y1="10" x2="7" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="7" y2="18"></line>
              </svg>
            </button>
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => execCommand("justifyFull")}
              title="Justify"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="21" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="3" y2="18"></line>
              </svg>
            </button>

            <div className="vp-editor-toolbar-separator" />

            {/* Link actions */}
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#60a5fa" }}
              onClick={() => {
                restoreSelection();
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) {
                  setLinkText(selection.toString());
                  const range = selection.getRangeAt(0);
                  const rects = range.getClientRects();
                  if (rects.length > 0) {
                    const rect = rects[rects.length - 1];
                    const editorRect = editorRef.current?.getBoundingClientRect();
                    if (editorRect && editorRef.current) {
                      setInlineLinkPopupPos({
                        top: rect.bottom - editorRect.top + editorRef.current.scrollTop + 8,
                        left: Math.max(0, rect.left - editorRect.left)
                      });
                    }
                  }
                  setInlineLinkText(selection.toString());
                  setShowInlineLinkPopup(true);
                } else if (savedRangeRef.current && !savedRangeRef.current.collapsed) {
                  const range = savedRangeRef.current;
                  const text = range.toString();
                  setLinkText(text);
                  setInlineLinkText(text);
                  const rects = range.getClientRects();
                  if (rects.length > 0) {
                    const rect = rects[rects.length - 1];
                    const editorRect = editorRef.current?.getBoundingClientRect();
                    if (editorRect && editorRef.current) {
                      setInlineLinkPopupPos({
                        top: rect.bottom - editorRect.top + editorRef.current.scrollTop + 8,
                        left: Math.max(0, rect.left - editorRect.left)
                      });
                    }
                  }
                  setShowInlineLinkPopup(true);
                } else {
                  setShowLinkModal(true);
                }
              }}
              title="Insert Link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>

            <div className="vp-editor-toolbar-separator" />

            {/* Color pickers */}
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Color:</span>
            <input 
              type="color" 
              onMouseDown={saveSelectionBeforeColor}
              onChange={(e) => execCommand("foreColor", e.target.value)} 
              style={{ width: "24px", height: "20px", border: "none", cursor: "pointer", background: "transparent", padding: 0 }}
              title="Text Color"
            />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Highlight:</span>
            <input 
              type="color" 
              onMouseDown={saveSelectionBeforeColor}
              onChange={(e) => execCommand("backColor", e.target.value)} 
              style={{ width: "24px", height: "20px", border: "none", cursor: "pointer", background: "transparent", padding: 0 }}
              title="Highlight Color"
            />

            <div className="vp-editor-toolbar-separator" />

            {/* Misc */}
            <button 
              type="button" 
              className="vp-editor-btn" 
              style={{ padding: "4px 8px" }}
              onClick={() => execCommand("removeFormat")}
              title="Clear Formatting"
            >
              🧹 Clear
            </button>

            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
              <button 
                type="button" 
                className="vp-editor-btn" 
                style={{ padding: "4px 8px" }}
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? "🗜️ Exit Full" : "📺 Fullscreen"}
              </button>
            </div>
          </div>
        ) : (
          /* Code Mode Toolbar */
          <div className="vp-editor-toolbar-row">
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<strong>", "</strong>")} title="Bold">b</button>
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<em>", "</em>")} title="Italic">i</button>
            <button type="button" className="vp-editor-btn" onClick={() => setShowLinkModal(true)} title="Link">link</button>
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<blockquote>", "</blockquote>")} title="Blockquote">b-quote</button>
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<del>", "</del>")} title="Delete tag">del</button>
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<ins>", "</ins>")} title="Insert tag">ins</button>
            <button type="button" className="vp-editor-btn" onClick={() => setShowMediaModal(true)} title="Insert Image">img</button>
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<ul>\n\t<li>", "</li>\n</ul>")} title="Unordered list">ul</button>
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<ol>\n\t<li>", "</li>\n</ol>")} title="Ordered list">ol</button>
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<li>", "</li>")} title="List item">li</button>
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<code>", "</code>")} title="Code tag">code</button>
            <button type="button" className="vp-editor-btn" onClick={() => insertCodeMarkup("<!--more-->")} title="More tag">more</button>
            <button type="button" className="vp-editor-btn" onClick={handleCloseTags} title="Close open tags">close tags</button>

            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
              <button 
                type="button" 
                className="vp-editor-btn" 
                style={{ padding: "4px 8px" }}
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? "🗜️ Exit Full" : "📺 Fullscreen"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, position: "relative", minHeight: isFullscreen ? "calc(100vh - 100px)" : `${rows * 22}px` }}>
        {mode === "code" ? (
          <textarea
            ref={textareaRef}
            name={name}
            value={value}
            onChange={(e) => triggerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              width: "100%",
              height: "100%",
              minHeight: isFullscreen ? "calc(100vh - 100px)" : `${rows * 22}px`,
              background: "#07070a",
              color: "#e2e8f0",
              fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
              fontSize: "13px",
              padding: "16px",
              border: "none",
              outline: "none",
              resize: isFullscreen ? "none" : "vertical",
              display: "block",
              lineHeight: "1.6"
            }}
          />
        ) : (
          <>
            {/* Native fallback form field to hold the value */}
            <input type="hidden" name={name} value={value} />
            <div
              ref={editorRef}
              contentEditable
              onInput={handleVisualInput}
              onBlur={handleVisualBlur}
              onMouseUp={handleEditorSelectionChange}
              onKeyUp={handleEditorSelectionChange}
              onKeyDown={handleKeyDown}
              data-placeholder={placeholder}
              className="vp-visual-textarea"
              style={{
                width: "100%",
                height: "100%",
                minHeight: isFullscreen ? "calc(100vh - 100px)" : `${rows * 22}px`,
                background: "#0a0a0f",
                color: "#e2e8f0",
                padding: "16px",
                outline: "none",
                overflowY: "auto",
                fontSize: "14px",
                lineHeight: "1.6"
              }}
            />
          </>
        )}
      </div>

      {/* FOOTER BAR */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "6px 12px", 
          background: "rgba(0, 0, 0, 0.3)", 
          borderTop: "1px solid rgba(255,255,255,0.06)", 
          fontSize: "11px", 
          color: "rgba(255, 255, 255, 0.4)" 
        }}
      >
        <span>Mode: <strong>{mode.toUpperCase()}</strong></span>
        <span>Word Count: {(value || "").replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length}</span>
      </div>

      {/* Inline Link Popup */}
      {showInlineLinkPopup && (
        <div
          ref={inlineLinkPopupRef}
          style={{
            position: "absolute",
            top: `${inlineLinkPopupPos.top}px`,
            left: `${inlineLinkPopupPos.left}px`,
            zIndex: 95,
            background: "#12121a",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "6px",
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
            animation: "fadeIn 0.15s ease-out"
          }}
        >
          <input
            type="text"
            placeholder="Paste URL or type to search"
            value={inlineLinkUrl}
            onChange={(e) => setInlineLinkUrl(e.target.value)}
            style={{
              background: "#08080c",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              padding: "5px 8px",
              color: "#fff",
              fontSize: "12px",
              outline: "none",
              width: "200px"
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleApplyInlineLink(e);
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleApplyInlineLink}
            style={{
              background: "#2563eb",
              border: "none",
              borderRadius: "4px",
              color: "#fff",
              padding: "5px 10px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setLinkUrl(inlineLinkUrl);
              setLinkText(inlineLinkText);
              setShowInlineLinkPopup(false);
              setShowLinkModal(true);
            }}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "14px",
              cursor: "pointer",
              padding: "2px 4px",
              color: "rgba(255,255,255,0.7)"
            }}
            title="Link options"
          >
            ⚙️
          </button>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Insert/edit link Modal */}
      {showLinkModal && (
        <div className="vp-editor-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <form 
            className="vp-editor-modal" 
            style={{ maxWidth: "500px", width: "90%" }} 
            onClick={(e) => e.stopPropagation()} 
            onSubmit={submitLink}
          >
            <h4 className="vp-modal-title">🔗 Insert/edit link</h4>
            
            <div className="vp-modal-field">
              <label>URL</label>
              <input 
                type="text" 
                placeholder="https://example.com" 
                value={linkUrl} 
                onChange={(e) => setLinkUrl(e.target.value)} 
                required 
                autoFocus
              />
            </div>
            
            <div className="vp-modal-field">
              <label>Link Text</label>
              <input 
                type="text" 
                placeholder="ABOUT US" 
                value={linkText} 
                onChange={(e) => setLinkText(e.target.value)} 
              />
            </div>

            <div className="vp-modal-field" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", marginBottom: "16px" }}>
              <input 
                type="checkbox" 
                id="openInNewTabCheckbox"
                checked={openInNewTab} 
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                style={{ width: "auto", cursor: "pointer" }}
              />
              <label htmlFor="openInNewTabCheckbox" style={{ margin: 0, cursor: "pointer", fontSize: "12px" }}>Open link in a new tab</label>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", marginTop: "16px" }}>
              <h5 style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.5)", margin: "0 0 10px 0", textTransform: "uppercase" }}>Or link to existing content</h5>
              
              <div className="vp-modal-field" style={{ marginBottom: "10px" }}>
                <input 
                  type="text" 
                  placeholder="Search existing pages/products..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: "12px", padding: "6px 10px" }}
                />
              </div>

              <div 
                style={{ 
                  maxHeight: "150px", 
                  overflowY: "auto", 
                  border: "1px solid rgba(255,255,255,0.08)", 
                  borderRadius: "6px",
                  background: "#08080c"
                }}
              >
                {EXISTING_CONTENT
                  .filter(item => 
                    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    item.url.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setLinkUrl(item.url);
                        if (!linkText) {
                          setLinkText(item.title);
                        }
                      }}
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <span style={{ color: "#fff", fontWeight: "500" }}>{item.title}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>{item.url}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="vp-modal-actions" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", marginTop: "16px" }}>
              <button type="button" className="vp-editor-btn" onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button type="submit" className="vp-editor-btn" style={{ background: "#ff4d62", color: "#fff", borderColor: "#ff4d62" }}>Add Link</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Media Modal */}
      {showMediaModal && (
        <div className="vp-editor-modal-overlay" onClick={() => setShowMediaModal(false)}>
          <form className="vp-editor-modal" onClick={(e) => e.stopPropagation()} onSubmit={submitMedia}>
            <h4 className="vp-modal-title">🖼️ Insert Image Media</h4>
            <div className="vp-modal-field">
              <label>Image URL</label>
              <input 
                type="text" 
                placeholder="https://petstore.co.ke/wp-content/uploads/..." 
                value={mediaUrl} 
                onChange={(e) => setMediaUrl(e.target.value)} 
                required 
                autoFocus
              />
            </div>
            <div className="vp-modal-field">
              <label>Alt Text (Alternative text for SEO)</label>
              <input 
                type="text" 
                placeholder="e.g. Bonnie Adult Dog Food - Beef 15kg" 
                value={mediaAlt} 
                onChange={(e) => setMediaAlt(e.target.value)} 
              />
            </div>
            <div className="vp-modal-actions">
              <button type="button" className="vp-editor-btn" onClick={() => setShowMediaModal(false)}>Cancel</button>
              <button type="submit" className="vp-editor-btn" style={{ background: "#38bdf8", color: "#fff", borderColor: "#38bdf8" }}>Insert Media</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
