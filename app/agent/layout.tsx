"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/agent", label: "Dashboard", icon: "📊" },
  { href: "/agent/explore", label: "Explore Inventory", icon: "🏘️" },
  { href: "/agent/properties", label: "My Properties", icon: "🏠" },
  { href: "/agent/properties/add", label: "Add Property", icon: "➕" },
  { href: "/agent/search", label: "Search", icon: "🔍" },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (sidebarOpen && isMobile) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const currentPage = navLinks.find(l => l.href === pathname)?.label
    || (pathname.includes("/add") ? "Add Property"
      : pathname.includes("/edit") ? "Edit Property" : "Agent Portal");

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh" }}>

      {/* ── Hamburger (mobile only) ── */}
      <button
        className="hamburger"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* ── Mobile top bar ── */}
      <div className="mobile-topbar">
        <span className="mobile-topbar-title" style={{ color: "#818cf8" }}>🏢 {currentPage}</span>
      </div>

      {/* ── Backdrop (mobile) ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(2px)",
            zIndex: 199,
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: "100%",
        }}>

          {/* Logo */}
          <div className="sidebar-logo" style={{ flexShrink: 0 }}>
            <span style={{
              width: 36, height: 36,
              background: "linear-gradient(135deg,#1a3a5c,#0f2236)",
              borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "1.1rem",
              border: "1px solid rgba(99,102,241,0.3)", flexShrink: 0,
            }}>🏢</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#f0f4f8", lineHeight: 1.2 }}>Property Hub</div>
              <div style={{ fontSize: "0.7rem", color: "#818cf8" }}>Agent Portal</div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <div className="section-title" style={{ paddingLeft: "0.75rem" }}>Navigation</div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? "active" : ""}`}
                style={pathname === link.href ? { color: "#818cf8", background: "rgba(99,102,241,0.12)" } : {}}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User info + logout */}
          <div style={{ flexShrink: 0, padding: "1rem 0 0" }}>
            <div style={{
              padding: "0.75rem 1rem",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 8, marginBottom: "0.75rem",
            }}>
              <div style={{ fontSize: "0.7rem", color: "#8899aa" }}>Logged in as</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#818cf8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.user?.name}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.user?.email}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                width: "100%", padding: "0.6rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8, color: "#ef4444",
                cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s",
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">{children}</main>
    </div>
  );
}
