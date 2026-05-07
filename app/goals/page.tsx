"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/navigation/BottomNav";
import { theme } from "@/components/lib/theme";
import { ChevronLeft, Plus, X, Trash2 } from "lucide-react";

type Goal = {
  id: number;
  title: string;
  icon?: string | null;
  periodType?: string;
  dueDate?: string | null;
  currentAmount: number;
  targetAmount: number;
};

const ICONS = ["✈️", "🏡", "🛸", "💍", "🚗", "🎓", "💰"];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [periodType, setPeriodType] = useState("ALWAYS");
  const [dueDate, setDueDate] = useState("");

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🛸");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const loadGoals = async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data || []);
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const openCreate = () => {
    setSelectedGoal(null);
    setTitle("");
    setPeriodType("ALWAYS");
    setDueDate("");
    setIcon("🛸");
    setCurrentAmount("");
    setTargetAmount("");
    setIsOpen(true);
  };

    const getDday = (goal: Goal) => {
    if (goal.periodType !== "LIMITED" || !goal.dueDate) {
        return "상시";
    }

    const today = new Date();
    const due = new Date(goal.dueDate);
    const diff = Math.ceil(
        (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return diff >= 0 ? `D-${diff}` : "종료";
    };

  const openEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setTitle(goal.title);
    setIcon(goal.icon || "🛸");
    setCurrentAmount(String(goal.currentAmount));
    setTargetAmount(String(goal.targetAmount));
    setIsOpen(true);
    setPeriodType(goal.periodType || "ALWAYS");
    setDueDate(
    goal.dueDate
        ? new Date(goal.dueDate).toISOString().split("T")[0]
        : ""
    );
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedGoal(null);
  };

  const saveGoal = async () => {
    if (!title || !targetAmount) {
      alert("목표명과 목표금액을 입력하세요.");
      return;
    }

    const method = selectedGoal ? "PATCH" : "POST";

    const body = selectedGoal
      ? {
          id: selectedGoal.id,
          title,
          icon,
          currentAmount: Number(currentAmount || 0),
          targetAmount: Number(targetAmount),
          periodType,
          dueDate: periodType === "LIMITED" ? dueDate : null,
        }
      : {
          familyId: 1,
          userId: 1,
          title,
          icon,
          currentAmount: Number(currentAmount || 0),
          targetAmount: Number(targetAmount),
          periodType,
          dueDate: periodType === "LIMITED" ? dueDate : null,
        };

    const res = await fetch("/api/goals", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      alert("저장 실패");
      return;
    }

    closeModal();
    await loadGoals();
  };

  const deleteGoal = async () => {
    if (!selectedGoal) return;
    if (!confirm("이 목표를 삭제할까요?")) return;

    const res = await fetch(`/api/goals?id=${selectedGoal.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("삭제 실패");
      return;
    }

    closeModal();
    await loadGoals();
  };

  const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalPercent = totalTarget
    ? Math.round((totalCurrent / totalTarget) * 100)
    : 0;

  const money = (v: number) => `₩${Number(v || 0).toLocaleString()}`;

  return (
    <main style={pageStyle}>
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
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              전체 목표 달성률
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, marginTop: 4 }}>
              {totalPercent}%
            </div>
          </div>
          <div style={{ fontSize: 44 }}>🚀</div>
        </section>

        {goals.length === 0 ? (
          <section style={cardStyle}>
            <div style={{ fontSize: 13, color: theme.colors.subtext }}>
              등록된 목표가 없습니다.
            </div>
          </section>
        ) : (
          goals.map((goal) => {
            const percent = goal.targetAmount
              ? Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100)
                )
              : 0;

            return (
              <GoalCard
                key={goal.id}
                icon={goal.icon || "🛸"}
                title={goal.title}
                current={money(goal.currentAmount)}
                target={money(goal.targetAmount)}
                percent={percent}
                onClick={() => openEdit(goal)}
                dday={getDday(goal)}
              />
            );
          })
        )}

        <BottomNav />
      </div>

            {isOpen && (
        <div style={overlayStyle} onClick={closeModal}>
          <section style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <strong>{selectedGoal ? "목표 수정" : "목표 추가"}</strong>
              <button onClick={closeModal} style={iconButtonStyle}>
                <X size={18} />
              </button>
            </div>

            <label style={labelStyle}>아이콘</label>
            <div style={iconGridStyle}>
              {ICONS.map((item) => (
                <button
                  key={item}
                  onClick={() => setIcon(item)}
                  style={{
                    ...goalIconButtonStyle,
                    border:
                      icon === item
                        ? `1px solid ${theme.colors.primary}`
                        : `1px solid ${theme.colors.border}`,
                    background:
                      icon === item ? theme.colors.primarySoft : "white",
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
              placeholder="예: 여행 자금"
              style={inputStyle}
            />

            <label style={labelStyle}>현재 금액</label>
            <input
              value={currentAmount}
              onChange={(e) =>
                setCurrentAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="0"
              style={inputStyle}
            />

            <label style={labelStyle}>목표 금액</label>
            <input
              value={targetAmount}
              onChange={(e) =>
                setTargetAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="2000000"
              style={inputStyle}
            />

            <label style={labelStyle}>기간</label>

            <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
            }}
            >
            <button
                onClick={() => setPeriodType("ALWAYS")}
                style={{
                height: 42,
                borderRadius: 14,
                border:
                    periodType === "ALWAYS"
                    ? `1px solid ${theme.colors.primary}`
                    : `1px solid ${theme.colors.border}`,
                background:
                    periodType === "ALWAYS"
                    ? theme.colors.primarySoft
                    : "white",
                fontWeight: 800,
                }}
            >
                상시
            </button>

            <button
                onClick={() => setPeriodType("LIMITED")}
                style={{
                height: 42,
                borderRadius: 14,
                border:
                    periodType === "LIMITED"
                    ? `1px solid ${theme.colors.primary}`
                    : `1px solid ${theme.colors.border}`,
                background:
                    periodType === "LIMITED"
                    ? theme.colors.primarySoft
                    : "white",
                fontWeight: 800,
                }}
            >
                한시
            </button>
            </div>

            {periodType === "LIMITED" && (
            <>
                <label style={labelStyle}>마감일</label>
                <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
                />
            </>
            )}

            <div style={actionGridStyle}>
              {selectedGoal && (
                <button onClick={deleteGoal} style={deleteButtonStyle}>
                  <Trash2 size={16} />
                  삭제
                </button>
              )}

              <button
                onClick={saveGoal}
                style={{
                  ...saveButtonStyle,
                  gridColumn: selectedGoal ? "auto" : "1 / -1",
                }}
              >
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
  icon,
  title,
  current,
  target,
  percent,
  dday,
  onClick,
}: {
  icon: string;
  title: string;
  current: string;
  target: string;
  percent: number;
  dday: string;
  onClick: () => void;
}) {
  return (
    <section style={cardStyle} onClick={onClick}>
      <div style={goalTopStyle}>
        <div style={iconBoxStyle}>{icon}</div>

        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: 15 }}>{title}</strong>
          <div
            style={{
              fontSize: 12,
              color: theme.colors.subtext,
              marginTop: 4,
            }}
          >
            {current} / {target}
          </div>
        </div>

        <strong style={{ color: theme.colors.primary }}>{percent}%</strong>
      </div>

      <div style={barStyle}>
        <div style={{ ...barFillStyle, width: `${percent}%` }} />
      </div>

      <div style={bottomRowStyle}>
        <span>{dday}</span>
        <span>목표 관리</span>
      </div>
    </section>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#FFFFFF",
  padding: "14px 12px 82px",
  display: "flex",
  justifyContent: "center",
} as const;

const containerStyle = {
  width: "100%",
  maxWidth: 390,
  display: "flex",
  flexDirection: "column",
  gap: 14,
} as const;

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
} as const;

const iconButtonStyle = {
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
} as const;

const summaryCardStyle = {
  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #B6AAFF 100%)`,
  color: "white",
  borderRadius: 22,
  padding: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
} as const;

const cardStyle = {
  background: "white",
  borderRadius: 22,
  padding: 16,
  border: `1px solid ${theme.colors.border}`,
  cursor: "pointer",
} as const;

const goalTopStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
} as const;

const iconBoxStyle = {
  width: 44,
  height: 44,
  borderRadius: 16,
  background: theme.colors.primarySoft,
  display: "grid",
  placeItems: "center",
  fontSize: 22,
} as const;

const barStyle = {
  marginTop: 12,
  height: 7,
  borderRadius: 999,
  background: theme.colors.primarySoft,
  overflow: "hidden",
} as const;

const barFillStyle = {
  height: "100%",
  borderRadius: 999,
  background: theme.colors.primary,
} as const;

const bottomRowStyle = {
  marginTop: 10,
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
  color: theme.colors.subtext,
} as const;

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(24,17,27,0.28)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  padding: 18,
} as const;

const modalStyle = {
  width: "100%",
  maxWidth: 360,
  background: "white",
  borderRadius: 26,
  padding: "18px",
  boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
} as const;

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
} as const;

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 900,
  color: theme.colors.subtext,
  margin: "12px 0 6px",
} as const;

const iconGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 6,
} as const;

const goalIconButtonStyle = {
  height: 38,
  borderRadius: 14,
  fontSize: 19,
  cursor: "pointer",
} as const;

const inputStyle = {
  width: "100%",
  height: 46,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  padding: "0 14px",
  fontSize: 14,
  fontWeight: 800,
  outline: "none",
} as const;

const actionGridStyle = {
  display: "grid",
  gridTemplateColumns: "96px 1fr",
  gap: 10,
  marginTop: 16,
} as const;

const deleteButtonStyle = {
  height: 50,
  border: "none",
  borderRadius: 18,
  background: "#FFF3F6",
  color: theme.colors.expense,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
} as const;

const saveButtonStyle = {
  height: 50,
  border: "none",
  borderRadius: 18,
  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #A992FF 100%)`,
  color: "white",
  fontWeight: 900,
  fontSize: 15,
} as const;