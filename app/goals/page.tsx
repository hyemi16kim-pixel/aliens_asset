"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeNav } from "@/components/lib/useSwipeNav";
import BottomNav from "@/components/navigation/BottomNav";
import { theme } from "@/components/lib/theme";
import { getCurrentFamilyId, getCurrentUserId } from "@/components/lib/familyCode";
import { ChevronLeft, Plus, X, Trash2 } from "lucide-react";

type Goal = {
  id: number;
  title: string;
  icon?: string | null;
  isPinned?: boolean;
  periodType?: string;
  dueDate?: string | null;
  currentAmount: number;
  targetAmount: number;
};

const ICONS = ["✈️", "🏡", "🛸", "💍", "🚗", "🎓", "💰", "💳", "📉", "🏦"];

// 부채형 목표: targetAmount < 0
const isDebtGoal = (goal: Goal) => goal.targetAmount < 0;

// 진행률 계산
const calcPercent = (goal: Goal) => {
  if (isDebtGoal(goal)) {
    const total = Math.abs(goal.targetAmount);
    if (total === 0) return 0;
    const paid = total - Math.abs(goal.currentAmount);
    return Math.min(100, Math.max(0, Math.round((paid / total) * 100)));
  } else {
    if (goal.targetAmount === 0) return 0;
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [goalType, setGoalType] = useState<"SAVING" | "DEBT">("SAVING");
  const [periodType, setPeriodType] = useState("ALWAYS");
  const [dueDate, setDueDate] = useState("");
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🛸");

  // 저축형 필드
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  // 부채형 필드 (UI에서 양수로 입력, 저장 시 음수 변환)
  const [debtTotal, setDebtTotal] = useState("");      // 초기 금액
  const [debtRemaining, setDebtRemaining] = useState(""); // 현재 남은 금액

  const router = useRouter();
  const pageSwipe = useSwipeNav({
    onSwipeRight: () => router.push("/analysis?tab=TREND"),
  });

  const loadGoals = async () => {
    const res = await fetch(`/api/goals?familyId=${getCurrentFamilyId()}`);
    const data = await res.json();
    setGoals(data || []);
  };

  useEffect(() => { loadGoals(); }, []);

  const openCreate = () => {
    setSelectedGoal(null);
    setGoalType("SAVING");
    setTitle("");
    setPeriodType("ALWAYS");
    setDueDate("");
    setIcon("🛸");
    setCurrentAmount("");
    setTargetAmount("");
    setDebtTotal("");
    setDebtRemaining("");
    setIsOpen(true);
  };

  const getDday = (goal: Goal) => {
    if (goal.periodType !== "LIMITED" || !goal.dueDate) return "상시";
    const today = new Date();
    const due = new Date(goal.dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? `D-${diff}` : "종료";
  };

  const openEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setTitle(goal.title);
    setIcon(goal.icon || "🛸");
    setPeriodType(goal.periodType || "ALWAYS");
    setDueDate(goal.dueDate ? new Date(goal.dueDate).toISOString().split("T")[0] : "");

    if (isDebtGoal(goal)) {
      setGoalType("DEBT");
      setDebtTotal(String(Math.abs(goal.targetAmount)));
      setDebtRemaining(String(Math.abs(goal.currentAmount)));
      setCurrentAmount("");
      setTargetAmount("");
    } else {
      setGoalType("SAVING");
      setCurrentAmount(String(goal.currentAmount));
      setTargetAmount(String(goal.targetAmount));
      setDebtTotal("");
      setDebtRemaining("");
    }
    setIsOpen(true);
  };

  const closeModal = () => { setIsOpen(false); setSelectedGoal(null); };

  const saveGoal = async () => {
    if (!title) { alert("목표명을 입력하세요."); return; }

    let finalCurrent: number;
    let finalTarget: number;

    if (goalType === "DEBT") {
      if (!debtTotal) { alert("초기 금액을 입력하세요."); return; }
      finalTarget = -Math.abs(Number(debtTotal));
      finalCurrent = debtRemaining ? -Math.abs(Number(debtRemaining)) : finalTarget;
    } else {
      if (!targetAmount) { alert("목표 금액을 입력하세요."); return; }
      finalTarget = Math.abs(Number(targetAmount));
      finalCurrent = Number(currentAmount || 0);
    }

    const method = selectedGoal ? "PATCH" : "POST";
    const body = selectedGoal
      ? { id: selectedGoal.id, title, icon, currentAmount: finalCurrent, targetAmount: finalTarget, periodType, dueDate: periodType === "LIMITED" ? dueDate : null }
      : { familyId: getCurrentFamilyId(), userId: getCurrentUserId() || null, title, icon, currentAmount: finalCurrent, targetAmount: finalTarget, periodType, dueDate: periodType === "LIMITED" ? dueDate : null };

    const res = await fetch("/api/goals", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) { const err = await res.json().catch(() => ({})); alert("저장 실패: " + (err.error || res.status)); return; }
    closeModal();
    await loadGoals();
  };

  const togglePin = async (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    // 핀 개수 제한: 이미 2개 핀됐고 현재 목표가 핀 안 됐으면 막기
    if (!goal.isPinned) {
      const pinnedCount = goals.filter((g) => g.isPinned).length;
      if (pinnedCount >= 2) { alert("홈 카드에는 최대 2개까지 고정할 수 있어요."); return; }
    }
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, isPinnedToggle: true }),
    });
    await loadGoals();
  };

  const deleteGoal = async () => {
    if (!selectedGoal) return;
    if (!confirm("이 목표를 삭제할까요?")) return;
    const res = await fetch(`/api/goals?id=${selectedGoal.id}`, { method: "DELETE" });
    if (!res.ok) { alert("삭제 실패"); return; }
    closeModal();
    await loadGoals();
  };

  const savingGoals = goals.filter(g => !isDebtGoal(g));
  const debtGoals = goals.filter(g => isDebtGoal(g));

  // 전체 목표 달성률: 저축형 + 잔액형 모두 포함, 각 목표 달성률의 평균
  const totalPercent = goals.length > 0
    ? Math.round(goals.reduce((s, g) => s + calcPercent(g), 0) / goals.length)
    : 0;

  const money = (v: number) => `₩${Math.abs(Number(v || 0)).toLocaleString()}`;

  return (
    <main {...pageSwipe} style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <ChevronLeft size={22} />
          <strong style={{ fontSize: 18 }}>목표</strong>
          <button onClick={openCreate} style={iconButtonStyle}>
            <Plus size={20} color={theme.colors.primary} />
          </button>
        </header>

        <section style={summaryCardStyle}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>전체 목표 달성률</div>
            <div style={{ fontSize: 34, fontWeight: 900, marginTop: 4 }}>{totalPercent}%</div>
          </div>
          <div style={{ fontSize: 44 }}>🚀</div>
        </section>

        {goals.length === 0 && (
          <section style={cardStyle}>
            <div style={{ fontSize: 13, color: theme.colors.subtext }}>등록된 목표가 없습니다.</div>
          </section>
        )}

        {savingGoals.length > 0 && (
          <>
            <div style={sectionLabelStyle}>💰 저축 목표</div>
            {savingGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                money={money}
                getDday={getDday}
                onClick={() => openEdit(goal)}
                onPin={(e) => togglePin(goal, e)}
              />
            ))}
          </>
        )}

        {debtGoals.length > 0 && (
          <>
            <div style={sectionLabelStyle}>📉 잔액 관리</div>
            {debtGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                money={money}
                getDday={getDday}
                onClick={() => openEdit(goal)}
                onPin={(e) => togglePin(goal, e)}
              />
            ))}
          </>
        )}

        <BottomNav />
      </div>

      {isOpen && (
        <div style={overlayStyle} onClick={closeModal}>
          <section style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <strong>{selectedGoal ? "목표 수정" : "목표 추가"}</strong>
              <button onClick={closeModal} style={iconButtonStyle}><X size={18} /></button>
            </div>

            {/* 목표 유형 */}
            <label style={labelStyle}>목표 유형</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                onClick={() => setGoalType("SAVING")}
                style={{
                  height: 42, borderRadius: 14, fontWeight: 800, cursor: "pointer",
                  border: goalType === "SAVING" ? `1.5px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                  background: goalType === "SAVING" ? theme.colors.primarySoft : "white",
                  color: goalType === "SAVING" ? theme.colors.primary : theme.colors.text,
                }}
              >
                💰 저축형
              </button>
              <button
                onClick={() => setGoalType("DEBT")}
                style={{
                  height: 42, borderRadius: 14, fontWeight: 800, cursor: "pointer",
                  border: goalType === "DEBT" ? `1.5px solid #FF6B81` : `1px solid ${theme.colors.border}`,
                  background: goalType === "DEBT" ? "#FFF0F4" : "white",
                  color: goalType === "DEBT" ? "#FF6B81" : theme.colors.text,
                }}
              >
                📉 잔액형
              </button>
            </div>

            {goalType === "DEBT" && (
              <div style={{ padding: "8px 12px", borderRadius: 12, background: "#FFF7ED", border: "1px solid #FED7AA", marginTop: 8, fontSize: 11, color: "#F97316", fontWeight: 700 }}>
                ₩{Number(debtTotal || 0).toLocaleString()} 에서 시작해 ₩0 까지 소진하는 목표
              </div>
            )}

            {/* 아이콘 */}
            <label style={labelStyle}>아이콘</label>
            <div style={iconGridStyle}>
              {ICONS.map((item) => (
                <button
                  key={item}
                  onClick={() => setIcon(item)}
                  style={{
                    ...goalIconButtonStyle,
                    border: icon === item ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                    background: icon === item ? theme.colors.primarySoft : "white",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <label style={labelStyle}>목표명</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={goalType === "DEBT" ? "예: 여행 경비" : "예: 여행 자금"}
              style={inputStyle}
            />

            {goalType === "SAVING" ? (
              <>
                <label style={labelStyle}>현재 금액</label>
                <input
                  value={currentAmount ? Number(currentAmount).toLocaleString() : ""}
                  onChange={(e) => setCurrentAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  style={inputStyle}
                />
                <label style={labelStyle}>목표 금액</label>
                <input
                  value={targetAmount ? Number(targetAmount).toLocaleString() : ""}
                  onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="2,000,000"
                  style={inputStyle}
                />
              </>
            ) : (
              <>
                <label style={labelStyle}>초기 금액</label>
                <input
                  value={debtTotal ? Number(debtTotal).toLocaleString() : ""}
                  onChange={(e) => setDebtTotal(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="10,000,000"
                  style={{ ...inputStyle, border: "1px solid #FED7AA", color: "#F97316" }}
                />
                <label style={labelStyle}>현재 남은 금액</label>
                <input
                  value={debtRemaining ? Number(debtRemaining).toLocaleString() : ""}
                  onChange={(e) => setDebtRemaining(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={debtTotal ? Number(debtTotal).toLocaleString() : "10,000,000"}
                  style={{ ...inputStyle, border: "1px solid #FED7AA", color: "#F97316" }}
                />
              </>
            )}

            <label style={labelStyle}>기간</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                onClick={() => setPeriodType("ALWAYS")}
                style={{
                  height: 42, borderRadius: 14, fontWeight: 800, cursor: "pointer",
                  border: periodType === "ALWAYS" ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                  background: periodType === "ALWAYS" ? theme.colors.primarySoft : "white",
                }}
              >
                상시
              </button>
              <button
                onClick={() => setPeriodType("LIMITED")}
                style={{
                  height: 42, borderRadius: 14, fontWeight: 800, cursor: "pointer",
                  border: periodType === "LIMITED" ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                  background: periodType === "LIMITED" ? theme.colors.primarySoft : "white",
                }}
              >
                한시
              </button>
            </div>

            {periodType === "LIMITED" && (
              <>
                <label style={labelStyle}>마감일</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
              </>
            )}

            <div style={actionGridStyle}>
              {selectedGoal && (
                <button onClick={deleteGoal} style={deleteButtonStyle}>
                  <Trash2 size={16} />삭제
                </button>
              )}
              <button onClick={saveGoal} style={{ ...saveButtonStyle, gridColumn: selectedGoal ? "auto" : "1 / -1" }}>
                저장
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function GoalCard({
  goal,
  money,
  getDday,
  onClick,
  onPin,
}: {
  goal: Goal;
  money: (v: number) => string;
  getDday: (g: Goal) => string;
  onClick: () => void;
  onPin: (e: React.MouseEvent) => void;
}) {
  const debt = isDebtGoal(goal);
  const percent = calcPercent(goal);
  const remaining = debt ? Math.abs(goal.currentAmount) : goal.currentAmount;
  const total = Math.abs(goal.targetAmount);

  return (
    <section style={cardStyle} onClick={onClick}>
      <div style={goalTopStyle}>
        <div style={{ ...iconBoxStyle, background: debt ? "#FFF0F4" : theme.colors.primarySoft }}>
          {goal.icon || "🛸"}
        </div>
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: 15 }}>{goal.title}</strong>
          <div style={{ fontSize: 12, color: theme.colors.subtext, marginTop: 5 }}>
            {debt
              ? `${money(total)}에서 → ${money(remaining)} 남음`
              : `${money(goal.currentAmount)} 모음 → 목표 ${money(goal.targetAmount)}`}
          </div>
        </div>
        {/* 오른쪽: 태그 + % */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <button
            onClick={onPin}
            style={{
              border: goal.isPinned ? "none" : `1px solid ${theme.colors.border}`,
              background: goal.isPinned ? "linear-gradient(135deg, #7C5CFF, #A992FF)" : "transparent",
              color: goal.isPinned ? "white" : theme.colors.subtext,
              borderRadius: 999,
              padding: "2px 9px",
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: 0.2,
              lineHeight: 1.6,
              whiteSpace: "nowrap",
            }}
          >
            {goal.isPinned ? "📌 홈 대표" : "+ 홈 고정"}
          </button>
          <strong style={{ color: debt ? "#FF6B81" : theme.colors.primary }}>{percent}%</strong>
        </div>
      </div>

      <div style={{ ...barStyle, background: debt ? "#FFE8EE" : theme.colors.primarySoft }}>
        <div style={{ ...barFillStyle, width: `${percent}%`, background: debt ? "#FF6B81" : theme.colors.primary }} />
      </div>

      <div style={bottomRowStyle}>
        <span>{getDday(goal)}</span>
        <span style={{ color: debt ? "#FF6B81" : theme.colors.primary }}>
          {debt ? "목표: ₩0 소진" : `목표: ${money(goal.targetAmount)}`}
        </span>
      </div>
    </section>
  );
}

const pageStyle = { minHeight: "100vh", background: "#FFFFFF", padding: "14px 12px calc(90px + env(safe-area-inset-bottom))", display: "flex", justifyContent: "center" } as const;
const containerStyle = { width: "100%", maxWidth: 390, display: "flex", flexDirection: "column", gap: 14 } as const;
const headerStyle = { display: "flex", alignItems: "center", justifyContent: "space-between" } as const;
const iconButtonStyle = { border: "none", background: "transparent", padding: 0, cursor: "pointer" } as const;
const summaryCardStyle = { background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #B6AAFF 100%)`, color: "white", borderRadius: 22, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" } as const;
const sectionLabelStyle = { fontSize: 13, fontWeight: 900, color: theme.colors.subtext, paddingLeft: 4 } as const;
const cardStyle = { background: "white", borderRadius: 22, padding: 16, border: `1px solid ${theme.colors.border}`, cursor: "pointer" } as const;
const goalTopStyle = { display: "flex", alignItems: "center", gap: 12 } as const;
const iconBoxStyle = { width: 44, height: 44, borderRadius: 16, display: "grid", placeItems: "center", fontSize: 22 } as const;
const barStyle = { marginTop: 12, height: 7, borderRadius: 999, overflow: "hidden" } as const;
const barFillStyle = { height: "100%", borderRadius: 999 } as const;
const bottomRowStyle = { marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.colors.subtext } as const;
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(24,17,27,0.28)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 18 } as const;
const modalStyle = { width: "100%", maxWidth: 360, background: "white", borderRadius: 26, padding: "18px", boxShadow: "0 18px 50px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" } as const;
const modalHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } as const;
const labelStyle = { display: "block", fontSize: 12, fontWeight: 900, color: theme.colors.subtext, margin: "12px 0 6px" } as const;
const iconGridStyle = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 } as const;
const goalIconButtonStyle = { height: 38, borderRadius: 14, fontSize: 19, cursor: "pointer" } as const;
const inputStyle = { width: "100%", height: 46, borderRadius: 16, border: `1px solid ${theme.colors.border}`, padding: "0 14px", fontSize: 14, fontWeight: 800, outline: "none", boxSizing: "border-box" } as const;
const actionGridStyle = { display: "grid", gridTemplateColumns: "96px 1fr", gap: 10, marginTop: 16 } as const;
const deleteButtonStyle = { height: 50, border: "none", borderRadius: 18, background: "#FFF3F6", color: theme.colors.expense, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" } as const;
const saveButtonStyle = { height: 50, border: "none", borderRadius: 18, background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #A992FF 100%)`, color: "white", fontWeight: 900, fontSize: 15, cursor: "pointer" } as const;
               