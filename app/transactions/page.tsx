
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
  Coins,
  HandCoins,
  Trophy,
  Banknote,
  Store,
  Pencil,
  RefreshCw,
  Repeat,
  Zap,
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
import { getCurrentFamilyId } from "@/components/lib/familyCode";
import { useSwipeNav } from "@/components/lib/useSwipeNav";
import { useModalBack } from "@/components/lib/BackStackContext";

type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

const FILTER_ORDER = ["CALENDAR", "ALL", "INCOME", "EXPENSE", "TRANSFER", "STOCK"] as const;
type FilterType = (typeof FILTER_ORDER)[number];
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

/* ─── 아이콘 맵 ──────────────────────────────────────────── */
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
  이체: { icon: ArrowLeftRight, bg: "#EAF6FF" },
  자동이체: { icon: ArrowLeftRight, bg: "#EAF6FF" },
  카드대금: { icon: CreditCard, bg: "#EAF6FF" },
  저축이동: { icon: PiggyBank, bg: "#EAF6FF" },
  은행: { icon: Landmark, bg: "#EAF6FF" },
  "주식 매수": { icon: TrendingUp, bg: "#ECFFF6" },
  "주식 매도": { icon: TrendingDown, bg: "#FFF3F6" },
};

const iconKeyComponentMap: Record<string, any> = {
  home: { icon: Home, bg: "#EEF5FF" },
  utensils: { icon: Utensils, bg: "#FFF3F6" },
  coffee: { icon: Coffee, bg: "#F1FAF5" },
  shopping: { icon: ShoppingBag, bg: "#F4F0FF" },
  bus: { icon: Bus, bg: "#FFF8DF" },
  heart: { icon: Heart, bg: "#FFEAF3" },
  gamepad: { icon: Gamepad2, bg: "#F4F0FF" },
  film: { icon: Film, bg: "#F4F0FF" },
  gift: { icon: Gift, bg: "#FFF3F6" },
  hospital: { icon: Hospital, bg: "#EEF5FF" },
  book: { icon: BookOpen, bg: "#F4F0FF" },
  dumbbell: { icon: Dumbbell, bg: "#ECFFF6" },
  plane: { icon: Plane, bg: "#EEF5FF" },
  shirt: { icon: Shirt, bg: "#FFF8DF" },
  phone: { icon: Smartphone, bg: "#EEF5FF" },
  paw: { icon: PawPrint, bg: "#FFF3F6" },
  baby: { icon: Baby, bg: "#FFF8DF" },
  music: { icon: Music, bg: "#F4F0FF" },
  briefcase: { icon: Briefcase, bg: "#ECFFF6" },
  building: { icon: Landmark, bg: "#ECFFF6" },
  trending: { icon: TrendingUp, bg: "#ECFFF6" },
  card: { icon: CreditCard, bg: "#EAF6FF" },
  refresh: { icon: RefreshCw, bg: "#EAF6FF" },
  zap: { icon: Zap, bg: "#EAF6FF" },
  coins: { icon: Coins, bg: "#ECFFF6" },
  pencil: { icon: Pencil, bg: "#ECFFF6" },
  handcoins: { icon: HandCoins, bg: "#ECFFF6" },
  trophy: { icon: Trophy, bg: "#FFF8DF" },
  banknote: { icon: Banknote, bg: "#ECFFF6" },
  store: { icon: Store, bg: "#ECFFF6" },
};

const getIconData = (category: string, serverCategories: any[] = [], type?: string) => {
  if (category.includes("주식 매수")) return iconKeyMap["주식 매수"];
  if (category.includes("주식 매도")) return iconKeyMap["주식 매도"];
  if (category.includes("자산 수정")) return iconKeyMap["자산 수정"];
  const found = serverCategories.find((item) => item.name === category);
  if (found?.icon && iconKeyComponentMap[found.icon]) return iconKeyComponentMap[found.icon];
  if (iconKeyMap[category]) return iconKeyMap[category];
  if (type === "TRANSFER") return iconKeyMap["이체"];
  if (type === "INCOME") return iconKeyMap["급여"];
  if (type === "EXPENSE") return iconKeyMap["식비"];
  return iconKeyMap["이체"];
};

const typeColorMap: Record<string, string> = {
  EXPENSE: "#FF6B81",
  INCOME: "#4CD6A5",
  TRANSFER: "#5BB8F5",
  STOCK: "#F59E0B",
  ALL: theme.colors.primary,
  CALENDAR: theme.colors.primary,
};

const getBaseCategories = (type: TransactionType) => {
  if (type === "EXPENSE") return ["식비"];
  if (type === "INCOME") return ["수입", "배당금"];
  return ["이체"];
};

const getAccountOwnerLabel = (account: any) => {
  // 계좌 소유자는 고정이므로 DB의 실제 이름을 그대로 사용
  // role 기반 myName/partnerName 매핑은 현재 사용자에 따라 뒤집혀 버그 발생
  if (account.owner?.name) return account.owner.name;
  return "공동";
};

/* ─── 메인 컴포넌트 ──────────────────────────────────────── */
function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 페이지 전환 스와이프 (배경 전체)
  // 오른쪽 스와이프: 달력 뷰가 아니면 달력으로 먼저 복귀, 달력이면 홈으로 이동
  const pageSwipe = useSwipeNav({
    onSwipeLeft: () => router.push("/analysis"),
    onSwipeRight: () => {
      if (viewMode !== "CALENDAR") {
        setViewMode("CALENDAR");
        setFilterType("CALENDAR");
      } else {
        router.push("/");
      }
    },
  });

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [serverCategories, setServerCategories] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("CALENDAR");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("CALENDAR");

  const todayKey = toLocalDateKey(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(todayKey);
  const [monthStartDay, setMonthStartDay] = useState(1);
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [ownerNames, setOwnerNames] = useState(["공동"]);

  const [dayRange, setDayRange] = useState<number>(1);
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => new Date());
  const [pickerDragStart, setPickerDragStart] = useState<Date | null>(null);
  const [pickerDragEnd, setPickerDragEnd] = useState<Date | null>(null);

  const [dayDetailFilter, setDayDetailFilter] = useState<"ALL" | "INCOME" | "EXPENSE" | "TRANSFER" | "STOCK">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("전체");

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editFromAccountId, setEditFromAccountId] = useState("");
  const [editToAccountId, setEditToAccountId] = useState("");
  const [editType, setEditType] = useState<TransactionType>("EXPENSE");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("식비");
  const [editOwner, setEditOwner] = useState("공동");
  const [editDate, setEditDate] = useState("");
  const [editMemo, setEditMemo] = useState("");

  useModalBack(showFilterModal, () => setShowFilterModal(false));
  useModalBack(!!selectedTx, () => setSelectedTx(null));

  const activeColor = typeColorMap[filterType] || theme.colors.primary;
  const editActiveColor = typeColorMap[editType] || theme.colors.primary;

  /* ─── 데이터 로드 ── */
  const loadTransactions = async () => {
    const res = await fetch(`/api/transactions?familyId=${getCurrentFamilyId()}`);
    const data = await res.json();
    setTransactions(data);
  };

  const loadCategories = async () => {
    const res = await fetch(`/api/categories?familyId=${getCurrentFamilyId()}`);
    const data = await res.json();
    setServerCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadTransactions();
    loadCategories();
    fetch(`/api/accounts/simple?familyId=${getCurrentFamilyId()}`)
      .then((r) => r.json())
      .then((data) => setAccounts(Array.isArray(data) ? data : data.accounts || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const accountId = searchParams.get("accountId");
    if (accountId) {
      setSelectedAccountId(accountId);
      setViewMode("LIST");
      setDayRange(30); // 계좌 필터 진입 시 30일치 표시
    }
    const view = searchParams.get("view");
    if (view === "all") {
      setViewMode("LIST");
      setFilterType("ALL");
      // 오늘 기준으로 월 리셋 (이전에 다른 달 탐색 시 날짜 앵커가 오늘이 되도록)
      const savedStartDay = Number(localStorage.getItem("alien_month_start_day") || 1);
      setMonth(getBaseMonthByStartDay(new Date(), savedStartDay));
    }
  }, [searchParams]);

  useEffect(() => {
    const settings = getProfileSettings();
    const savedStartDay = getSavedMonthStartDay();
    setOwnerNames(settings.ownerNames);
    setMonthStartDay(savedStartDay);
    setMonth(getBaseMonthByStartDay(new Date(), savedStartDay));
  }, []);

  /* ─── 계산 ── */
  const monthRange = useMemo(() => getCustomMonthRange(month, monthStartDay), [month, monthStartDay]);
  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;
  const monthRangeLabel = formatMonthRangeLabel(monthRange.start, monthRange.end);

  // 오늘 기준 dayRange 계산 — 월 이동 시 같은 날짜를 해당 월에 적용
  const dayRangeAnchor = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getFullYear() * 12 + today.getMonth();
    const selMonth = month.getFullYear() * 12 + month.getMonth();
    const monthsDiff = todayMonth - selMonth; // 몇 달 전인지
    // 해당 월의 "오늘과 같은 날짜" (말일 초과 시 말일로 클램프)
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const anchorDay = Math.min(today.getDate(), lastDay);
    const end = new Date(month.getFullYear(), month.getMonth(), anchorDay, 23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - dayRange + 1);
    start.setHours(0, 0, 0, 0);
    const fmt = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    return { start, end, label: `${fmt(start)}~${fmt(end)}` };
  }, [month, dayRange]);
  const hasActiveFilter = !!selectedType || !!selectedAccountId;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: any) => {
      let inRange: boolean;
      if (viewMode === "LIST") {
        const txDate = new Date(tx.transactionAt);
        if (customRange) {
          inRange = txDate >= customRange.start && txDate <= customRange.end;
        } else {
          inRange = txDate >= dayRangeAnchor.start && txDate <= dayRangeAnchor.end;
        }
      } else {
        // 달력 뷰: 선택된 월 범위 전체
        inRange = isDateInRange(new Date(tx.transactionAt), monthRange.start, monthRange.end);
      }
      const topTypeMatch = filterType === "CALENDAR" || filterType === "ALL" ? true
        : filterType === "STOCK" ? (tx.category?.includes("주식 매수") || tx.category?.includes("주식 매도"))
        : tx.type === filterType;
      const modalTypeMatch = selectedType ? tx.type === selectedType : true;
      const accountMatch = selectedAccountId
        ? String(tx.fromAccountId) === selectedAccountId || String(tx.toAccountId) === selectedAccountId
        : true;
      return inRange && topTypeMatch && modalTypeMatch && accountMatch;
    });
  }, [transactions, filterType, viewMode, dayRange, monthRange, selectedType, selectedAccountId]);

  // ALL 뷰에서 사용 중인 EXPENSE 카테고리 목록 (실제 데이터 기준)
  const expenseCategoriesInView = useMemo(() => {
    if (filterType !== "ALL" || viewMode !== "LIST") return [];
    const cats = new Set<string>();
    filteredTransactions.forEach((tx: any) => {
      if (tx.type === "EXPENSE" && tx.category) cats.add(tx.category);
    });
    return Array.from(cats).sort();
  }, [filteredTransactions, filterType, viewMode]);

  // 카테고리 필터 적용된 최종 목록
  const displayedTransactions = useMemo(() => {
    if (filterType !== "ALL" || viewMode !== "LIST" || categoryFilter === "전체") {
      return filteredTransactions;
    }
    return filteredTransactions.filter((tx: any) =>
      tx.type === "EXPENSE" && (tx.category || "기타") === categoryFilter
    );
  }, [filteredTransactions, filterType, viewMode, categoryFilter]);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const start = new Date(monthRange.start);
    const end = new Date(monthRange.end);
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    const cursor = new Date(start);
    while (cursor <= end) { days.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
    return days;
  }, [monthRange.start, monthRange.end]);

  const getDaySummary = (day: Date) => {
    const dayKey = toLocalDateKey(day);
    const dayTxs = transactions.filter((tx) => toLocalDateKey(tx.transactionAt) === dayKey);
    const income = dayTxs.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + Number(tx.amount), 0);
    const expense = dayTxs.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + Number(tx.amount), 0);
    const transferCount = dayTxs.filter((tx) => tx.type === "TRANSFER").length;
    return { income, expense, transferCount };
  };

  const selectedDayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return transactions.filter((tx) => toLocalDateKey(tx.transactionAt) === selectedDay);
  }, [transactions, selectedDay]);

  /* ─── 액션 ── */
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

  const editCategories = useMemo(() => {
    const base = getBaseCategories(editType);
    const custom = serverCategories
      .filter((cat) => cat.type === editType)
      .map((cat) => cat.name)
      .filter((name, i, self) => !base.includes(name) && self.indexOf(name) === i);
    return [...base, ...custom];
  }, [editType, serverCategories]);

  const closeEditSheet = () => { setSelectedTx(null); setEditAmount(""); setEditMemo(""); };

  const changeEditType = (nextType: TransactionType) => {
    setEditType(nextType);
    setEditCategory(getBaseCategories(nextType)[0]);
  };

  const updateTransaction = async () => {
    if (!selectedTx) return;
    const res = await fetch("/api/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedTx.id,
        fromAccountId: editType === "INCOME" ? null : editFromAccountId ? Number(editFromAccountId) : null,
        toAccountId: editType === "EXPENSE" ? null : editType === "TRANSFER"
          ? (editToAccountId ? Number(editToAccountId) : null)
          : editType === "INCOME"
            ? (editToAccountId ? Number(editToAccountId) : null)
            : null,
        type: editType,
        amount: Number(editAmount),
        category: editCategory,
        owner: editOwner,
        memo: editMemo || null,
        transactionAt: new Date(editDate).toISOString(),
      }),
    });
    if (!res.ok) { alert("수정 실패"); return; }
    closeEditSheet();
    await loadTransactions();
  };

  const deleteTransaction = async (id: number) => {
    if (!confirm("이 거래를 삭제할까요?")) return;
    const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    if (!res.ok) { alert("삭제 실패"); return; }
    closeEditSheet();
    await loadTransactions();
  };

  const moveMonth = (value: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + value, 1));
    setSelectedDay(null);
    setDayDetailFilter("ALL");
  };

  const setTopFilter = (nextFilter: FilterType) => {
    setFilterType(nextFilter);
    setSelectedDay(null);
    setViewMode(nextFilter === "CALENDAR" ? "CALENDAR" : "LIST");
    if (nextFilter !== "ALL") setCategoryFilter("전체");
  };

  const moveFilter = (direction: "LEFT" | "RIGHT") => {
    const idx = FILTER_ORDER.indexOf(filterType);
    if (idx === -1) return;
    const next = direction === "LEFT" ? Math.min(idx + 1, FILTER_ORDER.length - 1) : Math.max(idx - 1, 0);
    setTopFilter(FILTER_ORDER[next]);
  };

  const handleTouchEnd = (endX: number, endY: number) => {
    if (touchStartX === null || touchStartY === null) return;
    const dx = touchStartX - endX;
    const dy = touchStartY - endY;
    // 수직 이동이 지배적이면 필터 전환 무시 (스크롤로 판단)
    if (Math.abs(dy) > Math.abs(dx)) {
      setTouchStartX(null);
      setTouchStartY(null);
      return;
    }
    if (Math.abs(dx) >= 60) moveFilter(dx > 0 ? "LEFT" : "RIGHT");
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const formatAmount = (tx: Transaction) => {
    const sign = tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : "";
    return `${sign}₩${Math.abs(Number(tx.amount)).toLocaleString()}`;
  };

  const formatDateShort = (value: string) => {
    const d = new Date(value);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  const getAccountText = (tx: Transaction) => {
    const fromName = tx.fromAccount?.name;
    const toName = tx.toAccount?.name;
    if (tx.type === "TRANSFER") return fromName && toName ? `${fromName} → ${toName}` : "이체 계좌";
    if (tx.type === "INCOME") return toName || "입금 계좌";
    return fromName || "출금 계좌";
  };

  const getTypeColor = (type: TransactionType) => typeColorMap[type] || theme.colors.primary;

  /* ─── 월 합계 ── */
  const monthIncome = filteredTransactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = filteredTransactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  /* ─── 렌더 ── */
  return (
    <main
      {...pageSwipe}
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${activeColor}28 0%, ${activeColor}10 30%, #f8f6ff 65%, #ffffff 100%)`,
        padding: "calc(env(safe-area-inset-top) + 90px) 0 calc(90px + env(safe-area-inset-bottom))",
        display: "flex",
        justifyContent: "center",
        transition: "background 0.4s ease",
      }}
    >
      <div style={{ width: "100%", maxWidth: 390, display: "flex", flexDirection: "column" }}>

        {/* ── 헤더 + 필터 (고정) ── */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(247, 245, 255, 0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #F0EAFF", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 390 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top) + 12px) 18px 6px",
        }}>
          <button onClick={() => router.back()} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "grid", placeItems: "center" }}>
            <ChevronLeft size={22} color="#2D2545" />
          </button>
          <strong style={{ fontSize: 17, fontWeight: 900, color: "#2D2545", letterSpacing: -0.5 }}>거래내역</strong>
          <div style={{ width: 36 }} />
        </div>

        {/* ── 필터 pills ── */}
        <div style={{ display: "flex", gap: 6, margin: "0 16px", paddingTop: 8, paddingBottom: 12 }}>
          {(["CALENDAR", "ALL", "INCOME", "EXPENSE", "TRANSFER", "STOCK"] as const).map((f) => {
            const labels: Record<string, string> = { CALENDAR: "📅", ALL: "전체", INCOME: "수입", EXPENSE: "지출", TRANSFER: "이체", STOCK: "주식" };
            const color = typeColorMap[f];
            const active = filterType === f;
            return (
              <button key={f} onClick={() => setTopFilter(f)} style={{
                flex: 1, height: 34, padding: 0, borderRadius: 999,
                fontSize: 11, fontWeight: 800, cursor: "pointer",
                border: active ? `1.5px solid ${color}` : "1.5px solid #E8E1F5",
                background: active ? `${color}18` : "rgba(255,255,255,0.8)",
                color: active ? color : "#A59DBD",
                transition: "all 0.18s",
              }}>{labels[f]}</button>
            );
          })}
        </div>
        </div>{/* /maxWidth */}
        </div>{/* /fixed header */}

        {/* ── 월 이동 + 요약 카드 ── */}
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{
            background: "white",
            borderRadius: 22,
            border: "1px solid #EDE6F9",
            boxShadow: "0 6px 20px rgba(167,139,250,0.10)",
            padding: "14px 16px",
          }}>
            {/* 월 이동 — LIST/CALENDAR 모두 표시 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <button onClick={() => moveMonth(-1)} style={navBtnStyle}>
                <ChevronLeft size={16} color="#A59DBD" />
              </button>
              <button
                style={{ flex: 1, height: 38, borderRadius: 14, border: "1px solid #EDE6F9", background: "#FAFAFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 800, fontSize: 14, color: "#2D2545", cursor: "pointer" }}
                onClick={() => {
                  const today = new Date();
                  setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDay(todayKey);
                }}
              >
                {monthLabel}
                <span style={{ fontSize: 10, color: "#B0A8C8", fontWeight: 600 }}>
                  {viewMode === "LIST"
                    ? customRange
                      ? `${String(customRange.start.getMonth()+1).padStart(2,"0")}/${String(customRange.start.getDate()).padStart(2,"0")}~${String(customRange.end.getMonth()+1).padStart(2,"0")}/${String(customRange.end.getDate()).padStart(2,"0")}`
                      : dayRangeAnchor.label
                    : monthRangeLabel}
                </span>
                <ChevronDown size={14} color="#B0A8C8" />
              </button>
              <button onClick={() => moveMonth(1)} style={navBtnStyle}>
                <ChevronRight size={16} color="#A59DBD" />
              </button>
            </div>

            {/* 날짜 범위 필터 칩 — LIST 뷰 전용 */}
            {viewMode === "LIST" && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 7, marginBottom: 12 }}>
                {([1, 3, 7] as const).map((d) => {
                  const active = !customRange && dayRange === d;
                  return (
                    <button
                      key={d}
                      onClick={() => { setDayRange(d); setCustomRange(null); }}
                      style={{
                        height: 28, padding: "0 12px", borderRadius: 999,
                        fontSize: 12, fontWeight: 800, cursor: "pointer",
                        border: active ? `1.5px solid ${activeColor}` : "1.5px solid #E8E1F5",
                        background: active ? `${activeColor}18` : "#FAFAFF",
                        color: active ? activeColor : "#A59DBD",
                        transition: "all 0.18s",
                      }}
                    >
                      {d}D
                    </button>
                  );
                })}
                {/* 달력 아이콘 버튼 + 선택된 날짜 라벨 */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={() => { setShowDatePicker(true); setPickerMonth(new Date()); setPickerDragStart(null); setPickerDragEnd(null); }}
                    style={{
                      height: 28, width: 28, borderRadius: 999,
                      display: "grid", placeItems: "center", cursor: "pointer",
                      border: customRange ? `1.5px solid ${activeColor}` : "1.5px solid #E8E1F5",
                      background: customRange ? `${activeColor}18` : "#FAFAFF",
                      color: customRange ? activeColor : "#A59DBD",
                    }}
                  >
                    <CalendarDays size={14} />
                  </button>
                  {customRange && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: activeColor }}>
                      {`${customRange.start.getMonth()+1}/${customRange.start.getDate()}~${customRange.end.getMonth()+1}/${customRange.end.getDate()}`}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 달력 날짜범위 선택 모달 */}
            {showDatePicker && (
              <div
                style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
                onClick={() => setShowDatePicker(false)}
              >
                <div
                  style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: `20px 16px calc(env(safe-area-inset-bottom) + 80px)`, width: "100%", maxWidth: 390 }}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  {/* 헤더 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18 }}>‹</button>
                    <strong style={{ fontSize: 14 }}>{pickerMonth.getFullYear()}년 {pickerMonth.getMonth() + 1}월</strong>
                    <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18 }}>›</button>
                  </div>
                  {/* 요일 */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center", marginBottom: 6 }}>
                    {["일","월","화","수","목","금","토"].map(d => <span key={d} style={{ fontSize: 11, color: "#A59DBD", fontWeight: 700 }}>{d}</span>)}
                  </div>
                  {/* 날짜 그리드 */}
                  {(() => {
                    const firstDay = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1).getDay();
                    const daysInMonth = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 0).getDate();
                    const cells: (Date | null)[] = Array(firstDay).fill(null);
                    for (let i = 1; i <= daysInMonth; i++) {
                      cells.push(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), i));
                    }
                    // 터치 이벤트로 드래그 범위 계산
                    const getDateFromTouch = (e: React.TouchEvent) => {
                      const touch = e.touches[0] || e.changedTouches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY);
                      const attr = el?.getAttribute("data-date");
                      return attr ? new Date(attr) : null;
                    };
                    const rangeStart = pickerDragStart && pickerDragEnd
                      ? (pickerDragStart <= pickerDragEnd ? pickerDragStart : pickerDragEnd)
                      : pickerDragStart;
                    const rangeEnd = pickerDragStart && pickerDragEnd
                      ? (pickerDragStart <= pickerDragEnd ? pickerDragEnd : pickerDragStart)
                      : pickerDragStart;
                    const inPickerRange = (d: Date) => rangeStart && rangeEnd
                      ? d >= rangeStart && d <= rangeEnd : false;
                    return (
                      <div
                        style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px 0", userSelect: "none", touchAction: "none" }}
                        onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); const d = getDateFromTouch(e); if (d) { setPickerDragStart(d); setPickerDragEnd(d); } }}
                        onTouchMove={(e) => { e.stopPropagation(); e.preventDefault(); const d = getDateFromTouch(e); if (d && pickerDragStart) setPickerDragEnd(d); }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (pickerDragStart && pickerDragEnd) {
                            const s = new Date(pickerDragStart <= pickerDragEnd ? pickerDragStart : pickerDragEnd);
                            const en = new Date(pickerDragStart <= pickerDragEnd ? pickerDragEnd : pickerDragStart);
                            s.setHours(0, 0, 0, 0);
                            en.setHours(23, 59, 59, 999);
                            setCustomRange({ start: s, end: en });
                            setShowDatePicker(false);
                          }
                        }}
                      >
                        {cells.map((d, i) => {
                          if (!d) return <div key={`empty-${i}`} />;
                          const isInRange = inPickerRange(d);
                          const isStart = rangeStart && d.toDateString() === rangeStart.toDateString();
                          const isEnd = rangeEnd && d.toDateString() === rangeEnd.toDateString();
                          return (
                            <div
                              key={d.toISOString()}
                              data-date={d.toISOString()}
                              style={{
                                height: 36, display: "grid", placeItems: "center",
                                fontSize: 13, fontWeight: isStart || isEnd ? 900 : 600,
                                borderRadius: isStart || isEnd ? "50%" : 0,
                                background: isStart || isEnd ? activeColor : isInRange ? `${activeColor}25` : "transparent",
                                color: isStart || isEnd ? "#fff" : isInRange ? activeColor : "#3D3558",
                                cursor: "pointer",
                              }}
                            >
                              {d.getDate()}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {pickerDragStart && (
                    <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#A59DBD" }}>
                      드래그해서 범위를 선택하세요
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 수입/지출 요약 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#ECFFF6", borderRadius: 16, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#4CD6A5", marginBottom: 4 }}>수입</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#10B981" }}>+{monthIncome.toLocaleString()}원</div>
              </div>
              <div style={{ background: "#FFF3F6", borderRadius: 16, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#FF6B81", marginBottom: 4 }}>지출</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#FF3B70" }}>-{monthExpense.toLocaleString()}원</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 메인 콘텐츠 (필터 스와이프 전용 — 페이지 스와이프와 분리) ── */}
        <div
          style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}
          onTouchStart={(e) => { e.stopPropagation(); setTouchStartX(e.touches[0].clientX); setTouchStartY(e.touches[0].clientY); }}
          onTouchEnd={(e) => { e.stopPropagation(); handleTouchEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }}
        >
          {/* 건수 레이블 + 카테고리 필터 (ALL + LIST 전용) */}
          {viewMode === "LIST" && (
            <div>
              {filterType === "ALL" && expenseCategoriesInView.length > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  overflowX: "auto", paddingBottom: 4,
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                } as React.CSSProperties}>
                  <SlidersHorizontal size={14} color="#A59DBD" style={{ flexShrink: 0 }} />
                  {["전체", ...expenseCategoriesInView].map((cat) => {
                    const active = categoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        style={{
                          flexShrink: 0,
                          height: 28, padding: "0 12px",
                          borderRadius: 999, fontSize: 11, fontWeight: 800,
                          border: active ? "1.5px solid #FF6B81" : "1.5px solid #E8E1F5",
                          background: active ? "#FFF0F3" : "rgba(255,255,255,0.8)",
                          color: active ? "#FF6B81" : "#A59DBD",
                          cursor: "pointer", whiteSpace: "nowrap",
                        }}
                      >{cat}</button>
                    );
                  })}
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 800, color: "#B0A8C8", paddingLeft: 2, marginTop: filterType === "ALL" && expenseCategoriesInView.length > 0 ? 6 : 0 }}>
                {filterType === "ALL"
                  ? (categoryFilter === "전체" ? "전체" : categoryFilter)
                  : filterType === "INCOME" ? "수입"
                  : filterType === "EXPENSE" ? "지출"
                  : "이체"} {displayedTransactions.length}건
              </div>
            </div>
          )}

          {viewMode === "CALENDAR" ? (
            <>
              {/* 달력 카드 */}
              <div style={{
                background: "white", borderRadius: 24,
                border: "1px solid #EDE6F9",
                boxShadow: "0 6px 24px rgba(167,139,250,0.10)",
                overflow: "hidden",
              }}>
                {/* 요일 헤더 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#F7F3FE", borderBottom: "1px solid #EDE6F9" }}>
                  {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                    <div key={d} style={{ textAlign: "center", padding: "9px 0", fontSize: 11, fontWeight: 800, color: "#B0A8C8" }}>{d}</div>
                  ))}
                </div>

                {/* 날짜 그리드 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={`blank-${idx}`} style={{ minHeight: 62, borderTop: "1px solid #F0EBF9" }} />;
                    const dayKey = toLocalDateKey(day);
                    const summary = getDaySummary(day);
                    const activeDay = selectedDay === dayKey;
                    const isToday = dayKey === todayKey;
                    return (
                      <button
                        key={dayKey}
                        onClick={() => { setSelectedDay(activeDay ? null : dayKey); setDayDetailFilter("ALL"); }}
                        style={{
                          width: "100%", minHeight: 62, padding: "4px 3px",
                          borderTop: "1px solid #F0EBF9", borderLeft: "none", borderRight: "none", borderBottom: "none",
                          background: activeDay ? "#F4EFFE" : "white",
                          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                          borderRadius: 0,
                          outline: isToday ? `2px solid ${theme.colors.primary}` : "none",
                          outlineOffset: -2,
                        }}
                      >
                        <strong style={{
                          fontSize: 11, fontWeight: isToday ? 900 : 700,
                          color: isToday ? theme.colors.primary : activeDay ? "#6D28D9" : "#2D2545",
                          padding: "0 2px",
                        }}>{day.getDate()}</strong>
                        {summary.income > 0 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#10B981", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", paddingLeft: 2 }}>
                            +{summary.income.toLocaleString()}
                          </span>
                        )}
                        {summary.expense > 0 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#FF3B70", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", paddingLeft: 2 }}>
                            -{summary.expense.toLocaleString()}
                          </span>
                        )}
                        {summary.transferCount > 0 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#5BB8F5", paddingLeft: 2 }}>
                            ↔{summary.transferCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 선택된 날짜 거래 */}
              {selectedDay && (() => {
                const visibleTxs = dayDetailFilter === "ALL"
                  ? selectedDayTransactions
                  : dayDetailFilter === "STOCK"
                  ? selectedDayTransactions.filter((tx) => tx.category?.includes("주식 매수") || tx.category?.includes("주식 매도"))
                  : selectedDayTransactions.filter((tx) => tx.type === dayDetailFilter);
                const typeColors: Record<string, string> = { INCOME: "#4CD6A5", EXPENSE: "#FF6B81", TRANSFER: "#5BB8F5", STOCK: "#F59E0B" };
                return (
                  <div style={{
                    background: "white", borderRadius: 24,
                    border: "1px solid #EDE6F9",
                    boxShadow: "0 4px 16px rgba(167,139,250,0.08)",
                    overflow: "hidden",
                  }}>
                    {/* 헤더 */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 18px 10px",
                    }}>
                      <strong style={{ fontSize: 14, fontWeight: 900, color: "#2D2545" }}>
                        {selectedDay.slice(5, 7)}월 {selectedDay.slice(8, 10)}일 상세내역
                      </strong>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#B0A8C8" }}>{selectedDayTransactions.length}건</span>
                    </div>

                    {/* 타입 필터 칩 */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "0 18px 10px" }}>
                      {(["ALL", "INCOME", "EXPENSE", "TRANSFER", "STOCK"] as const).map((f) => {
                        const labels = { ALL: "전체", INCOME: "수입", EXPENSE: "지출", TRANSFER: "이체", STOCK: "주식" };
                        const color = f === "ALL" ? theme.colors.primary : typeColors[f];
                        const active = dayDetailFilter === f;
                        return (
                          <button key={f} onClick={() => setDayDetailFilter(f)} style={{
                            height: 26, padding: "0 11px", borderRadius: 999,
                            fontSize: 11, fontWeight: 800, cursor: "pointer",
                            border: active ? `1.5px solid ${color}` : "1.5px solid #E8E1F5",
                            background: active ? `${color}18` : "#FAFAFF",
                            color: active ? color : "#B0A8C8",
                            transition: "all 0.15s",
                          }}>{labels[f]}</button>
                        );
                      })}
                    </div>

                    <div style={{ borderTop: "1px solid #F0EBF9" }} />

                    {visibleTxs.length === 0 ? (
                      <div style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "#C4B8D8" }}>거래내역이 없습니다</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {visibleTxs.map((tx, i) => (
                          <TxRow key={tx.id} tx={tx} serverCategories={serverCategories}
                            getTypeColor={getTypeColor} formatAmount={formatAmount}
                            getAccountText={getAccountText} formatDateShort={formatDateShort}
                            onPress={() => openEditSheet(tx)}
                            divider={i < visibleTxs.length - 1}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            /* 리스트 뷰 */
            <>
              {displayedTransactions.length === 0 ? (
                <div style={{
                  background: "white", borderRadius: 22, border: "1px solid #EDE6F9",
                  padding: "32px 20px", textAlign: "center", fontSize: 13, color: "#C4B8D8",
                }}>해당 월의 거래내역이 없습니다</div>
              ) : (
                <div style={{
                  background: "white", borderRadius: 24, border: "1px solid #EDE6F9",
                  boxShadow: "0 4px 16px rgba(167,139,250,0.08)", overflow: "hidden",
                }}>
                  {displayedTransactions.map((tx, i) => (
                    <TxRow key={tx.id} tx={tx} serverCategories={serverCategories}
                      getTypeColor={getTypeColor} formatAmount={formatAmount}
                      getAccountText={getAccountText} formatDateShort={formatDateShort}
                      onPress={() => openEditSheet(tx)}
                      divider={i < displayedTransactions.length - 1}
                      showDate
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <BottomNav />
      </div>

      {/* ── 상세 필터 모달 ── */}
      {showFilterModal && (
        <div style={overlayStyle} onClick={() => setShowFilterModal(false)}>
          <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={sheetHandleStyle} />
            <div style={sheetHeaderStyle}>
              <strong style={{ fontSize: 16, fontWeight: 900, color: "#2D2545" }}>상세 필터</strong>
              <button onClick={() => setShowFilterModal(false)} style={iconBtnStyle}><X size={18} color="#A59DBD" /></button>
            </div>

            <label style={sheetLabelStyle}>거래 유형</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={sheetInputStyle}>
              <option value="">전체</option>
              <option value="INCOME">수입</option>
              <option value="EXPENSE">지출</option>
              <option value="TRANSFER">이체</option>
            </select>

            <label style={sheetLabelStyle}>계좌 선택</label>
            <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} style={sheetInputStyle}>
              <option value="">전체 계좌</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{getAccountOwnerLabel(a)} · {a.name}</option>
              ))}
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
              <button onClick={() => { setSelectedType(""); setSelectedAccountId(""); }} style={resetBtnStyle}>초기화</button>
              <button onClick={() => setShowFilterModal(false)} style={applyBtnStyle}>적용하기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 거래 수정 시트 ── */}
      {selectedTx && (
        <div style={overlayStyle} onClick={closeEditSheet}>
          <div style={{ ...sheetStyle, maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={sheetHandleStyle} />
            <div style={sheetHeaderStyle}>
              <strong style={{ fontSize: 16, fontWeight: 900, color: "#2D2545" }}>거래 수정</strong>
              <button onClick={closeEditSheet} style={iconBtnStyle}><X size={18} color="#A59DBD" /></button>
            </div>

            {/* 타입 토글 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
              {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => {
                const c = typeColorMap[t];
                const active = editType === t;
                const labels: Record<string, string> = { EXPENSE: "지출", INCOME: "수입", TRANSFER: "이체" };
                return (
                  <button key={t} onClick={() => changeEditType(t)} style={{
                    height: 42, borderRadius: 16,
                    border: active ? `1.5px solid ${c}` : "1.5px solid #E8E1F5",
                    background: active ? `${c}15` : "white",
                    color: active ? c : "#B0A8C8",
                    fontWeight: 900, fontSize: 14, cursor: "pointer",
                  }}>{labels[t]}</button>
                );
              })}
            </div>

            <label style={sheetLabelStyle}>금액</label>
            <input
              value={Number(editAmount || 0).toLocaleString()}
              onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9]/g, ""))}
              style={{ ...sheetInputStyle, borderColor: `${editActiveColor}40` }}
            />

            {editType !== "TRANSFER" && (
              <>
                <label style={sheetLabelStyle}>카테고리</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ ...sheetInputStyle, borderColor: `${editActiveColor}40` }}>
                  {editCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </>
            )}

            <label style={sheetLabelStyle}>
              {editType === "TRANSFER" ? "이체 계좌" : editType === "INCOME" ? "입금 계좌" : "출금 계좌"}
            </label>
            {editType === "TRANSFER" ? (
              <div style={{ display: "grid", gap: 8 }}>
                <select value={editFromAccountId} onChange={(e) => setEditFromAccountId(e.target.value)} style={sheetInputStyle}>
                  <option value="">출금 계좌 선택</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>출금 · {getAccountOwnerLabel(a)} · {a.name}</option>)}
                </select>
                <select value={editToAccountId} onChange={(e) => setEditToAccountId(e.target.value)} style={sheetInputStyle}>
                  <option value="">입금 계좌 선택</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>입금 · {getAccountOwnerLabel(a)} · {a.name}</option>)}
                </select>
              </div>
            ) : (
              <select
                value={editType === "INCOME" ? editToAccountId : editFromAccountId}
                onChange={(e) => {
                  if (editType === "INCOME") { setEditToAccountId(e.target.value); setEditFromAccountId(""); }
                  else { setEditFromAccountId(e.target.value); setEditToAccountId(""); }
                }}
                style={sheetInputStyle}
              >
                <option value="">계좌 선택</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{getAccountOwnerLabel(a)} · {a.name}</option>)}
              </select>
            )}

            <label style={sheetLabelStyle}>사용자</label>
            <select value={editOwner} onChange={(e) => setEditOwner(e.target.value)} style={sheetInputStyle}>
              {ownerNames.map((name) => <option key={name}>{name}</option>)}
            </select>

            <label style={sheetLabelStyle}>날짜</label>
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={sheetInputStyle} />

            <label style={sheetLabelStyle}>메모</label>
            <textarea
              value={editMemo} onChange={(e) => setEditMemo(e.target.value)}
              placeholder="메모를 입력하세요"
              style={{ ...sheetInputStyle, height: "auto", minHeight: 72, padding: 14, resize: "none" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 10, marginTop: 20 }}>
              <button onClick={() => deleteTransaction(selectedTx.id)} style={resetBtnStyle}>
                <Trash2 size={15} /> 삭제
              </button>
              <button onClick={updateTransaction} style={{
                ...applyBtnStyle,
                background: `linear-gradient(135deg, ${editActiveColor} 0%, ${theme.colors.primary} 100%)`,
              }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─── 거래 행 컴포넌트 ─────────────────────────────────────── */
function TxRow({
  tx, serverCategories, getTypeColor, formatAmount, getAccountText, formatDateShort, onPress, divider, showDate,
}: {
  tx: Transaction;
  serverCategories: any[];
  getTypeColor: (t: any) => string;
  formatAmount: (t: Transaction) => string;
  getAccountText: (t: Transaction) => string;
  formatDateShort: (v: string) => string;
  onPress: () => void;
  divider?: boolean;
  showDate?: boolean;
}) {
  const iconData = getIconData(tx.category, serverCategories, tx.type);
  const Icon = iconData.icon;
  const color = getTypeColor(tx.type);

  return (
    <div
      onClick={onPress}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 18px",
        borderBottom: divider ? "1px solid #F5F1FC" : "none",
        cursor: "pointer",
        background: "white",
        transition: "background 0.15s",
      }}
    >
      {/* 아이콘 */}
      <div style={{
        width: 44, height: 44, borderRadius: 16,
        background: iconData.bg, display: "grid", placeItems: "center", flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#2D2545", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tx.category === "자산 수정"
            ? "자산 수정"
            : `${mapOwnerName(tx.owner)} · ${tx.category || (tx.type === "TRANSFER" ? "이체" : tx.type === "INCOME" ? "수입" : "지출")}`}
        </div>
        <div style={{ fontSize: 11, color: "#B0A8C8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {getAccountText(tx)}
        </div>
        {tx.memo && (
          <div style={{ fontSize: 11, color: "#C4B8D8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tx.memo}
          </div>
        )}
      </div>

      {/* 금액 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        {showDate && <span style={{ fontSize: 11, fontWeight: 700, color: "#C4B8D8" }}>{formatDateShort(tx.transactionAt)}</span>}
        <strong style={{ fontSize: 14, fontWeight: 900, color, lineHeight: 1.1 }}>{formatAmount(tx)}</strong>
      </div>
    </div>
  );
}

/* ─── 스타일 상수 ────────────────────────────────────────── */
const navBtnStyle = {
  width: 36, height: 38, borderRadius: 12,
  border: "1px solid #EDE6F9", background: "#FAFAFF",
  display: "grid", placeItems: "center", cursor: "pointer",
} as const;

const overlayStyle = {
  position: "fixed", inset: 0,
  background: "rgba(45,37,69,0.35)",
  display: "flex", alignItems: "flex-end", justifyContent: "center",
  zIndex: 1000, backdropFilter: "blur(2px)",
} as const;

const sheetStyle = {
  width: "100%", maxWidth: 390,
  background: "white",
  borderRadius: "28px 28px 0 0",
  padding: "0 20px 40px",
  boxShadow: "0 -8px 40px rgba(124,92,255,0.15)",
} as const;

const sheetHandleStyle = {
  width: 40, height: 4, borderRadius: 2, background: "#E0D9F5",
  margin: "14px auto 0",
} as const;

const sheetHeaderStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "16px 0 14px",
} as const;

const iconBtnStyle = {
  border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "grid", placeItems: "center",
} as const;

const sheetLabelStyle = {
  display: "block", fontSize: 11, fontWeight: 800, color: "#B0A8C8",
  margin: "14px 0 6px", textTransform: "uppercase" as const, letterSpacing: 0.5,
} as const;

const sheetInputStyle = {
  width: "100%", height: 48,
  borderRadius: 16, border: "1.5px solid #EDE6F9",
  padding: "0 14px", fontSize: 14, fontWeight: 700, color: "#2D2545",
  outline: "none", background: "#FAFAFF", boxSizing: "border-box" as const,
} as const;

const resetBtnStyle = {
  height: 52, border: "none", borderRadius: 18,
  background: "#FFF3F6", color: "#FF6B81",
  fontWeight: 900, fontSize: 14, cursor: "pointer",
} as const;

const applyBtnStyle = {
  height: 52, border: "none", borderRadius: 18,
  background: "linear-gradient(135deg, #7C5CFF, #A992FF)",
  color: "white", fontWeight: 900, fontSize: 15, cursor: "pointer",
} as const;

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F7F5FF" }} />}>
      <TransactionsContent />
    </Suspense>
  );
}
