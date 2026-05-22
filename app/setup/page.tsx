"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentFamily } from "@/components/lib/familyCode";
import { theme } from "@/components/lib/theme";
import { Suspense } from "react";

function SetupPageContent() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCodeSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("가족코드를 입력해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/init?code=" + encodeURIComponent(trimmed));
      if (!res.ok) throw new Error("서버 오류");
      const data = await res.json();
      if (!data.family?.id) throw new Error("가족 정보를 불러올 수 없습니다.");
      setCurrentFamily(trimmed, data.family.id, data.family.code);
      router.replace("/");
    } catch (e: any) {
      setError(e.message || "연결에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #A78BFA28 0%, #A78BFA10 30%, #f8f6ff 65%, #ffffff 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 90, height: 90, borderRadius: 28,
            background: "linear-gradient(135deg, #EAF8D8 0%, #E5F5F0 100%)",
            border: "2px solid #D7EFC1", display: "grid", placeItems: "center",
            fontSize: 48, boxShadow: "0 12px 32px rgba(126,217,174,0.2)",
          }}>👽</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: theme.colors.text, letterSpacing: -0.5, textAlign: "center" }}>
            ALIEN ASSET
          </div>
          <div style={{ fontSize: 13, color: theme.colors.subtext, fontWeight: 600, textAlign: "center", lineHeight: 1.6 }}>
            가족코드를 입력하면 함께 쓰는 가계부가 연결돼요
          </div>
        </div>

        <div style={{
          width: "100%", background: "#FFFFFF", borderRadius: 24, padding: "24px 20px",
          border: "1px solid " + theme.colors.border, boxShadow: theme.shadow.md,
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 800, color: theme.colors.text, display: "block", marginBottom: 8 }}>
              가족코드 입력
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
              placeholder="예: ALIEN-001"
              style={{
                width: "100%", height: 52, borderRadius: 14,
                border: "1.5px solid " + (error ? theme.colors.expense : theme.colors.border),
                padding: "0 16px", fontSize: 16, fontWeight: 700, color: theme.colors.text,
                letterSpacing: 1, outline: "none", boxSizing: "border-box" as const,
                background: theme.colors.bgLight, transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = theme.colors.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = error ? theme.colors.expense : theme.colors.border)}
              autoFocus
            />
            {error && <p style={{ fontSize: 12, color: theme.colors.expense, marginTop: 6, fontWeight: 600 }}>{error}</p>}
          </div>
          <button
            onClick={handleCodeSubmit}
            disabled={loading}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: loading ? theme.colors.border : theme.gradient.primary,
              color: loading ? theme.colors.subtext : "#FFFFFF",
              fontSize: 15, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "연결 중..." : "시작하기 👽"}
          </button>
        </div>

        <div style={{ fontSize: 12, color: theme.colors.subtext, textAlign: "center", lineHeight: 1.7 }}>
          새 코드를 입력하면 새 가계부가 만들어져요.<br />
          파트너와 같은 코드를 쓰면 함께 연결돼요.
        </div>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupPageContent />
    </Suspense>
  );
}
