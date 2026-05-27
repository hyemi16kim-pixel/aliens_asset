"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSwipeNav } from "@/components/lib/useSwipeNav";
import HeroSlider from "@/components/dashboard/HeroSlider";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BottomNav from "@/components/navigation/BottomNav";
import { Bell, NotebookPen, X, Save } from "lucide-react";
import { getCurrentFamilyId, hasFamilyCode } from "@/components/lib/familyCode";
import Link from "next/link";

function MemoSheet({ familyId, onClose }: { familyId: number; onClose: () => void }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/memo?familyId=${familyId}`)
      .then((r) => r.json())
      .then((d) => {
        setText(d.memo || "");
        setLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
      })
      .catch(() => setLoading(false));
  }, [familyId]);

  const handleChange = (val: string) => {
    setText(val);
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveMemo(val), 1500);
  };

  const saveMemo = async (val: string) => {
    try {
      await fetch("/api/memo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, memo: val }),
      });
      setSaved(true);
    } catch { /* ignore */ }
  };

  const handleSaveNow = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveMemo(text);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(24,17,27,0.35)", zIndex: 100 }} />
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 101,
        background: "white", borderRadius: "26px 26px 0 0",
        boxShadow: "0 -8px 40px rgba(124,92,255,0.18)",
        paddingBottom: "env(safe-area-inset-bottom)",
        display: "flex", flexDirection: "column", maxHeight: "75vh",
      }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "#E2D9F3" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#F4EFFE", border: "1px solid #DDD6FE", display: "grid", placeItems: "center" }}>
              <NotebookPen size={15} color="#7C5CFF" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#1F1B2E" }}>{"공동 메모장"}</div>
              <div style={{ fontSize: 10, color: "#B0A8C8", fontWeight: 600 }}>{saved ? "저장됨" : "저장 중..."}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSaveNow} style={{ width: 34, height: 34, borderRadius: 10, background: saved ? "#F4EFFE" : "linear-gradient(135deg,#7C5CFF,#A992FF)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <Save size={15} color={saved ? "#B0A8C8" : "white"} />
            </button>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: "#F7F5FF", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <X size={16} color="#9B96AA" />
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: "#F0EBF9", margin: "0 20px" }} />

        <div style={{ flex: 1, padding: "14px 20px 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ color: "#B0A8C8", fontSize: 13, textAlign: "center", paddingTop: 40 }}>{"불러오는 중..."}</div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={"둘이 함께 쓰는 메모 공간\n\n예) 이번 달 절약 목표, 장볼 것들, 여행 계획..."}
              style={{ flex: 1, width: "100%", minHeight: 200, border: "none", outline: "none", resize: "none", fontSize: 14, lineHeight: 1.8, color: "#2D2545", fontFamily: "inherit", fontWeight: 600, background: "transparent", boxSizing: "border-box" }}
            />
          )}
        </div>

        <div style={{ textAlign: "right", padding: "8px 22px 16px", fontSize: 10, color: "#C4B8D8", fontWeight: 600 }}>
          {text.length}{"자"}
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  const router = useRouter();
  const swipe = useSwipeNav({ onSwipeLeft: () => router.push("/transactions") });
  const [myName, setMyName] = useState("");
  const [dashboard, setDashboard] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [showSplash, setShowSplash] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const hasShownSplash = sessionStorage.getItem("alien_splash_shown");
    if (!hasShownSplash) {
      setShowSplash(true);
      const t = setTimeout(() => { sessionStorage.setItem("alien_splash_shown", "true"); setShowSplash(false); }, 1600);
      return () => clearTimeout(t);
    }
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (showSplash) return;
    const savedName = localStorage.getItem("alien_my_name");
    if (savedName) setMyName(savedName);

    async function loadHomeData() {
      if (!hasFamilyCode()) { router.replace("/setup"); return; }
      const familyId = getCurrentFamilyId();
      try {
        const monthStartDay = Number(localStorage.getItem("alien_month_start_day") || 1);
        const safe = Number.isFinite(monthStartDay) && monthStartDay >= 1 && monthStartDay <= 31 ? monthStartDay : 1;
        const res = await fetch(`/api/dashboard?monthStartDay=${safe}&familyId=${familyId}`, { cache: "no-store" });
        setDashboard(await res.json());
      } catch (e) { console.error("dashboard load error:", e); }
      try {
        const res = await fetch(`/api/goals?familyId=${familyId}&t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        setGoals(Array.isArray(data) ? data : []);
      } catch (e) { console.error("goals load error:", e); setGoals([]); }
    }
    loadHomeData();
  }, [showSplash]);

  if (showSplash) {
    return (
      <main style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 88, height: 88, borderRadius: 28, background: "#EAF8D8", border: "1px solid #D7EFC1", display: "grid", placeItems: "center", fontSize: 42 }}>{"👽"}</div>
          <div style={{ fontSize: 25, fontWeight: 900, color: "#1F1B2E", letterSpacing: -0.8 }}>{"ALIEN ASSET"}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#9B96AA" }}>{"함께 모으는 우리 자산"}</div>
        </div>
      </main>
    );
  }

  const familyId = getCurrentFamilyId();

  return (
    <main {...swipe} onScroll={(e) => setScrolled((e.currentTarget as HTMLElement).scrollTop > 50)} style={{ height: "100dvh", overflowY: "auto", background: "#F7F5FF", padding: "12px 10px 0", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>

        <header style={{
          position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top) + 8px) 4px 10px",
          background: scrolled
            ? "rgba(245,242,255,0.94)"
            : "linear-gradient(135deg, #ede9fe 0%, #f0ebff 50%, #F7F5FF 100%)",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(167,139,250,0.18)" : "none",
          transition: "background 0.3s, backdrop-filter 0.3s, border-bottom 0.3s",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#A78BFA", fontWeight: 700, marginBottom: 3, letterSpacing: 0.3 }}>
              {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1F1B2E", letterSpacing: "-0.4px" }}>
              {"안녕하세요 "}<span style={{ color: "#7C5CFF" }}>{myName || "사용자"}</span>{"님 "}
            </div>
            <div style={{ fontSize: 11, color: "#B0A8C8", marginTop: 3, fontWeight: 600 }}>{"함께 모으고, 함께 이루는 우리 자산"}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" style={{ width: 36, height: 36, borderRadius: 12, background: "#F4EFFE", border: "1px solid #DDD6FE", display: "grid", placeItems: "center", cursor: "pointer", padding: 0 }}>
              <Bell size={17} color="#7C5CFF" />
            </button>
            <button type="button" onClick={() => setShowMemo(true)} style={{ width: 36, height: 36, borderRadius: 12, background: "#F4EFFE", border: "1px solid #DDD6FE", display: "grid", placeItems: "center", cursor: "pointer", padding: 0 }}>
              <NotebookPen size={17} color="#7C5CFF" />
            </button>
            <Link href="/profile" style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#EAF8D8,#D4F5B8)", display: "grid", placeItems: "center", border: "1px solid #C5EDA0", fontSize: 18, textDecoration: "none" }}>
              {"👽"}
            </Link>
          </div>
        </header>

        <div style={{ flexShrink: 0 }}>
          <HeroSlider data={dashboard} goals={goals} />
        </div>
        <div style={{ flex: 1, minHeight: 200, overflow: "hidden" }}>
          <RecentTransactions items={dashboard?.recentTransactions || []} />
        </div>
        <BottomNav />
        <div style={{ flexShrink: 0, height: "calc(76px + env(safe-area-inset-bottom))" }} />
      </div>

      {showMemo && familyId && (
        <MemoSheet familyId={familyId} onClose={() => setShowMemo(false)} />
      )}
    </main>
  );
}
