
"use client";

import {  Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import { theme } from "@/components/lib/theme";
import {
  ChevronLeft,
  ChevronDown,
  SlidersHorizontal,
  Trash2,
  X,
  Coffee,
  Utensils,
  ShoppingBag,
  Bus,
  Home,
  Heart,
  Wallet,
  ArrowLeftRight,
  ChevronRight,
  CircleDollarSign,
  TrendingDown,
  CalendarDays,
  List,
  TrendingUp,
  Gamepad2,
  Film,
  Gift,
  Hospital,
  BookOpen,
  Dumbbell,
  Plane,
  Shirt,
  Smartphone,
  PawPrint,
  Baby,
  Music,
  Briefcase,
  Landmark,
  PiggyBank,
  Sparkles,
  ArrowDownCircle,
  CreditCard,
} from "lucide-react";

import {
  getOwnerColor,
  getProfileSettings,
  mapOwnerName,
} from "@/components/lib/profileSettings";

import {
  formatMonthRangeLabel,
  getBaseMonthByStartDay,
  getCustomMonthRange,
  getSavedMonthStartDay,
  isDateInRange,
  toLocalDateKey,
} from "@/components/lib/monthRange";

type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
type FilterType = "ALL" | TransactionType;
type ViewMode = "LIST" | "CALENDAR";


type Transaction = {
  id: number;
  type: TransactionType;
  amount: number;
  category: string;
  owner?: string | null;
  memo?: string | null;
  transactionAt: string;
  fromAccountId?: number | null;
  toAccountId?: number | null;
  fromAccount?: { id?: number; name: string } | null;
  toAccount?: { id?: number; name: string } | null;
};

const iconKeyMap: Record<string, any> = {
  "자산 수정": { icon: Sparkles, bg: "#F4F0FF" },
  식비: { icon: Utensils, bg: "#FFF3F6" },
  카페: { icon: Coffee, bg: "#F1FAF5" },
  쇼핑: { icon: ShoppingBag, bg: "#F4F0FF" },
  교통: { icon: Bus, bg: "#FFF8DF" },
  생활: { icon: Home, bg: "#EEF5FF" },
  데이트: { icon: Heart, bg: "#FFEAF3" },
  게임: { icon: Gamepad2, bg: "#F4F0FF" },
  영화: { icon: Film, bg: "#F4F0FF" },
  선물: { icon: Gift, bg: "#FFF3F6" },
  병원: { icon: Hospital, bg: "#EEF5FF" },
  공부: { icon: BookOpen, bg: "#F4F0FF" },
  운동: { icon: Dumbbell, bg: "#ECFFF6" },
  여행: { icon: Plane, bg: "#EEF5FF" },
  의류: { icon: Shirt, bg: "#FFF8DF" },
  통신: { icon: Smartphone, bg: "#EEF5FF" },
  반려: { icon: PawPrint, bg: "#FFF3F6" },
  육아: { icon: Baby, bg: "#FFF8DF" },
  음악: { icon: Music, bg: "#F4F0FF" },

  급여: { icon: Briefcase, bg: "#ECFFF6" },
  보너스: { icon: Gift, bg: "#ECFFF6" },
  용돈: { icon: Wallet, bg: "#ECFFF6" },
  이자: { icon: Landmark, bg: "#ECFFF6" },
  배당: { icon: PiggyBank, bg: "#ECFFF6" },
  환급: { icon: ArrowDownCircle, bg: "#ECFFF6" },

  이체: { icon: ArrowLeftRight, bg: "#F4F0FF" },
  자동이체: { icon: ArrowLeftRight, bg: "#F4F0FF" },
  카드대금: { icon: CreditCard, bg: "#F4F0FF" },
  저축이동: { icon: PiggyBank, bg: "#F4F0FF" },
  은행: { icon: Landmark, bg: "#F4F0FF" },

  "주식 매수": { icon: TrendingUp, bg: "#ECFFF6" },
  "주식 매도": { icon: TrendingDown, bg: "#FFF3F6" },
};

const getIconData = (category: string) => {
  if (category.includes("주식 매수")) return iconKeyMap["주식 매수"];
  if (category.includes("주식 매도")) return iconKeyMap["주식 매도"];
  if (category.includes("자산 수정")) {
    return iconKeyMap["자산 수정"];
  }

  const keys = ["EXPENSE", "INCOME", "TRANSFER"];

  for (const key of keys) {
    const saved = localStorage.getItem(`alien_custom_categories_${key}`);
    const list = saved ? JSON.parse(saved) : [];
    const found = list.find((item: any) => item.name === category);

    if (found && iconKeyMap[found.iconKey]) {
      return iconKeyMap[found.iconKey];
    }
  }

  return iconKeyMap[category] || iconKeyMap["식비"];
};

const getEditCategories = (type: TransactionType) => {
  const savedCustom = localStorage.getItem(`alien_custom_categories_${type}`);
  const custom = savedCustom ? JSON.parse(savedCustom).map((item: any) => item.name) : [];

  const base =
    type === "EXPENSE"
      ? ["식비"]
      : type === "INCOME"
      ? ["수입"]
      : ["이체"];

  return [...base, ...custom];
};

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [monthStartDay, setMonthStartDay] = useState(1);
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
    
  const [ownerNames, setOwnerNames] = useState(["민준", "지영", "공동"]);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editFromAccountId, setEditFromAccountId] = useState("");
  const [editToAccountId, setEditToAccountId] = useState("");

  const [editType, setEditType] = useState<TransactionType>("EXPENSE");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("식비");
  const [editOwner, setEditOwner] = useState("공동");
  const [editDate, setEditDate] = useState("");
  const [editMemo, setEditMemo] = useState("");

  const loadTransactions = async () => {
    const res = await fetch("/api/transactions");
    const data = await res.json();
    setTransactions(data);
  };

useEffect(() => {
  loadTransactions();

  fetch("/api/accounts")
    .then((res) => res.json())
    .then((data) => {
      const accountList = Array.isArray(data) ? data : data.accounts || [];
      setAccounts(accountList);
    })
    .catch(console.error);
}, []);

useEffect(() => {
  const accountId = searchParams.get("accountId");

  if (accountId) {
    setSelectedAccountId(accountId);
    setViewMode("LIST");
  }
}, [searchParams]);

    useEffect(() => {
      const settings = getProfileSettings();
      const savedStartDay = getSavedMonthStartDay();

      setOwnerNames(settings.ownerNames);
      setMonthStartDay(savedStartDay);
      setMonth(getBaseMonthByStartDay(new Date(), savedStartDay));
    }, []);

    const monthRange = useMemo(() => {
      return getCustomMonthRange(month, monthStartDay);
    }, [month, monthStartDay]);

  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;
  const monthRangeLabel = formatMonthRangeLabel(monthRange.start, monthRange.end);

  
  const hasActiveFilter = !!selectedType || !!selectedAccountId;
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: any) => {
      const txDate = new Date(tx.transactionAt);

     const sameMonth = isDateInRange(txDate, monthRange.start, monthRange.end);

      const topTypeMatch = filter === "ALL" ? true : tx.type === filter;

      const modalTypeMatch = selectedType ? tx.type === selectedType : true;

      const accountMatch = selectedAccountId
        ? String(tx.fromAccountId) === selectedAccountId ||
          String(tx.toAccountId) === selectedAccountId
        : true;

      return sameMonth && topTypeMatch && modalTypeMatch && accountMatch;
    });
  }, [transactions, filter, monthRange, selectedType, selectedAccountId]);

const calendarDays = useMemo(() => {
  const days: (Date | null)[] = [];

  const start = new Date(monthRange.start);
  const end = new Date(monthRange.end);

  const startBlank = start.getDay();

  for (let i = 0; i < startBlank; i += 1) {
    days.push(null);
  }

  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}, [monthRange.start, monthRange.end]);

const getDaySummary = (day: Date) => {
  const dayKey = toLocalDateKey(day);

  const dayTransactions = transactions.filter((tx) => {
    return toLocalDateKey(tx.transactionAt) === dayKey;
  });

  const income = dayTransactions
    .filter((tx) => tx.type === "INCOME")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const expense = dayTransactions
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  return { income, expense };
};

const selectedDayTransactions = useMemo(() => {
  if (!selectedDay) return [];

  return transactions.filter((tx) => {
    return toLocalDateKey(tx.transactionAt) === selectedDay;
  });
}, [transactions, selectedDay]);

  const openEditSheet = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditType(tx.type);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category);
    setEditOwner(tx.owner || "공동");
    setEditDate(new Date(tx.transactionAt).toISOString().slice(0, 10));
    setEditMemo(tx.memo || "");
    setEditFromAccountId(tx.fromAccountId ? String(tx.fromAccountId) : "");
    setEditToAccountId(tx.toAccountId ? String(tx.toAccountId) : ""); 
  };

  const closeEditSheet = () => {
    setSelectedTx(null);
    setEditAmount("");
    setEditMemo("");
  };

  const changeEditType = (nextType: TransactionType) => {
    setEditType(nextType);
    setEditCategory(getEditCategories(nextType)[0]);
  };

  const updateTransaction = async () => {
    if (!selectedTx) return;

    const res = await fetch("/api/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedTx.id,
        fromAccountId:
          editType === "INCOME" ? null : editFromAccountId ? Number(editFromAccountId) : null,
        toAccountId:
          editType === "EXPENSE"
            ? null
            : editType === "TRANSFER"
            ? editToAccountId
              ? Number(editToAccountId)
              : null
            : editFromAccountId
            ? Number(editFromAccountId)
            : null,
        type: editType,
        amount: Number(editAmount),
        category: editCategory,
        owner: editOwner,
        memo: editMemo || null,
        transactionAt: new Date(editDate).toISOString(),
      }),
    });

    if (!res.ok) {
      alert("수정 실패");
      return;
    }

    closeEditSheet();
    await loadTransactions();
  };

  const deleteTransaction = async (id: number) => {
    if (!confirm("이 거래를 삭제할까요?")) return;

    const res = await fetch(`/api/transactions?id=${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("삭제 실패");
      return;
    }

    closeEditSheet();
    await loadTransactions();
  };

    const moveMonth = (value: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + value, 1));
    setSelectedDay(null);
    };

  const formatAmount = (tx: Transaction) => {
    const sign = tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : "";
    return `${sign}₩${Math.abs(Number(tx.amount)).toLocaleString()}`;
  };
  
  const formatDateShort = (value: string) => {
  const d = new Date(value);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
};

const getAccountText = (tx: Transaction) => {
  const fromName = tx.fromAccount?.name;
  const toName = tx.toAccount?.name;

  if (tx.type === "TRANSFER") {
    if (fromName && toName) return `${fromName} ↔ ${toName}`;
    return "이체 계좌";
  }

  if (tx.type === "INCOME") {
    return toName || "입금 계좌";
  }

  return fromName || "출금 계좌";
};

  const getTypeColor = (type: TransactionType) => {
    if (type === "INCOME") return theme.colors.income;
    if (type === "EXPENSE") return theme.colors.expense;
    return theme.colors.primary;
  };

  const getTypeLabel = (type: TransactionType) => {
    if (type === "EXPENSE") return "지출";
    if (type === "INCOME") return "수입";
    return "이체";
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <button onClick={() => router.back()} style={plainButtonStyle}>
            <ChevronLeft size={22} />
          </button>
          <strong style={{ fontSize: 18 }}>거래내역</strong>
          <div style={{ width: 22 }} />
        </header>

        <div style={topFilterGridStyle}>
        <TopFilterButton
        label="달력"
        icon={CalendarDays}
        active={viewMode === "CALENDAR"}
        color={theme.colors.primary}
        onClick={() => {
            setFilter("ALL");
            setSelectedDay(null);
            setViewMode("CALENDAR");
        }}
        />
        <TopFilterButton
            label="전체"
            icon={List}
            active={filter === "ALL" && viewMode === "LIST"}
            color={theme.colors.primary}
            onClick={() => {
            setFilter("ALL");
            setViewMode("LIST");
            }}
        />
        <TopFilterButton
            label="수입"
            icon={CircleDollarSign}
            active={filter === "INCOME" && viewMode === "LIST"}
            color={theme.colors.income}
            onClick={() => {
            setFilter("INCOME");
            setViewMode("LIST");
            }}
        />
        <TopFilterButton
            label="지출"
            icon={TrendingDown}
            active={filter === "EXPENSE" && viewMode === "LIST"}
            color={theme.colors.expense}
            onClick={() => {
            setFilter("EXPENSE");
            setViewMode("LIST");
            }}
        />
        <TopFilterButton
            label="이체"
            icon={ArrowLeftRight}
            active={filter === "TRANSFER" && viewMode === "LIST"}
            color={theme.colors.primary}
            onClick={() => {
            setFilter("TRANSFER");
            setViewMode("LIST");
            }}
        />

        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => moveMonth(-1)} style={smallMonthButtonStyle}>
            <ChevronLeft size={16} />
          </button>

          <button style={monthButtonStyle}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
              <span>{monthLabel}</span>
              <span style={{ fontSize: 10, color: theme.colors.subtext }}>{monthRangeLabel}</span>
            </div>
            <ChevronDown size={16} />
          </button>

          <button onClick={() => moveMonth(1)} style={smallMonthButtonStyle}>
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setShowFilterModal(true)}
            style={{
              ...filterButtonStyle,
              border: hasActiveFilter
                ? `1px solid ${theme.colors.primary}`
                : filterButtonStyle.border,
              background: hasActiveFilter
                ? `${theme.colors.primary}14`
                : "white",
              color: hasActiveFilter
                ? theme.colors.primary
                : theme.colors.subtext,
            }}
          >
            <SlidersHorizontal
              size={18}
              color={
                hasActiveFilter
                  ? theme.colors.primary
                  : theme.colors.subtext
              }
            />
          </button>
        </div>

        <div style={sectionTitleStyle}>
        {filter === "ALL"
            ? "전체 거래내역"
            : filter === "INCOME"
            ? "수입 내역"
            : filter === "EXPENSE"
            ? "지출 내역"
            : "이체 내역"}{" "}
        · {filteredTransactions.length}건
        </div>

{viewMode === "CALENDAR" ? (
  <>
    <section style={calendarBoxStyle}>
    <div style={weekGridStyle}>
      {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
        <div key={day} style={weekTextStyle}>
          {day}
        </div>
      ))}
    </div>

    <div style={calendarGridStyle}>
      {calendarDays.map((day, index) => {
  if (!day) {
    return <div key={`blank-${index}`} style={calendarDayStyle} />;
  }

  const dayKey = toLocalDateKey(day);
  const summary = getDaySummary(day);
  const activeDay = selectedDay === dayKey;

  return (
    <button
      key={dayKey}
      onClick={() => setSelectedDay(activeDay ? null : dayKey)}
      style={{
        ...calendarDayButtonStyle,
        background: activeDay ? "#F4F0FF" : "#FFFFFF",
        borderColor: activeDay ? theme.colors.primary : theme.colors.border,
      }}
    >
      <strong style={dayNumberStyle}>{day.getDate()}</strong>

      {summary.income > 0 && (
        <span style={dayIncomeStyle}>
          +{summary.income.toLocaleString()}
        </span>
      )}

      {summary.expense > 0 && (
        <span style={dayAmountStyle}>
          -{summary.expense.toLocaleString()}
        </span>
      )}
    </button>
  );
})}
    </div>
  </section>
  {selectedDay && (
  <section style={dayDetailBoxStyle}>
    <div style={dayDetailHeaderStyle}>
      <strong>
        {selectedDay.slice(5, 7)}월 {selectedDay.slice(8, 10)}일 상세내역
      </strong>
      <span>{selectedDayTransactions.length}건</span>
    </div>

    {selectedDayTransactions.length === 0 ? (
      <div style={emptyStyle}>해당 날짜의 거래내역이 없습니다.</div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {selectedDayTransactions.map((tx) => {
          const iconData = getIconData(tx.category);
          const Icon = iconData.icon;

          return (
            <div
              key={tx.id}
              onClick={() => openEditSheet(tx)}
              style={txCardStyle}
            >
              <div style={{ ...iconBoxStyle, background: iconData.bg }}>
                <Icon size={20} color={getTypeColor(tx.type)} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>
                    {mapOwnerName(tx.owner)} · {tx.category}
                  </div>

                  <div style={accountTextStyle}>
                    {getAccountText(tx)}
                  </div>

                  <div style={memoTextStyle}>
                    {tx.memo || "메모 없음"}
                  </div>
                </div>
              </div>

<div style={amountBoxStyle}>
  <span style={dateTextStyle}>{formatDateShort(tx.transactionAt)}</span>
  <strong
    style={{
      fontSize: 14,
      color: getTypeColor(tx.type),
      lineHeight: 1.1,
    }}
  >
    {formatAmount(tx)}
  </strong>
</div>
            </div>
          );
        })}
      </div>
    )}
  </section>
)}
  </>
) : (
  <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {filteredTransactions.length === 0 ? (
      <div style={emptyStyle}>해당 월의 거래내역이 없습니다.</div>
    ) : (
      filteredTransactions.map((tx) => {
        if (filter !== "ALL" && tx.type !== filter) return null;
        const iconData = getIconData(tx.category);
        const Icon = iconData.icon;

        return (
          <div
            key={tx.id}
            onClick={() => openEditSheet(tx)}
            style={{
              ...txCardStyle,
              borderLeft: `5px solid ${getOwnerColor(tx.owner)}`,
            }}
          >
            <div style={{ ...iconBoxStyle, background: iconData.bg }}>
              <Icon size={20} color={getTypeColor(tx.type)} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>
                  {mapOwnerName(tx.owner)} · {tx.category}
                </div>

                <div style={accountTextStyle}>
                  {getAccountText(tx)}
                </div>

                <div style={memoTextStyle}>
                  {tx.memo || "메모 없음"}
                </div>
              </div>
            </div>

<div style={amountBoxStyle}>
  <span style={dateTextStyle}>{formatDateShort(tx.transactionAt)}</span>
  <strong
    style={{
      fontSize: 14,
      color: getTypeColor(tx.type),
      lineHeight: 1.1,
    }}
  >
    {formatAmount(tx)}
  </strong>
</div>
          </div>
        );
      })
    )}
  </section>
)}

{showFilterModal && (
  <div style={overlayStyle} onClick={() => setShowFilterModal(false)}>
    <section style={sheetStyle} onClick={(e) => e.stopPropagation()}>
      <div style={sheetHeaderStyle}>
        <strong>상세 필터</strong>
        <button
          onClick={() => setShowFilterModal(false)}
          style={plainButtonStyle}
        >
          <X size={18} />
        </button>
      </div>

      <label style={labelStyle}>거래 유형</label>
      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        style={inputStyle}
      >
        <option value="">전체</option>
        <option value="INCOME">수입</option>
        <option value="EXPENSE">지출</option>
        <option value="TRANSFER">이체</option>
      </select>

      <label style={labelStyle}>계좌 선택</label>
      <select
        value={selectedAccountId}
        onChange={(e) => setSelectedAccountId(e.target.value)}
        style={inputStyle}
      >
        <option value="">전체 계좌</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>

      <div style={actionGridStyle}>
        <button
          onClick={() => {
            setSelectedType("");
            setSelectedAccountId("");
          }}
          style={deleteButtonStyle}
        >
          초기화
        </button>

        <button
          onClick={() => setShowFilterModal(false)}
          style={saveButtonStyle}
        >
          적용하기
        </button>
      </div>
    </section>
  </div>
)}

        <BottomNav />
      </div>

      {selectedTx && (
        <div style={overlayStyle} onClick={closeEditSheet}>
          <section style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={sheetHeaderStyle}>
              <strong>거래 수정</strong>
              <button onClick={closeEditSheet} style={plainButtonStyle}>
                <X size={18} />
              </button>
            </div>

            <div style={editTypeGridStyle}>
              <EditTypeButton label="지출" active={editType === "EXPENSE"} color={theme.colors.expense} onClick={() => changeEditType("EXPENSE")} />
              <EditTypeButton label="수입" active={editType === "INCOME"} color={theme.colors.income} onClick={() => changeEditType("INCOME")} />
              <EditTypeButton label="이체" active={editType === "TRANSFER"} color={theme.colors.primary} onClick={() => changeEditType("TRANSFER")} />
            </div>

            <label style={labelStyle}>금액</label>
            <input
              value={Number(editAmount || 0).toLocaleString()}
              onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9]/g, ""))}
              style={inputStyle}
            />

            <label style={labelStyle}>카테고리</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              style={inputStyle}
            >
              {getEditCategories(editType).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

<label style={labelStyle}>
  {editType === "TRANSFER"
    ? "이체 계좌"
    : editType === "INCOME"
    ? "입금 계좌"
    : "출금 계좌"}
</label>

{editType === "TRANSFER" ? (
  <div style={{ display: "grid", gap: 8 }}>
    <select
      value={editFromAccountId}
      onChange={(e) => setEditFromAccountId(e.target.value)}
      style={inputStyle}
    >
      <option value="">출금 계좌 선택</option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          출금 · {account.name}
        </option>
      ))}
    </select>

    <select
      value={editToAccountId}
      onChange={(e) => setEditToAccountId(e.target.value)}
      style={inputStyle}
    >
      <option value="">입금 계좌 선택</option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          입금 · {account.name}
        </option>
      ))}
    </select>
  </div>
) : (
  <select
    value={editFromAccountId}
    onChange={(e) => setEditFromAccountId(e.target.value)}
    style={inputStyle}
  >
    <option value="">계좌 선택</option>
    {accounts.map((account) => (
      <option key={account.id} value={account.id}>
        {account.name}
      </option>
    ))}
  </select>
)}

            <label style={labelStyle}>사용자</label>
            <select
              value={editOwner}
              onChange={(e) => setEditOwner(e.target.value)}
              style={inputStyle}
            >
              {ownerNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>

            <label style={labelStyle}>날짜</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>메모</label>
            <textarea
              value={editMemo}
              onChange={(e) => setEditMemo(e.target.value)}
              placeholder="메모를 입력하세요"
              style={textareaStyle}
            />

            <div style={actionGridStyle}>
              <button
                onClick={() => deleteTransaction(selectedTx.id)}
                style={deleteButtonStyle}
              >
                <Trash2 size={16} />
                삭제
              </button>

              <button onClick={updateTransaction} style={saveButtonStyle}>
                저장
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function TopFilterButton({
  label,
  icon: Icon,
  active,
  color,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 68,
        borderRadius: 18,
        border: active ? `1px solid ${color}` : `1px solid ${theme.colors.border}`,
        background: active ? `${color}14` : "#FFFFFF",
        color: active ? color : theme.colors.subtext,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      <Icon size={19} />
      {label}
    </button>
  );
}

function EditTypeButton({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40,
        borderRadius: 14,
        border: active ? `1px solid ${color}` : `1px solid ${theme.colors.border}`,
        background: active ? `${color}15` : "#FFFFFF",
        color: active ? color : theme.colors.subtext,
        fontWeight: 900,
      }}
    >
      {label}
    </button>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#FFFFFF",
  padding: "14px 12px 82px",
  display: "flex",
  justifyContent: "center",
} as const;

const topFilterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 8,
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

const tabStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  fontWeight: 800,
  color: theme.colors.subtext,
  borderBottom: `1px solid ${theme.colors.border}`,
  paddingBottom: 10,
} as const;

const monthButtonStyle = {
  flex: 1,
  height: 42,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontWeight: 800,
} as const;

const smallMonthButtonStyle = {
  width: 38,
  height: 42,
  borderRadius: 14,
  border: `1px solid ${theme.colors.border}`,
  background: "white",
  display: "grid",
  placeItems: "center",
} as const;

const filterButtonStyle = {
  width: 42,
  height: 42,
  borderRadius: 14,
  border: `1px solid ${theme.colors.border}`,
  background: "white",
  display: "grid",
  placeItems: "center",
} as const;

const sectionTitleStyle = {
  fontSize: 13,
  fontWeight: 800,
  color: theme.colors.subtext,
  marginTop: 4,
} as const;

const txCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px",
  borderRadius: 18,
  border: `1px solid ${theme.colors.border}`,
  background: "white",
  cursor: "pointer",
} as const;

const iconBoxStyle = {
  width: 44,
  height: 44,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
} as const;

const memoTextStyle = {
  fontSize: 11,
  color: theme.colors.subtext,
  marginTop: 3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const emptyStyle = {
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 18,
  padding: 18,
  fontSize: 13,
  color: theme.colors.subtext,
  textAlign: "center",
} as const;

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(24,17,27,0.28)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 50,
  padding: 0,
} as const;

const sheetStyle = {
  width: "100%",
  maxWidth: 390,
  background: "white",
  borderRadius: "26px 26px 0 0",
  padding: "18px 18px 24px",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.16)",
} as const;

const sheetHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
} as const;

const plainButtonStyle = {
  border: "none",
  background: "transparent",
  padding: 4,
  cursor: "pointer",
} as const;

const editTypeGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 8,
  marginBottom: 14,
} as const;

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 900,
  color: theme.colors.subtext,
  margin: "12px 0 6px",
} as const;

const inputStyle = {
  width: "100%",
  height: 46,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  padding: "0 14px",
  fontSize: 15,
  fontWeight: 800,
  outline: "none",
  background: "#FFFFFF",
} as const;

const textareaStyle = {
  width: "100%",
  minHeight: 74,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
  padding: 14,
  resize: "none",
  outline: "none",
  fontSize: 14,
} as const;

const actionGridStyle = {
  display: "grid",
  gridTemplateColumns: "96px 1fr",
  gap: 10,
  marginTop: 16,
} as const;

const deleteButtonStyle = {
  height: 52,
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
  height: 52,
  border: "none",
  borderRadius: 18,
  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #A992FF 100%)`,
  color: "white",
  fontWeight: 900,
  fontSize: 15,
} as const;

const calendarBoxStyle = {
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 18,
  overflow: "hidden",
  background: "#FFFFFF",
} as const;

const weekGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  marginBottom: 8,
} as const;

const weekTextStyle = {
  textAlign: "center",
  fontSize: 11,
  fontWeight: 900,
  color: theme.colors.subtext,
} as const;

const calendarGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 0,
  borderTop: `1px solid ${theme.colors.border}`,
  borderLeft: `1px solid ${theme.colors.border}`,
} as const;


const calendarDayStyle = {
  minHeight: 76,
  background: "#FFFFFF",
  padding: "5px 4px",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  borderRight: `1px solid ${theme.colors.border}`,
  borderBottom: `1px solid ${theme.colors.border}`,
} as const;

const dayNumberStyle = {
  fontSize: 10,
  fontWeight: 800,
  color: theme.colors.subtext,
} as const;

const dayAmountStyle = {
  fontSize: 9,
  fontWeight: 900,
  color: theme.colors.expense,
  lineHeight: 1.1,
  wordBreak: "break-all",
} as const;

const dayIncomeStyle = {
  fontSize: 9,
  fontWeight: 900,
  color: theme.colors.income,
  lineHeight: 1.1,
  wordBreak: "break-all",
} as const;

const calendarDayButtonStyle = {
  minHeight: 76,
  background: "#FFFFFF",
  padding: "5px 4px",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  border: `1px solid ${theme.colors.border}`,
  borderTop: "none",
  borderLeft: "none",
  textAlign: "left",
} as const;

const dayDetailBoxStyle = {
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 18,
  padding: 12,
  background: "#FFFFFF",
} as const;

const dayDetailHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  marginBottom: 10,
} as const;

const amountBoxStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 4,
  minWidth: 72,
} as const;

const dateTextStyle = {
  fontSize: 10,
  color: theme.colors.subtext,
  fontWeight: 700,
  lineHeight: 1,
} as const;

const accountTextStyle = {
  fontSize: 11,
  color: theme.colors.primary,
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
} as const;

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsContent />
    </Suspense>
  );
}