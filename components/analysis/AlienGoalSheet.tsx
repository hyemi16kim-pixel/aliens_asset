"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useModalBack } from "@/components/lib/BackStackContext";
import { useKeyboardOffset, scrollInputIntoView } from "@/components/lib/useKeyboardOffset";

/**
 * 우리의 외계인 — 자산 목표 금액 입력 시트
 * - 외계인 카드를 꾹 누르면 열림
 * - 저장한 금액은 가족 설정(DB)에 들어가서 두 사람 폰에 똑같이 적용됨
 */

type Props = {
  open: boolean;
  initialGoal: number | null;
  currentAssets: number;
  maxLevel: number;
  onClose: () => void;
  onSave: (goal: number) => Promise<void>;
};

// 523450000 → "5억 2,345만 원"
export const koreanWon = (v: number) => {
  const n = Math.max(Math.round(v), 0);
  const eok = Math.floor(n / 100_000_000);
  const man = Math.floor((n % 100_000_000) / 10_000);
  const rest = n % 10_000;
  const parts: string[] = [];
  if (eok) parts.push(`${eok.toLocaleString()}억`);
  if (man) parts.push(`${man.toLocaleString()}만`);
  if (rest || parts.length === 0) parts.push(rest.toLocaleString());
  return `${parts.join(" ")} 원`;
};

const QUICK_ADD = [
  { label: "+1천만", value: 10_000_000 },
  { label: "+5천만", value: 50_000_000 },
  { label: "+1억", value: 100_000_000 },
];

export default function AlienGoalSheet({ open, initialGoal, currentAssets, maxLevel, onClose, onSave }: Props) {
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardHeight = useKeyboardOffset();
  useModalBack(open, onClose);

  useEffect(() => {
    if (!open) return;
    setRaw(initialGoal ? String(Math.round(initialGoal)) : "");
    setError("");
    setSaving(false);
  }, [open, initialGoal]);

  if (!open || typeof document === "undefined") return null;

  const goal = Number(raw || 0);
  const valid = goal >= maxLevel; // 1레벨이 최소 1원은 되도록
  const perLevel = valid ? goal / maxLevel : 0;
  const previewLevel = valid ? Math.min(maxLevel, Math.floor(Math.max(currentAssets, 0) / perLevel) + 1) : 0;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(goal);
      onClose();
    } catch {
      setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(45,37,69,0.35)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(2px)",
        paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 390,
          background: "white",
          borderRadius: "28px 28px 0 0",
          padding: "0 20px calc(env(safe-area-inset-bottom) + 28px)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 -8px 40px rgba(124,92,255,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 14 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E0D9F5" }} />
        </div>

        <div>
          <strong style={{ fontSize: 17, color: "#2D2545" }}>👽 우리 자산 목표</strong>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9B8EC8", lineHeight: 1.5 }}>
            목표 금액을 {maxLevel}레벨로 나눠서 외계인이 자라요.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            inputMode="numeric"
            placeholder="목표 금액 입력"
            value={raw ? Number(raw).toLocaleString() : ""}
            onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, "").slice(0, 13))}
            onFocus={() => scrollInputIntoView(inputRef.current)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            style={{
              height: 56,
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 18,
              border: `1.5px solid ${valid ? "#B8E986" : "#EDE6F9"}`,
              padding: "0 44px 0 16px",
              fontSize: 20,
              fontWeight: 900,
              color: "#2D2545",
              background: "#FAFAFF",
              outline: "none",
            }}
          />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 800, color: "#B0A8C8" }}>원</span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {QUICK_ADD.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setRaw(String(goal + q.value))}
              style={{ flex: 1, height: 36, borderRadius: 12, border: "1.5px solid #E6F4D2", background: "#F5FDEB", color: "#4C7A12", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            >
              {q.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRaw("")}
            style={{ width: 52, height: 36, borderRadius: 12, border: "1.5px solid #EDE6F9", background: "white", color: "#B0A8C8", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
          >
            지우기
          </button>
        </div>

        {/* 미리보기 */}
        <div style={{ padding: "12px 14px", borderRadius: 16, background: "#FAF8FF", fontSize: 12, color: "#6B5BB5", lineHeight: 1.7 }}>
          {valid ? (
            <>
              <div>
                목표 <strong style={{ color: "#2D2545" }}>{koreanWon(goal)}</strong>
              </div>
              <div>
                1레벨 ≈ <strong style={{ color: "#2D2545" }}>{koreanWon(perLevel)}</strong>
              </div>
              <div>
                지금 자산이면 <strong style={{ color: "#4C7A12" }}>LV.{previewLevel}</strong>
                {previewLevel >= maxLevel ? " · 이미 목표 달성!" : ""}
              </div>
            </>
          ) : (
            <span style={{ color: "#B0A8C8" }}>금액을 입력하면 레벨 구간을 미리 보여드려요.</span>
          )}
        </div>

        {error && <div style={{ fontSize: 12, color: "#FF6B9D", fontWeight: 700 }}>{error}</div>}

        <button
          type="button"
          onClick={save}
          disabled={!valid || saving}
          style={{
            height: 52,
            border: "none",
            borderRadius: 18,
            background: valid ? "linear-gradient(135deg, #7C5CFF 0%, #A78BFA 100%)" : "#E6E1F3",
            color: "white",
            fontWeight: 900,
            fontSize: 15,
            cursor: valid ? "pointer" : "default",
            boxShadow: valid ? "0 6px 20px rgba(124,92,255,0.30)" : "none",
          }}
        >
          {saving ? "저장 중…" : "목표 저장"}
        </button>
      </div>
    </div>,
    document.body
  );
}
