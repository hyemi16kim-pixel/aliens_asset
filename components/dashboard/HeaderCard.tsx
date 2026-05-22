"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";

export default function HeaderCard({ data = {} }: { data?: any }) {
  const [includeDebt, setIncludeDebt] = useState(true);

const totalAsset = Number(data?.totalAsset ?? 0);
const debtAmount = Number(data?.debtAmount ?? 0);
// 부채포함: 순자산(자산-부채) / 부채제외: 실물자산만(대출 카드 무시)
const displayAsset = includeDebt
  ? totalAsset
  : totalAsset + debtAmount;
  const monthlyChange = (data?.totalIncome || 0) - (data?.totalExpense || 0);
  const isPositive = monthlyChange >= 0;

  const money = (v: number) =>
    `₩${Number(v || 0).toLocaleString()}`;

  return (
    <section style={{
      background: "linear-gradient(135deg, #7C5CFF 0%, #9F7AFF 50%, #B99BFF 100%)",
      color: "white",
      borderRadius: 28,
      padding: "24px 22px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 12px 40px rgba(124,92,255,0.30)",
      border: "1px solid rgba(255,255,255,0.18)",
    }}>
      {/* 배경 원형 장식 */}
      <div style={{ position: "absolute", top: -60, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.08)", filter: "blur(32px)" }} />
      <div style={{ position: "absolute", bottom: -40, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(24px)" }} />
      <div style={{ position: "absolute", top: 20, right: 80, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)", filter: "blur(16px)" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* 상단: 레이블 + 토글 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.82, letterSpacing: 0.8, textTransform: "uppercase" as const }}>
            총 공동 자산 · {includeDebt ? "부채 포함" : "부채 제외"}
          </div>
          <button
            type="button"
            onClick={() => setIncludeDebt((p) => !p)}
            style={{
              border: "1px solid rgba(255,255,255,0.28)",
              background: "rgba(255,255,255,0.14)",
              color: "white",
              width: 30, height: 30, borderRadius: 999,
              display: "grid", placeItems: "center",
              cursor: "pointer", padding: 0,
              backdropFilter: "blur(10px)",
            }}
            title="부채 포함/제외"
          >
            <Sparkles size={14} />
          </button>
        </div>

        {/* 총 자산 */}
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 16 }}>
          {money(displayAsset)}
        </div>

        {/* 이번 달 변동 */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 12, padding: "7px 12px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}>
          {isPositive
            ? <TrendingUp size={14} color="#A8F0CF" />
            : <TrendingDown size={14} color="#FFB3C1" />}
          <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>이번 달 변동</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: isPositive ? "#A8F0CF" : "#FFB3C1" }}>
            {isPositive ? "+" : "-"}{money(Math.abs(monthlyChange))}
          </span>
        </div>
      </div>

      {/* 외계인 — 초록 리틀 그린맨 */}
      <svg
        viewBox="0 0 80 118"
        width="80"
        height="118"
        style={{ position: "absolute", right: 4, bottom: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 발그림자 */}
        <ellipse cx="36" cy="116" rx="16" ry="3.5" fill="rgba(0,0,0,0.12)"/>

        {/* 왼쪽 다리 */}
        <path d="M31 95 Q29 106 28 114"
          stroke="#4DBF60" strokeWidth="7" fill="none" strokeLinecap="round"/>
        {/* 오른쪽 다리 */}
        <path d="M41 95 Q43 106 44 114"
          stroke="#4DBF60" strokeWidth="7" fill="none" strokeLinecap="round"/>

        {/* 몸통 */}
        <ellipse cx="36" cy="82" rx="13" ry="17"
          fill="#6EDE80" stroke="#4DBF60" strokeWidth="1.2"/>
        {/* 몸통 광택 */}
        <ellipse cx="32" cy="75" rx="4" ry="6"
          fill="rgba(255,255,255,0.18)"/>

        {/* 왼팔 — 내려간 자연스러운 자세 */}
        <path d="M25 76 Q17 84 18 93"
          stroke="#6EDE80" strokeWidth="6.5" fill="none" strokeLinecap="round"/>
        <circle cx="18" cy="94" r="3.5" fill="#4DBF60"/>

        {/* 오른팔 — 위로 태블릿 들고 있음 */}
        <path d="M47 74 Q56 64 60 54"
          stroke="#6EDE80" strokeWidth="6.5" fill="none" strokeLinecap="round"/>

        {/* 태블릿 */}
        <rect x="56" y="40" width="20" height="16" rx="3"
          fill="#1E293B" stroke="#334155" strokeWidth="1"/>
        <rect x="58" y="42" width="16" height="11" rx="1.5"
          fill="#0EA5E9"/>
        {/* 태블릿 차트 */}
        <polyline points="59,51 62,47 65,49 68,44 71,46"
          stroke="white" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
        <circle cx="59" cy="51" r="1" fill="white"/>
        <circle cx="62" cy="47" r="1" fill="white"/>
        <circle cx="65" cy="49" r="1" fill="white"/>
        <circle cx="68" cy="44" r="1.2" fill="#A8F0CF"/>
        {/* 태블릿 들고 있는 손 */}
        <circle cx="60" cy="55" r="3.5" fill="#4DBF60"/>

        {/* 목 */}
        <rect x="31" y="60" width="10" height="8" rx="4"
          fill="#6EDE80" stroke="#4DBF60" strokeWidth="1"/>

        {/* 머리 — 크고 둥근 외계인 두상 */}
        <ellipse cx="36" cy="36" rx="26" ry="30"
          fill="#7BE888" stroke="#4DBF60" strokeWidth="1.4"/>

        {/* 머리 광택 */}
        <path d="M18 18 Q28 9 50 14"
          stroke="rgba(255,255,255,0.30)" strokeWidth="5" fill="none" strokeLinecap="round"/>

        {/* 왼쪽 큰 눈 */}
        <ellipse cx="26" cy="34" rx="10.5" ry="11"
          fill="#0D0D1E" stroke="#1a1a35" strokeWidth="0.8"
          transform="rotate(-8 26 34)"/>
        <ellipse cx="22.5" cy="28.5" rx="3.5" ry="3.5"
          fill="rgba(255,255,255,0.55)"/>
        <circle cx="29" cy="38" r="1.5"
          fill="rgba(255,255,255,0.20)"/>

        {/* 오른쪽 큰 눈 */}
        <ellipse cx="46" cy="34" rx="10.5" ry="11"
          fill="#0D0D1E" stroke="#1a1a35" strokeWidth="0.8"
          transform="rotate(8 46 34)"/>
        <ellipse cx="42.5" cy="28.5" rx="3.5" ry="3.5"
          fill="rgba(255,255,255,0.55)"/>
        <circle cx="49" cy="38" r="1.5"
          fill="rgba(255,255,255,0.20)"/>

        {/* 코 (점 두 개) */}
        <circle cx="33.5" cy="48" r="1.3" fill="rgba(60,160,70,0.7)"/>
        <circle cx="37.5" cy="48" r="1.3" fill="rgba(60,160,70,0.7)"/>

        {/* 입 — 귀여운 미소 */}
        <path d="M28 53 Q36 59 44 53"
          stroke="#3AAB4A" strokeWidth="2.2" fill="none" strokeLinecap="round"/>

        {/* 볼 홍조 */}
        <ellipse cx="16" cy="42" rx="5.5" ry="3" fill="rgba(255,160,180,0.30)"/>
        <ellipse cx="56" cy="42" rx="5.5" ry="3" fill="rgba(255,160,180,0.30)"/>
      </svg>
    </section>
  );
}
