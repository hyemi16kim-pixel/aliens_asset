"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setCurrentFamily, setCurrentUserId, getCurrentFamilyId, getCurrentFamilyCode } from "@/components/lib/familyCode";
import { cacheProfileSettings } from "@/components/lib/profileSettings";
import { theme } from "@/components/lib/theme";

type Step = "code" | "user";
type FamilyUser = { id: number; name: string; color?: string; role: string };

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [owner, setOwner] = useState<FamilyUser | null>(null);
  const [partner, setPartner] = useState<FamilyUser | null>(null);

  useEffect(() => {
    if (searchParams.get("step") === "user") {
      const familyId = getCurrentFamilyId();
      if (familyId) {
        setLoading(true);
        fetch("/api/family-settings?familyId=" + familyId)
          .then(r => r.json())
          .then(data => {
            if (data.owner || data.partner) {
              setOwner(data.owner ? { ...data.owner, role: "OWNER" } : null);
              setPartner(data.partner ? { ...data.partner, role: "MEMBER" } : null);
              setStep("user");
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
  }, [searchParams]);

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

      const settingsRes = await fetch("/api/family-settings?familyId=" + data.family.id);
      const settings = await settingsRes.json();
      setOwner(settings.owner ? { ...settings.owner, role: "OWNER" } : null);
      setPartner(settings.partner ? { ...settings.partner, role: "MEMBER" } : null);
      setStep("user");
    } catch (e: any) {
      setError(e.message || "연결에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleUserSelect(me: FamilyUser, other: FamilyUser | null) {
    setCurrentUserId(me.id);
    cacheProfileSettings(
      me.name || "나",
      other?.name || "파트너",
      me.color || "#BFEFE0",
      other?.color || "#FFD6E8",
    );
    router.replace("/?setup=done");
  }

  const users = [owner, partner].filter(Boolean) as FamilyUser[];

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
            {step === "code" ? "가족코드를 입력하면 함께 쓰는 가계부가 연결돼요" : "이 기기를 사용할 사람을 선택해주세요"}
          </div>
        </div>

        {step === "code" && (
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
        )}

        {step === "user" && (
          <div style={{
            width: "100%", background: "#FFFFFF", borderRadius: 24, padding: "24px 20px",
            border: "1px solid " + theme.colors.border, boxShadow: theme.shadow.md,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: theme.colors.subtext, margin: 0, textAlign: "center" }}>
              이 기기를 사용하는 사람은 누구인가요?
            </p>

            {users.map(function(user, idx) {
              const other = users.find(function(u) { return u.id !== user.id; }) || null;
              const bgColor = user.color || (idx === 0 ? "#BFEFE0" : "#FFD6E8");
              const hasRealName = user.name && user.name !== "나" && user.name !== "파트너";
              const displayName = hasRealName ? user.name : (idx === 0 ? "첫 번째 사람" : "두 번째 사람");

              return (
                <button
                  key={user.id}
                  onClick={function() { handleUserSelect(user, other); }}
                  style={{
                    width: "100%", minHeight: 76, borderRadius: 20,
                    border: "1.5px solid " + theme.colors.border,
                    background: theme.colors.bgLight,
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "0 20px", cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={function(e) {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                    e.currentTarget.style.background = theme.colors.primarySoft;
                  }}
                  onMouseLeave={function(e) {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.background = theme.colors.bgLight;
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: bgColor, display: "grid", placeItems: "center",
                    fontSize: 26, flexShrink: 0,
                    border: "2px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}>👽</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: theme.colors.text }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 11, color: theme.colors.subtext, marginTop: 2 }}>
                      {user.role === "OWNER" ? "가족 대표" : "파트너"}
                    </div>
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg, #7C5CFF, #A78BFA)",
                    display: "grid", placeItems: "center", flexShrink: 0,
                    color: "white", fontSize: 16,
                  }}>→</div>
                </button>
              );
            })}

            {searchParams.get("step") === "user" ? (
              <button
                onClick={function() { router.replace("/profile"); }}
                style={{ background: "transparent", border: "none", color: theme.colors.subtext, fontSize: 13, cursor: "pointer", padding: "8px 0" }}
              >
                ← 돌아가기
              </button>
            ) : (
              <button
                onClick={function() { setStep("code"); }}
                style={{ background: "transparent", border: "none", color: theme.colors.subtext, fontSize: 13, cursor: "pointer", padding: "8px 0" }}
              >
                ← 코드 다시 입력
              </button>
            )}
          </div>
        )}

        <div style={{ fontSize: 12, color: theme.colors.subtext, textAlign: "center", lineHeight: 1.7 }}>
          새 코드를 입력하면 새 가계부가 만들어져요.
          파트너와 같은 코드를 쓰면 함께 연결돼요.
        </div>
      </div>
    </main>
  );
}
