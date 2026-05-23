"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentFamily } from "@/components/lib/familyCode";
import { theme } from "@/components/lib/theme";
import { Suspense } from "react";

type Step = "code" | "password";

function SetupPageContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 가족 정보 (코드 입력 후 임시 저장)
  const [pendingFamily, setPendingFamily] = useState<{ id: number; code: string } | null>(null);

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

      const familyId = data.family.id;

      // 비밀번호 설정 여부 확인
      const pwRes = await fetch(`/api/family/password?familyId=${familyId}`);
      const pwData = await pwRes.json();

      if (pwData.hasPassword) {
        // 비밀번호 있음 → 비밀번호 입력 단계로
        setPendingFamily({ id: familyId, code: data.family.code });
        setStep("password");
      } else {
        // 비밀번호 없음 → 바로 진입
        setCurrentFamily(trimmed, familyId, data.family.code);
        router.replace("/");
      }
    } catch (e: any) {
      setError(e.message || "연결에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit() {
    if (!pendingFamily) return;
    if (!password.trim()) { setError("비밀번호를 입력해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/family/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: pendingFamily.id,
          action: "check",
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError("비밀번호가 올바르지 않습니다.");
        return;
      }
      // 인증 성공
      setCurrentFamily(code.trim().toUpperCase(), pendingFamily.id, pendingFamily.code);
      router.replace("/");
    } catch (e: any) {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
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

        {/* 로고 */}
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
            {step === "code"
              ? "가족코드를 입력하면 함께 쓰는 가계부가 연결돼요"
              : "이 가계부는 비밀번호로 보호되어 있어요"}
          </div>
        </div>

        {/* 카드 */}
        <div style={{
          width: "100%", background: "#FFFFFF", borderRadius: 24, padding: "24px 20px",
          border: "1px solid " + theme.colors.border, boxShadow: theme.shadow.md,
          display: "flex", flexDirection: "column", gap: 16,
        }}>

          {step === "code" ? (
            <>
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
                  style={inputStyle(!!error)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = theme.colors.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = error ? theme.colors.expense : theme.colors.border)}
                  autoFocus
                />
                {error && <p style={errorStyle}>{error}</p>}
              </div>
              <button onClick={handleCodeSubmit} disabled={loading} style={btnStyle(loading)}>
                {loading ? "확인 중..." : "시작하기 👽"}
              </button>
            </>
          ) : (
            <>
              {/* 코드 표시 */}
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <span style={{
                  display: "inline-block", padding: "4px 14px", borderRadius: 999,
                  background: "#F4EFFE", fontSize: 13, fontWeight: 800, color: theme.colors.primary,
                  letterSpacing: 1,
                }}>
                  {code.trim().toUpperCase()}
                </span>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: theme.colors.text, display: "block", marginBottom: 8 }}>
                  비밀번호 입력
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  placeholder="비밀번호를 입력하세요"
                  style={inputStyle(!!error)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = theme.colors.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = error ? theme.colors.expense : theme.colors.border)}
                  autoFocus
                />
                {error && <p style={errorStyle}>{error}</p>}
              </div>

              <button onClick={handlePasswordSubmit} disabled={loading} style={btnStyle(loading)}>
                {loading ? "확인 중..." : "입장하기 🔑"}
              </button>

              <button
                onClick={() => { setStep("code"); setError(""); setPassword(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: theme.colors.subtext, fontSize: 13, fontWeight: 600,
                  padding: "4px 0",
                }}
              >
                ← 다른 코드 입력
              </button>
            </>
          )}
        </div>

        {step === "code" && (
          <div style={{ fontSize: 12, color: theme.colors.subtext, textAlign: "center", lineHeight: 1.7 }}>
            새 코드를 입력하면 새 가계부가 만들어져요.<br />
            파트너와 같은 코드를 쓰면 함께 연결돼요.
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle = (hasError: boolean) => ({
  width: "100%", height: 52, borderRadius: 14,
  border: "1.5px solid " + (hasError ? theme.colors.expense : theme.colors.border),
  padding: "0 16px", fontSize: 16, fontWeight: 700, color: theme.colors.text,
  letterSpacing: 1, outline: "none", boxSizing: "border-box" as const,
  background: theme.colors.bgLight, transition: "border-color 0.2s",
});

const btnStyle = (loading: boolean) => ({
  width: "100%", height: 52, borderRadius: 16, border: "none",
  background: loading ? theme.colors.border : theme.gradient.primary,
  color: loading ? theme.colors.subtext : "#FFFFFF",
  fontSize: 15, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
});

const errorStyle = {
  fontSize: 12, color: theme.colors.expense, marginTop: 6, fontWeight: 600,
};

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupPageContent />
    </Suspense>
  );
}
