"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ya password galat hai. Dobara koshish karein.");
      setLoading(false);
      return;
    }

    // Fetch session to know role
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/agent");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0a0f1a 0%, #0f1928 50%, #0a0f1a 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(26,58,92,0.4) 0%, transparent 70%)",
        top: "-200px",
        right: "-100px",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,167,80,0.08) 0%, transparent 70%)",
        bottom: "-100px",
        left: "-100px",
        pointerEvents: "none",
      }} />

      <div className="animate-fade-in" style={{ width: "100%", maxWidth: "440px", padding: "1rem" }}>
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #1a3a5c, #0f2236)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
            margin: "0 auto 1rem",
            border: "1px solid rgba(200,167,80,0.3)",
            boxShadow: "0 0 30px rgba(200,167,80,0.1)",
          }}>
            🏢
          </div>
          <h1 style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#f0f4f8",
            letterSpacing: "-0.5px",
            marginBottom: "0.4rem",
          }}>
            Islamabad Property Hub
          </h1>
          <p style={{ color: "#8899aa", fontSize: "0.875rem" }}>
            Agent Inventory Platform — Authorized Access Only
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: "rgba(15, 25, 40, 0.9)",
          border: "1px solid rgba(200,167,80,0.2)",
          borderRadius: "16px",
          padding: "2rem",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#f0f4f8",
            marginBottom: "1.5rem",
          }}>
            Sign In to Your Account
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="agent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="login-email"
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="login-password"
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                color: "#ef4444",
                fontSize: "0.85rem",
                marginBottom: "1rem",
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", padding: "0.85rem" }}
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <div className="spinner" style={{ width: "18px", height: "18px" }} />
                  Logging in...
                </span>
              ) : "Login →"}
            </button>
          </form>

          <p style={{
            textAlign: "center",
            color: "#8899aa",
            fontSize: "0.8rem",
            marginTop: "1.5rem",
          }}>
            No account? Contact your administrator for access.
          </p>
        </div>

        <p style={{
          textAlign: "center",
          color: "#4a5568",
          fontSize: "0.75rem",
          marginTop: "1.5rem",
        }}>
          © 2024 Islamabad Property Hub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
