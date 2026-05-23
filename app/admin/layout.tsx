"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/agents", label: "Agents", icon: "👥" },
  { href: "/admin/properties", label: "All Properties", icon: "🏠" },
  { href: "/admin/sectors", label: "Sectors & Areas", icon: "📍" },
  { href: "/admin/backup", label: "Backup & Recovery", icon: "💾" },
  { href: "/admin/activity", label: "Activity Logs", icon: "👁️" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Close on ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (sidebarOpen && isMobile) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const currentPage = navLinks.find(l => l.href === pathname)?.label || "Dashboard";
  const sessionUser = session?.user as { name?: string; isSuperAdmin?: boolean } | undefined;

  const SidebarContent = () => (
    <>
      <div className="sidebar-logo">
        <span style={{
          width: "36px", height: "36px",
          background: "linear-gradient(135deg, #1a3a5c, #0f2236)",
          borderRadius: "8px", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "1.1rem",
          border: "1px solid rgba(200,167,80,0.3)", flexShrink: 0,
        }}>🏢</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#f0f4f8", lineHeight: 1.2 }}>Property Hub</div>
          <div style={{ fontSize: "0.7rem", color: "#c8a750" }}>Admin Panel</div>
        </div>
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <div className="section-title" style={{ paddingLeft: "0.75rem" }}>Navigation</div>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? "active" : ""}`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: "1.5rem", left: "1rem", right: "1rem" }}>
        <div style={{
          padding: "0.75rem 1rem",
          background: "rgba(200,167,80,0.08)",
          border: "1px solid rgba(200,167,80,0.15)",
          borderRadius: "8px", marginBottom: "0.75rem",
        }}>
          <div style={{ fontSize: "0.7rem", color: "#8899aa" }}>Logged in as</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#c8a750", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sessionUser?.isSuperAdmin ? "👑 Super Admin" : "Administrator"}
          </div>
          {sessionUser?.name && (
            <div style={{ fontSize: "0.72rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sessionUser.name}
            </div>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%", padding: "0.6rem",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px", color: "#ef4444",
            cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh" }}>

      {/* ── Hamburger button (mobile) ── */}
      <button
        className="hamburger"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* ── Mobile top-bar ── */}
      <div className="mobile-topbar">
        <span className="mobile-topbar-title">🏢 {currentPage}</span>
      </div>

      {/* ── Overlay (mobile) ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
