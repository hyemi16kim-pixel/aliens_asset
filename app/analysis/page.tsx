"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import SpendingCategoryCard from "@/components/dashboard/SpendingCategoryCard";
import { ChevronLeft } from "lucide-react";
import { theme } from "@/components/lib/theme";
import { getCurrentFamilyId, getCurrentFamilyCode, getCurrentUserId } from "@/components/lib/familyCode";
import { useKeyboardOffset, scrollInputIntoView } from "@/components/lib/useKeyboardOffset";
import AssetAccountGrid from "@/components/analysis/AssetAccountGrid";
import StockHoldingList from "@/components/analysis/StockHoldingList";
import { Suspense } from "react";

import { TrendingUp, TrendingDown } from "lucide-react";
import {
  formatMonthRangeLabel,
  getBaseMonthByStartDay,
  getCustomMonthRange,
  getSavedMonthStartDay,
  isDateInRange,
} from "@/components/lib/monthRange";
import { useSwipeNav } from "@/components/lib/useSwipeNav";

import {
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
  ChevronRight,
  Baby,
  Music,
  Briefcase,
  Landmark,
  PiggyBank,
  ArrowDownCircle,
  CreditCard,
  Sparkles,
  Utensils,
  Coffee,
  ShoppingBag,
  Bus,
  Home,
  Heart,
  Wallet,
  ArrowLeftRight,
  Building2,
  RefreshCw,
  Zap,
  Coins,
  Pencil,
  HandCoins,
  Trophy,
  Banknote,
  Store,
  ShoppingCart,
} from "lucide-react";
import { useModalBack } from "@/components/lib/BackStackContext";

// English icon key → Lucide component (profile page stores English keys in DB)
const englishIconMap: Record<string, React.ElementType> = {
  home: Home, utensils: Utensils, coffee: Coffee, shopping: ShoppingBag,
  bus: Bus, heart: Heart, gamepad: Gamepad2, film: Film, gift: Gift,
  hospital: Hospital, book: BookOpen, dumbbell: Dumbbell, plane: Plane,
  shirt: Shirt, phone: Smartphone, paw: PawPrint, baby: Baby, music: Music,
  briefcase: Briefcase, building: Building2, trending: TrendingUp,
  card: CreditCard, refresh: RefreshCw, zap: Zap, coins: Coins,
  pencil: Pencil, handcoins: HandCoins, trophy: Trophy, banknote: Banknote,
  store: Store, wallet: Wallet, landmark: Landmark, piggybank: PiggyBank,
  shoppingcart: ShoppingCart,
};

const categoryIconMap = [
  { key: "식비", icon: Utensils, bg: "#FFF3F6" },
  { key: "카페", icon: Coffee, bg: "#F1FAF5" },
  { key: "쇼핑", icon: ShoppingBag, bg: "#F4F0FF" },
  { key: "교통", icon: Bus, bg: "#FFF8DF" },
  { key: "생활", icon: Home, bg: "#EEF5FF" },
  { key: "데이트", icon: Heart, bg: "#FFEAF3" },
  { key: "게임", icon: Gamepad2, bg: "#F4F0FF" },
  { key: "영화", icon: Film, bg: "#F4F0FF" },
  { key: "선물", icon: Gift, bg: "#FFF3F6" },
  { key: "병원", icon: Hospital, bg: "#EEF5FF" },
  { key: "공부", icon: BookOpen, bg: "#F4F0FF" },
  { key: "운동", icon: Dumbbell, bg: "#ECFFF6" },
  { key: "여행", icon: Plane, bg: "#EEF5FF" },
  { key: "의류", icon: Shirt, bg: "#FFF8DF" },
  { key: "통신", icon: Smartphone, bg: "#EEF5FF" },
  { key: "반려", icon: PawPrint, bg: "#FFF3F6" },
  { key: "육아", icon: Baby, bg: "#FFF8DF" },
  { key: "음악", icon: Music, bg: "#F4F0FF" },
  { key: "급여", icon: Briefcase, bg: "#ECFFF6" },
  { key: "보너스", icon: Gift, bg: "#ECFFF6" },
  { key: "용돈", icon: Wallet, bg: "#ECFFF6" },
  { key: "이자", icon: Landmark, bg: "#ECFFF6" },
  { key: "배당", icon: PiggyBank, bg: "#ECFFF6" },
  { key: "환급", icon: ArrowDownCircle, bg: "#ECFFF6" },
  { key: "이체", icon: ArrowLeftRight, bg: "#F4F0FF" },
  { key: "자동이체", icon: ArrowLeftRight, bg: "#F4F0FF" },
  { key: "카드대금", icon: CreditCard, bg: "#F4F0FF" },
  { key: "저축이동", icon: PiggyBank, bg: "#F4F0FF" },
  { key: "은행", icon: Landmark, bg: "#F4F0FF" },
  { key: "자산 수정", icon: Sparkles, bg: "#FFF3F6" },
  { key: "주식 매수", icon: TrendingUp, bg: "#ECFFF6" },
  { key: "주식 매도", icon: TrendingDown, bg: "#FFF3F6" },
  { key: "자산 수정", icon: Sparkles, bg: "#F4F0FF" },
];

const getCustomCategoryIcon = (categoryName: string) => {
  try {
    if (categoryName.includes("주식 매수")) {
      return (
        categoryIconMap.find((icon) => icon.key === "주식 매수") ||
        categoryIconMap[0]
      );
    }

    if (categoryName.includes("주식 매도")) {
      return (
        categoryIconMap.find((icon) => icon.key === "주식 매도") ||
        categoryIconMap[0]
      );
    }
    if (categoryName.includes("자산 수정")) {
      return (
        categoryIconMap.find((icon) => icon.key === "자산 수정") ||
        categoryIconMap[0]
      );
    }
    
    if (typeof window === "undefined") {
      return categoryIconMap[0];
    }

    const keys = ["EXPENSE", "INCOME", "TRANSFER"];

    for (const key of keys) {
      const saved = localStorage.getItem(`alien_custom_categories_${key}`);
      const list = saved ? JSON.parse(saved) : [];

      const found = list.find((item: any) => item.name === categoryName);

      if (found) {
const icon = categoryIconMap.find(
  (icon) => icon.key === found.iconKey
);
        if (icon) return icon;
      }
    }

    return categoryIconMap[0];
  } catch (e) {
    return categoryIconMap[0];
  }
};

type Transaction = {
  id: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  owner?: string | null;
  transactionAt: string;
  category?: string | null;
  memo?: string | null;
};

type Account = {
  id: number;
  name: string;
  stockCash?: number | null;
  type: string;
  balance: number;
  
  color?: string | null;
  cardPaymentDay?: number | null;
  cardCycleStartDay?: number | null;
  cardCycleEndDay?: number | null;
  nextPaymentDate?: string | null;
  nextPaymentAmount?: number | null;
  nextMonthAmount?: number | null;
  maturityDate?: string | null;
  monthlyPayment?: number | null;
  sourceKey?: string | null;
  
  displayOrder?: number;
  ownerId?: number | null;
  owner?: {
    id: number;
    name: string;
    role?: string;
  } | null;
};

function AnalysisPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<"ASSET" | "SPENDING" | "TREND">(
    (searchParams.get("tab") as "ASSET" | "SPENDING" | "TREND") || "SPENDING"
  );
  // 탭 순서: ASSET → SPENDING → TREND
  const TAB_ORDER = ["ASSET", "SPENDING", "TREND"] as const;
  const pageSwipe = useSwipeNav({
    onSwipeLeft: () => {
      const idx = TAB_ORDER.indexOf(tab);
      if (idx < TAB_ORDER.length - 1) setTab(TAB_ORDER[idx + 1]);
      else router.push("/goals");
    },
    onSwipeRight: () => {
      const idx = TAB_ORDER.indexOf(tab);
      if (idx > 0) setTab(TAB_ORDER[idx - 1]);
      else router.push("/transactions");
    },
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stockMarketValues, setStockMarketValues] = useState<Record<number, number>>({});
  const [selectedPaletteAccount, setSelectedPaletteAccount] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [users, setUsers] = useState<{ id: number; name: string; role?: string }[]>([]);
  const [accountOwnerId, setAccountOwnerId] = useState("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("BANK");
  
  const [accountBalance, setAccountBalance] = useState("");
  const [stockCashInput, setStockCashInput] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [nextPaymentAmount, setNextPaymentAmount] = useState("");
  const [nextMonthAmount, setNextMonthAmount] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [cardPaymentDay, setCardPaymentDay] = useState("");
  const [cardCycleStartDay, setCardCycleStartDay] = useState("");
  const [cardCycleEndDay, setCardCycleEndDay] = useState("");
  const [selectedStockAccount, setSelectedStockAccount] = useState<Account | null>(null);

  useModalBack(showAccountModal, () => { setShowAccountModal(false); });
  useModalBack(!!selectedStockAccount, () => setSelectedStockAccount(null));
  const [trendMoneyType, setTrendMoneyType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [selectedTrendCategory, setSelectedTrendCategory] = useState<string | null>(null);
  const [includeDebt, setIncludeDebt] = useState(true);
  const [showBudgetInTrend, setShowBudgetInTrend] = useState(false);
  const [spendingMonth, setSpendingMonth] = useState<Date | null>(null); // null = 현재 월
  const [budgets, setBudgets] = useState<Record<string, number>>({});
    
  const [monthStartDay, setMonthStartDay] = useState(1);
  const [trendMonth, setTrendMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [accountSourceKey, setAccountSourceKey] = useState("");


const [selectedMonthSummary, setSelectedMonthSummary] = useState<{
  label: string;
  income: number;
  expense: number;
} | null>(null);

  const [accountColor, setAccountColor] = useState("#F6F0FF");
  const [assetOwnerFilter, setAssetOwnerFilter] = useState("전체");
  const keyboardHeight = useKeyboardOffset();
  // DB categories: name -> English icon key (from profile page)
  const [dbCategoryIconMap, setDbCategoryIconMap] = useState<Record<string, string>>({});
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`/api/accounts?familyId=${getCurrentFamilyId()}`);
      const data = await res.json();
      const accountList = Array.isArray(data) ? data : data.accounts || [];

      const sorted = accountList
        .slice()
        .sort(
          (a: Account, b: Account) =>
            (a.displayOrder || 0) - (b.displayOrder || 0)
        );

      setAccounts(sorted);
    } catch (error) {
      console.error(error);
    }
  };
  
  // Hydration safe: localStorage 이름을 클라이언트 마운트 후 즉시 적용
  useEffect(() => {
    const myId = getCurrentUserId();
    const myName = localStorage.getItem("alien_my_name") || "나";
    const partnerName = localStorage.getItem("alien_partner_name") || "파트너";
    // id를 알 수 없는 상태(-1/-2)로 임시 설정 — API 응답 후 실제 id로 교체됨
    setUsers([
      { id: myId > 0 ? myId : -1, name: myName },
      { id: -2, name: partnerName },
    ]);
  }, []);

  useEffect(() => {
    const savedStartDay = getSavedMonthStartDay();
    setMonthStartDay(savedStartDay);
    setTrendMonth(getBaseMonthByStartDay(new Date(), savedStartDay));

    const familyId = getCurrentFamilyId();
    const familyCode = getCurrentFamilyCode();

    // 5개 요청을 동시에 병렬 실행 → 응답속도 대폭 개선
    Promise.all([
      fetch(`/api/transactions?familyId=${familyId}`).then(r => r.json()),
      fetch(`/api/profile?code=${encodeURIComponent(familyCode)}`).then(r => r.json()),
      fetch(`/api/accounts?familyId=${familyId}`).then(r => r.json()),
      fetch(`/api/categories?familyId=${familyId}&type=EXPENSE`).then(r => r.json()),
      fetch(`/api/categories?familyId=${familyId}&type=INCOME`).then(r => r.json()),
      fetch(`/api/family-settings?familyId=${familyId}`).then(r => r.json()),
    ]).then(([txData, profileData, accountData, expCats, incCats, settingsData]) => {
      // 거래내역
      setTransactions(txData || []);

      // 프로필(유저 목록)
      const myId = getCurrentUserId();
      const savedMyName = localStorage.getItem("alien_my_name") || "나";
      const savedPartnerName = localStorage.getItem("alien_partner_name") || "파트너";
      const mappedUsers = (profileData.users || []).map((user: any) => {
        if (user.name === "나" || user.name === "파트너") {
          return { ...user, name: user.id === myId ? savedMyName : savedPartnerName };
        }
        return { ...user };
      });
      setUsers([...mappedUsers, { id: 0, name: "공동" }]);

      // 계좌 목록
      const accountList = Array.isArray(accountData) ? accountData : accountData.accounts || [];
      const sorted = accountList
        .slice()
        .sort((a: Account, b: Account) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setAccounts(sorted);

      // 주식계좌 현 평가액(총평가 = 주식 + 예수금) 조회
      const stockAccounts = sorted.filter((a: Account) => a.type === "STOCK");
      if (stockAccounts.length > 0) {
        Promise.all(
          stockAccounts.map((a: Account) =>
            fetch(`/api/stocks/summary?accountId=${a.id}`)
              .then((r) => r.json())
              .then((d) => ({ id: a.id, totalValue: Number(d.totalValue || 0) }))
              .catch(() => ({ id: a.id, totalValue: Number(a.stockCash || a.balance || 0) }))
          )
        ).then((results) => {
          const map: Record<number, number> = {};
          results.forEach(({ id, totalValue }) => { map[id] = totalValue; });
          setStockMarketValues(map);
        });
      }

      // 카테고리 아이콘 맵
      const all = [...(Array.isArray(expCats) ? expCats : []), ...(Array.isArray(incCats) ? incCats : [])];
      const iconMap: Record<string, string> = {};
      all.forEach((cat: any) => { if (cat.name && cat.icon) iconMap[cat.name] = cat.icon; });
      setDbCategoryIconMap(iconMap);

      // 예산 데이터: DB 우선, 없으면 localStorage 캐시
      if (settingsData && settingsData.budgets && typeof settingsData.budgets === "object") {
        const budgetMap: Record<string, number> = {};
        for (const [k, v] of Object.entries(settingsData.budgets)) {
          budgetMap[k] = Number(v) || 0;
        }
        setBudgets(budgetMap);
        // localStorage 캐시 갱신
        localStorage.setItem("alien_category_budgets", JSON.stringify(budgetMap));
      } else {
        // DB에 없으면 localStorage 캐시 사용
        try {
          const cached = JSON.parse(localStorage.getItem("alien_category_budgets") || "{}");
          const budgetMap: Record<string, number> = {};
          for (const [k, v] of Object.entries(cached)) budgetMap[k] = Number(v) || 0;
          setBudgets(budgetMap);
        } catch { /* ignore */ }
      }
    }).catch(console.error);
  }, []);

const expenses = transactions.filter((tx) => tx.type === "EXPENSE");

const ownerRangeBaseMonth = getBaseMonthByStartDay(new Date(), monthStartDay);
const ownerRange = getCustomMonthRange(ownerRangeBaseMonth, monthStartDay);

const ownerMonthExpenses = expenses.filter((tx) =>
  isDateInRange(tx.transactionAt, ownerRange.start, ownerRange.end)
);

const ownerMap = ownerMonthExpenses.reduce<Record<string, number>>((acc, tx) => {
  const owner = tx.owner || "미지정";
  acc[owner] = (acc[owner] || 0) + tx.amount;
  return acc;
}, {});

const ownerMonthIncome = transactions.filter((tx) =>
  tx.type === "INCOME" && isDateInRange(tx.transactionAt, ownerRange.start, ownerRange.end)
);
const incomeMap = ownerMonthIncome.reduce<Record<string, number>>((acc, tx) => {
  const owner = tx.owner || "미지정";
  acc[owner] = (acc[owner] || 0) + tx.amount;
  return acc;
}, {});

const getPercent = (owner: string) => {
  const userA = users[0]?.name || "나";
  const userB = users[1]?.name || "파트너";

  const shared = ownerMap["공동"] || 0;

  const userAAmount = (ownerMap[userA] || 0) + shared / 2;
  const userBAmount = (ownerMap[userB] || 0) + shared / 2;

  const total = userAAmount + userBAmount;

  if (!total) return "0%";

  if (owner === userA) {
    return `${Math.round((userAAmount / total) * 100)}%`;
  }

  if (owner === userB) {
    return `${Math.round((userBAmount / total) * 100)}%`;
  }

  return "0%";
};

  return (
    <main {...pageSwipe} style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(247, 245, 255, 0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #F0EAFF", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 390, padding: "calc(env(safe-area-inset-top) + 10px) 16px 12px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#2D2545", letterSpacing: -0.5, margin: "0 0 10px" }}>분석 🔭</h1>

        <div style={tabStyle}>
          <button onClick={() => setTab("ASSET")} style={tabButtonStyle}>
            {tab === "ASSET" ? <strong style={activeTabStyle}>자산</strong> : "자산"}
          </button>

          <button onClick={() => setTab("SPENDING")} style={tabButtonStyle}>
            {tab === "SPENDING" ? <strong style={activeTabStyle}>소비</strong> : "소비"}
          </button>

          <button onClick={() => setTab("TREND")} style={tabButtonStyle}>
            {tab === "TREND" ? <strong style={activeTabStyle}>추세</strong> : "추세"}
          </button>
        </div>
        </div>{/* /maxWidth */}
        </div>{/* /fixed header */}

{tab === "SPENDING" && (() => {
  const baseMonth = spendingMonth ?? getBaseMonthByStartDay(new Date(), monthStartDay);
  const currentRange = getCustomMonthRange(baseMonth, monthStartDay);

  const monthExpenses = expenses.filter((tx) =>
    isDateInRange(tx.transactionAt, currentRange.start, currentRange.end)
  );

  const totalExpense = monthExpenses.reduce((sum, tx) => sum + tx.amount, 0);

  const categoryTotals = monthExpenses.reduce<Record<string, number>>((acc, tx: any) => {
    const key = tx.category || "기타";
    acc[key] = (acc[key] || 0) + tx.amount;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryTotals)
    .map(([name, amount]) => {
      const budget = Number(budgets[name] || 0);
      const usageRate = budget > 0 ? Math.round((amount / budget) * 100) : 0;

      return {
        name,
        amount,
        budget,
        usageRate,
      };
    })
    .sort((a, b) => b.usageRate - a.usageRate);

  const recentMonths = Array.from({ length: 5 }, (_, i) => {
    const base = new Date(
      baseMonth.getFullYear(),
      baseMonth.getMonth() - 4 + i,
      1
    );

    const range = getCustomMonthRange(base, monthStartDay);

    return {
      year: base.getFullYear(),
      month: base.getMonth(),
      label: `${base.getMonth() + 1}월`,
      rangeLabel: formatMonthRangeLabel(range.start, range.end),
      range,
    };
  });

  const monthlySummary = recentMonths.map((m) => {
    const monthTxs = transactions.filter((tx) =>
      isDateInRange(tx.transactionAt, m.range.start, m.range.end)
    );

    return {
      ...m,
      income: monthTxs
        .filter((tx) => tx.type === "INCOME")
        .reduce((sum, tx) => sum + tx.amount, 0),
      expense: monthTxs
        .filter((tx) => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + tx.amount, 0),
    };
  });

  return (
    <>
      <section style={cardStyle}>
        <div style={spendingHeaderStyle}>
          <div>
            <strong style={{ fontSize: 14 }}>예산 대비 사용률</strong>
            {(() => {
              const totalBudget = topCategories.reduce((s, c) => s + c.budget, 0);
              const totalUsed = topCategories.reduce((s, c) => s + c.amount, 0);
              if (totalBudget === 0) return null;
              return (
                <div style={{ fontSize: 11, color: theme.colors.subtext, marginTop: 2 }}>
                  <span style={{ color: theme.colors.primary, fontWeight: 700 }}>{totalUsed.toLocaleString()}원</span>
                  {" / "}{totalBudget.toLocaleString()}원
                </div>
              );
            })()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              onClick={() => setSpendingMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1))}
              style={{ border: "none", background: "none", cursor: "pointer", padding: "2px 4px", fontSize: 15, color: "#A59DBD" }}
            >‹</button>
            <span style={{ ...smallSubTextStyle, whiteSpace: "nowrap" }}>
              {baseMonth.getMonth() + 1}월
            </span>
            <button
              type="button"
              onClick={() => {
                const next = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1);
                const now = getBaseMonthByStartDay(new Date(), monthStartDay);
                // 미래 월은 이동 불가
                if (next <= now) setSpendingMonth(next > now ? null : next);
                else setSpendingMonth(null);
              }}
              style={{ border: "none", background: "none", cursor: "pointer", padding: "2px 4px", fontSize: 15, color: "#A59DBD" }}
            >›</button>
          </div>
        </div>

        {topCategories.length === 0 ? (
          <div style={emptyDonutWrapStyle}>
            <div style={donutEmptyStyle} />
            <span style={smallSubTextStyle}>소비 데이터가 없습니다.</span>
          </div>
        ) : (
          <div style={budgetUsageListStyle}>
            {topCategories.map((item) => {
              const name = item.name;
              // 1st: match by category name in built-in Korean map
              let iconData = categoryIconMap.find(m => m.key === name) || null;
              // 2nd: look up DB icon key (English) from fetched categories
              let FinalIcon: React.ElementType = iconData ? iconData.icon : Utensils;
              let finalBg = iconData ? iconData.bg : "#FFF3F6";
              if (!iconData) {
                const dbIconKey = dbCategoryIconMap[name];
                if (dbIconKey && englishIconMap[dbIconKey]) {
                  FinalIcon = englishIconMap[dbIconKey];
                  finalBg = "#F4F0FF";
                }
              }
              const Icon = FinalIcon;
              const iconBg = finalBg;

              return (
                <div key={name} style={categoryRowStyle}>
                  <div style={categoryLeftStyle}>
                    <div style={{ ...categoryIconBoxStyle, background: iconBg }}>
                      <Icon size={14} color={theme.colors.primary} />
                    </div>
                    <span>{name}</span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong>{item.usageRate}%</strong>

                    <div style={{ fontSize: 10, color: theme.colors.subtext }}>
                      {item.amount.toLocaleString()} /{" "}
                      {item.budget > 0
                        ? `${item.budget.toLocaleString()}원`
                        : "예산 없음"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <strong style={{ fontSize: 14 }}>월별 지출 추이</strong>

        <div style={dualChartStyle}>
          {monthlySummary.map((item) => {
            const total = item.income + item.expense;

            const incomeRatio = total ? item.income / total : 0;
            const expenseRatio = total ? item.expense / total : 0;

            return (
              <button
                key={`${item.year}-${item.month}`}
                type="button"
                onClick={() =>
                  setSelectedMonthSummary({
                    label: `${item.label} (${item.rangeLabel})`,
                    income: item.income,
                    expense: item.expense,
                  })
                }
                style={dualBarGroupStyle}
              >
                <div
                  style={{
                    ...dualBarStyle,
                    height: Math.max(6, incomeRatio * 90),
                    background: "#DDFBEF",
                  }}
                />
                <div
                  style={{
                    ...dualBarStyle,
                    height: Math.max(6, expenseRatio * 90),
                    background: "#FFE8F0",
                  }}
                />
              </button>
            );
          })}
        </div>

        <div style={monthStyle}>
          {monthlySummary.map((item) => (
            <span key={`${item.year}-${item.month}`}>{item.label}</span>
          ))}
        </div>

        {selectedMonthSummary && (
          <div style={monthSummaryBoxStyle}>
            <strong style={{ fontSize: 13 }}>
              {selectedMonthSummary.label} 요약
            </strong>

            <div style={monthSummaryGridStyle}>
              <div style={incomeSummaryCardStyle}>
                <span style={summaryLabelStyle}>수입</span>
                <strong style={{ color: theme.colors.income }}>
                  +{selectedMonthSummary.income.toLocaleString()}원
                </strong>
              </div>

              <div style={expenseSummaryCardStyle}>
                <span style={summaryLabelStyle}>지출</span>
                <strong style={{ color: theme.colors.expense }}>
                  -{selectedMonthSummary.expense.toLocaleString()}원
                </strong>
              </div>
            </div>
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <style>{`
          @keyframes rocketFloat { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-6px)} }
          @keyframes flameFlicker { 0%,100%{transform:scaleX(1) scaleY(1)} 30%{transform:scaleX(1.2) scaleY(0.88)} 60%{transform:scaleX(0.85) scaleY(1.12)} }
          @keyframes starTwinkle { 0%,100%{opacity:0.12} 50%{opacity:1} }
          @keyframes milestoneGlow { 0%,100%{filter:brightness(1) drop-shadow(0 0 3px currentColor)} 50%{filter:brightness(1.4) drop-shadow(0 0 7px currentColor)} }
          @keyframes earthAtmo { 0%,100%{box-shadow:0 0 22px rgba(79,195,247,0.5),0 0 8px rgba(79,195,247,0.25)} 50%{box-shadow:0 0 34px rgba(79,195,247,0.7),0 0 16px rgba(79,195,247,0.4)} }
        `}</style>
        <div style={spendingHeaderStyle}>
          <strong style={{ fontSize: 14 }}>커플 로켓 🚀</strong>
          <span style={smallSubTextStyle}>{formatMonthRangeLabel(ownerRange.start, ownerRange.end)}</span>
        </div>

        {(() => {
          const userA = users[0]?.name || "나";
          const userB = users[1]?.name || "파트너";
          const shared = ownerMap["공동"] || 0;
          const expA = (ownerMap[userA] || 0) + shared / 2;
          const expB = (ownerMap[userB] || 0) + shared / 2;
          const totalExp = expA + expB;
          const expRatioA = totalExp > 0 ? expA / totalExp : 0.5;
          const expRatioB = totalExp > 0 ? expB / totalExp : 0.5;
          const incShared = incomeMap["공동"] || 0;
          const incA = (incomeMap[userA] || 0) + incShared / 2;
          const incB = (incomeMap[userB] || 0) + incShared / 2;
          const totalInc = incA + incB;
          const incRatioA = totalInc > 0 ? incA / totalInc : 0.5;
          const incRatioB = totalInc > 0 ? incB / totalInc : 0.5;

          // 총 자산 (부채 제외)
          const totalAssets = accounts.reduce((sum, account) => {
            if (account.type === "LOAN" || account.type === "CARD") return sum;
            if (account.type === "STOCK") return sum + Number(stockMarketValues[account.id] || account.stockCash || 0);
            return sum + Number(account.balance || 0);
          }, 0);

          const GOAL = 500_000_000; // 5억
          const progress = Math.min(Math.max(totalAssets / GOAL, 0), 1);

          // 프로필 색상: getCurrentUserId()로 누가 userA인지 판별 후 배정
          const myId = getCurrentUserId();
          const isUserAMe = users[0]?.id === myId;
          const myColor    = (typeof window !== "undefined" ? localStorage.getItem("alien_my_color")      : null) || "#BFEFE0";
          const partColor  = (typeof window !== "undefined" ? localStorage.getItem("alien_partner_color") : null) || "#FFD6E8";
          const colorA = isUserAMe ? myColor : partColor;
          const colorB = isUserAMe ? partColor : myColor;

          // 좌표계: 컨테이너 300px, 지구 100px (bottom:-18 → 82px 보임)
          const CONTAINER_H = 300;
          const ROCKET_MIN = 90;   // 지구 위 시작점
          const ROCKET_MAX = 258;  // 목표 도달 위치
          const rocketBottom = ROCKET_MIN + progress * (ROCKET_MAX - ROCKET_MIN);

          const flameBaseH = 11;
          const flameMaxAdd = 24;

          // 마일스톤 행성 (좌우 교차 배치 → 궤도 느낌)
          const milestones = [
            { amount: 100_000_000,   label: "1억",   planet: "🌙", left: "78%", glow: "rgba(200,200,255,0.9)" },
            { amount: 300_000_000,   label: "3억",   planet: "🔴", left: "16%", glow: "rgba(255,140,110,0.9)" },
            { amount: 500_000_000,   label: "5억",   planet: "🪐", left: "80%", glow: "rgba(176,120,255,0.9)" },
            { amount: 700_000_000,   label: "7억",   planet: "🌍", left: "14%", glow: "rgba(100,210,130,0.9)" },
            { amount: 1_000_000_000, label: "10억 🎯", planet: "⭐", left: "50%", glow: "rgba(255,228,80,0.95)" },
          ];

          return (
            <>
              {/* 우주 배경 */}
              <div style={{
                position: "relative", height: CONTAINER_H,
                background: "linear-gradient(180deg, #2A1258 0%, #4422A0 32%, #6B35CC 62%, #2244A8 100%)",
                borderRadius: 18, overflow: "hidden", marginTop: 14, marginBottom: 12,
              }}>

                {/* 별 */}
                {[...Array(22)].map((_, i) => (
                  <div key={i} style={{
                    position: "absolute", borderRadius: "50%",
                    width: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5,
                    height: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5,
                    background: "#fff",
                    left: `${(i * 43 + 9) % 92}%`,
                    top: `${(i * 31 + 5) % 78}%`,
                    animation: `starTwinkle ${1.0 + (i % 5) * 0.36}s ease-in-out infinite`,
                    animationDelay: `${(i * 0.3) % 2.8}s`,
                  }} />
                ))}

                {/* 궤도 점선: 중앙 */}
                <div style={{
                  position: "absolute", left: "50%", top: 12,
                  bottom: ROCKET_MIN + 4, width: 0,
                  borderLeft: "1.5px dashed rgba(200,170,255,0.28)",
                  transform: "translateX(-50%)", zIndex: 1,
                }} />

                {/* 마일스톤 행성 */}
                {milestones.map((m) => {
                  const mProgress = m.amount / GOAL;
                  const mBottom = ROCKET_MIN + mProgress * (ROCKET_MAX - ROCKET_MIN);
                  const mTopPx = CONTAINER_H - mBottom - 14;
                  const reached = totalAssets >= m.amount;
                  return (
                    <div key={m.label} style={{
                      position: "absolute", left: m.left, top: mTopPx,
                      transform: "translateX(-50%)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                      zIndex: 2, opacity: reached ? 1 : 0.38,
                      transition: "opacity 0.8s ease",
                      animation: reached ? "milestoneGlow 2.2s ease-in-out infinite" : undefined,
                    }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{m.planet}</span>
                      <span style={{
                        fontSize: 7.5, fontWeight: 900, whiteSpace: "nowrap",
                        color: reached ? m.glow : "rgba(255,255,255,0.3)",
                        textShadow: reached ? `0 0 5px ${m.glow}` : "none",
                      }}>{m.label}</span>
                    </div>
                  );
                })}

                {/* 로켓 (단일 — 중앙) */}
                <div style={{
                  position: "absolute", left: "50%",
                  bottom: rocketBottom,
                  transform: "translateX(-50%)",
                  transition: "bottom 1.4s cubic-bezier(0.34,1.56,0.64,1)",
                  textAlign: "center", zIndex: 5,
                  animation: "rocketFloat 2.2s ease-in-out infinite",
                }}>
                  <div style={{ fontSize: 26 }}>🚀</div>
                  {/* 2색 불꽃: 좌(userA) 보라 / 우(userB) 핑크 */}
                  <div style={{
                    margin: "2px auto 0",
                    display: "flex", alignItems: "flex-end",
                    width: 22, transition: "all 1s ease",
                  }}>
                    {/* 좌 불꽃 — userA (프로필 색상) */}
                    <div style={{
                      flex: Math.max(expRatioA, 0.15),
                      height: flameBaseH + expRatioA * flameMaxAdd,
                      background: `linear-gradient(180deg,${colorA}ee,${colorA} 45%,${colorA}aa)`,
                      borderRadius: "50% 20% 50% 60%",
                      animation: "flameFlicker 0.15s ease-in-out infinite",
                      filter: "blur(1.5px)", opacity: 0.95,
                      transition: "all 1s ease",
                      boxShadow: `0 0 8px ${colorA}88`,
                    }} />
                    {/* 우 불꽃 — userB (프로필 색상) */}
                    <div style={{
                      flex: Math.max(expRatioB, 0.15),
                      height: flameBaseH + expRatioB * flameMaxAdd,
                      background: `linear-gradient(180deg,${colorB}ee,${colorB} 45%,${colorB}aa)`,
                      borderRadius: "20% 50% 60% 50%",
                      animation: "flameFlicker 0.15s ease-in-out infinite",
                      animationDelay: "0.08s",
                      filter: "blur(1.5px)", opacity: 0.95,
                      transition: "all 1s ease",
                      boxShadow: `0 0 8px ${colorB}88`,
                    }} />
                  </div>
                </div>
                {/* 이름 라벨 (로켓 아래) */}
                <div style={{
                  position: "absolute", left: "50%",
                  bottom: rocketBottom - 20,
                  transform: "translateX(-50%)",
                  transition: "bottom 1.4s cubic-bezier(0.34,1.56,0.64,1)",
                  display: "flex", gap: 4, alignItems: "center",
                  fontSize: 8.5, fontWeight: 900, zIndex: 6,
                  textShadow: "0 1px 4px rgba(0,0,0,0.7)", whiteSpace: "nowrap",
                }}>
                  <span style={{ color: "#D4BCFF" }}>{userA}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>💜</span>
                  <span style={{ color: "#FFD0EE" }}>{userB}</span>
                </div>

                {/* 지구 (출발점 — 하단 중앙, 명확히 보임) */}
                <div style={{
                  position: "absolute", bottom: -18, left: "50%",
                  transform: "translateX(-50%)",
                  width: 104, height: 104, borderRadius: "50%",
                  background: "radial-gradient(circle at 38% 32%, #5FC8F8, #1565C0 45%, #0D47A1 75%)",
                  animation: "earthAtmo 3.5s ease-in-out infinite",
                  overflow: "hidden", zIndex: 3,
                }}>
                  <div style={{ position: "absolute", top: "16%", left: "10%", width: "28%", height: "20%", background: "rgba(76,175,80,0.75)", borderRadius: "40% 60% 50% 70%" }} />
                  <div style={{ position: "absolute", top: "12%", left: "50%", width: "22%", height: "17%", background: "rgba(76,175,80,0.7)", borderRadius: "60% 40% 70% 30%" }} />
                  <div style={{ position: "absolute", top: "36%", left: "63%", width: "24%", height: "13%", background: "rgba(76,175,80,0.65)", borderRadius: "50% 50% 40% 60%" }} />
                  <div style={{ position: "absolute", top: "5%", left: "18%", width: "40%", height: "8%", background: "rgba(255,255,255,0.28)", borderRadius: 999 }} />
                  <div style={{ position: "absolute", top: "38%", left: "6%", width: "28%", height: "6%", background: "rgba(255,255,255,0.22)", borderRadius: 999 }} />
                </div>

                {/* 출발 레이블 */}
                <div style={{
                  position: "absolute", bottom: 5, left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 8, color: "rgba(140,210,255,0.75)", fontWeight: 900,
                  letterSpacing: 0.5, zIndex: 4,
                }}>🌍 지구 출발</div>

                {/* 진행률 배지 */}
                <div style={{
                  position: "absolute", top: 9, right: 10,
                  background: "rgba(0,0,0,0.52)",
                  borderRadius: 999, padding: "3px 9px",
                  fontSize: 9.5, color: "#FFE566", fontWeight: 900,
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255,228,80,0.3)",
                }}>
                  {(progress * 100).toFixed(1)}%
                </div>
              </div>

              {/* 진행 바 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9B8EC8", marginBottom: 5 }}>
                  <span>현재 자산 <strong style={{ color: "#7C5CFF" }}>
                    {totalAssets >= 100_000_000
                      ? `${(totalAssets / 100_000_000).toFixed(1)}억`
                      : `${Math.round(totalAssets / 10_000).toLocaleString()}만`}원
                  </strong></span>
                  <span>목표 <strong style={{ color: "#FF6B9D" }}>5억</strong></span>
                </div>
                <div style={{ height: 6, background: "#EDE6F9", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${progress * 100}%`,
                    background: "linear-gradient(90deg, #7C5CFF, #A78BFA)",
                    borderRadius: 999, transition: "width 1.4s ease",
                  }} />
                </div>
              </div>

              {/* 스탯 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { name: userA, expRatio: expRatioA, incRatio: incRatioA },
                  { name: userB, expRatio: expRatioB, incRatio: incRatioB },
                ].map((u) => (
                  <div key={u.name} style={{ background: "#F4F0FF", borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#7C5CFF", marginBottom: 6 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "#8B7BAB", marginBottom: 2 }}>🚀 수입 {Math.round(u.incRatio * 100)}%</div>
                    <div style={{ fontSize: 11, color: "#8B7BAB" }}>🔥 지출 {Math.round(u.expRatio * 100)}%</div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </section>
    </>
  );
})()}

        {tab === "ASSET" && (
          <>
<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
<div style={assetHeaderStyle}>
  <strong style={{ fontSize: 15, fontWeight: 900, color: "#2D2545" }}>자산 목록</strong>
  <button
    onClick={() => {
      setEditingAccount(null);
      setAccountName("");
      setAccountType("BANK");
      setAccountBalance("");
      setAccountOwnerId("");
      setShowAccountModal(true);
      setStockCashInput("");
    setCardPaymentDay("");
      setCardCycleStartDay("");
      setCardCycleEndDay("");
    }}
    style={addAssetSmallButtonStyle}
  >
    + 추가
  </button>
</div>

{/* 소유주 필터 */}
<div style={{ display: "flex", gap: 6 }}>
  {(["전체", users[0]?.name || "나", users[1]?.name || "파트너", "공동"] as const).map((f) => {
    const active = assetOwnerFilter === f;
    return (
      <button key={f} type="button" onClick={() => setAssetOwnerFilter(f)} style={{
        height: 30, padding: "0 12px", borderRadius: 999,
        fontSize: 11, fontWeight: 800, cursor: "pointer",
        border: active ? `1.5px solid ${theme.colors.primary}` : "1.5px solid #E8E1F5",
        background: active ? `${theme.colors.primary}18` : "rgba(255,255,255,0.8)",
        color: active ? theme.colors.primary : "#B0A8C8",
        transition: "all 0.18s",
      }}>{f}</button>
    );
  })}
</div>
</div>

            <AssetAccountGrid
              users={users.filter((u) => u.id > 0)}
              accounts={(() => {
                const user0 = users[0]; // OWNER
                const user1 = users[1]; // MEMBER
                if (assetOwnerFilter === user0?.name)
                  return accounts.filter((a) =>
                    user0?.id > 0 ? a.owner?.id === user0.id : a.owner?.role === "OWNER"
                  );
                if (assetOwnerFilter === user1?.name)
                  return accounts.filter((a) =>
                    user1?.id > 0 ? a.owner?.id === user1.id : a.owner?.role === "MEMBER"
                  );
                if (assetOwnerFilter === "공동")
                  return accounts.filter((a) => !a.owner || a.owner?.name === "공동");
                return accounts; // 전체
              })()}
              stockMarketValues={stockMarketValues}
              onSelectStockAccount={(account) => {
                setSelectedStockAccount(account);
              }}
              onEdit={(account) => {
                setEditingAccount(account);
                setCardPaymentDay(account.cardPaymentDay ? String(account.cardPaymentDay) : "");
                setCardCycleStartDay(account.cardCycleStartDay ? String(account.cardCycleStartDay) : "");
                setCardCycleEndDay(account.cardCycleEndDay ? String(account.cardCycleEndDay) : "");
                setAccountName(account.name);
                // 유저별 별칭 로드: AccountAlias에서 현재 유저의 별칭 우선, 없으면 account.sourceKey fallback
                const myUid = getCurrentUserId();
                if (myUid) {
                  fetch(`/api/accounts/alias?userId=${myUid}`)
                    .then((r) => r.json())
                    .then((aliasRows: { accountId: number; alias: string }[]) => {
                      const found = aliasRows.find((row) => row.accountId === account.id);
                      setAccountSourceKey(found ? found.alias : (account.sourceKey || ""));
                    })
                    .catch(() => setAccountSourceKey(account.sourceKey || ""));
                } else {
                  setAccountSourceKey(account.sourceKey || "");
                }
                setAccountType(account.type);
                setAccountBalance(String(account.balance));
                setStockCashInput(account.type === "STOCK" ? String(account.stockCash ?? "") : "");
                setAccountColor(account.color || "#F6F0FF");
                setAccountOwnerId(account.ownerId ? String(account.ownerId) : "");
                setShowAccountModal(true);
                setNextPaymentDate(account.nextPaymentDate || "");
                setNextPaymentAmount(
                  account.nextPaymentAmount ? String(account.nextPaymentAmount) : ""
                );
                setNextMonthAmount(
                  account.nextMonthAmount ? String(account.nextMonthAmount) : ""
                );
                setMaturityDate(
                  account.maturityDate ? account.maturityDate.slice(0, 10) : ""
                );
                setMonthlyPayment(
                  account.monthlyPayment ? String(account.monthlyPayment) : ""
                );
              }}
              onPalette={(account) => {
                setSelectedPaletteAccount(account.id);
              }}
            />
            {selectedStockAccount && (
              <StockHoldingList
                accountId={selectedStockAccount.id}
                accountName={selectedStockAccount.name}
                ownerName={selectedStockAccount.owner?.name || "공동"}
                onChanged={fetchAccounts}
              />
            )}

          </>
        )}

{tab === "TREND" && (() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);

  const totalAsset = accounts.reduce((sum, account) => {
    if (account.type === "LOAN" || account.type === "CARD") {
      // 빚 제외 모드면 부채 계좌 스킵
      if (!includeDebt) return sum;
      return sum - Math.abs(Number(account.balance || 0));
    }
    if (account.type === "STOCK") {
      return sum + Number(account.stockCash || 0);
    }
    return sum + Number(account.balance || 0);
  }, 0);

  const currentAssetRange = getCustomMonthRange(
  getBaseMonthByStartDay(new Date(), monthStartDay),
  monthStartDay
);

const currentMonthTransactions = transactions.filter((tx) =>
  isDateInRange(tx.transactionAt, currentAssetRange.start, currentAssetRange.end)
);

  const currentMonthNetChange = currentMonthTransactions.reduce((sum, tx) => {
    if (tx.type === "INCOME") return sum + tx.amount;
    if (tx.type === "EXPENSE") return sum - tx.amount;
    return sum;
  }, 0);

  const lastMonthEndAsset = totalAsset - currentMonthNetChange;

  const assetDiff = totalAsset - lastMonthEndAsset;

  const assetRate =
    lastMonthEndAsset > 0
      ? Math.round((assetDiff / lastMonthEndAsset) * 100)
      : 0;

const trendYear = trendMonth.getFullYear();
const trendMonthIndex = trendMonth.getMonth();
const trendRange = getCustomMonthRange(trendMonth, monthStartDay);
const prevTrendRange = getCustomMonthRange(
  new Date(trendMonth.getFullYear(), trendMonth.getMonth() - 1, 1),
  monthStartDay
);
const currentMonthExpenses = expenses.filter((tx) =>
  isDateInRange(tx.transactionAt, trendRange.start, trendRange.end)
);

const currentMonthIncome = transactions.filter((tx) => {
  return (
    tx.type === "INCOME" &&
    isDateInRange(tx.transactionAt, trendRange.start, trendRange.end)
  );
});

const getCategoryTotal = (list: Transaction[]) => {
  return list.reduce<Record<string, number>>((acc, tx: any) => {
    const key = tx.category || "기타";
    acc[key] = (acc[key] || 0) + tx.amount;
    return acc;
  }, {});
};

// 소비비중은 항상 EXPENSE 기준 (수입/이체 제외)
const trendTargetTransactions = currentMonthExpenses;

const trendCategoryMap = getCategoryTotal(trendTargetTransactions);
const trendTotal = Object.values(trendCategoryMap).reduce((s, v) => s + v, 0);

const trendCategories = Object.entries(trendCategoryMap)
  .sort((a, b) => b[1] - a[1])
  .map(([name, amount]) => ({
    name,
    amount,
    percent: trendTotal > 0 ? Math.round((amount / trendTotal) * 100) : 0,
  }));

// 선택된 카테고리의 해당 월 거래내역
const selectedCategoryTransactions = selectedTrendCategory
  ? trendTargetTransactions.filter((tx: any) => (tx.category || "기타") === selectedTrendCategory)
  : [];

const lastMonthExpenses = expenses.filter((tx) =>
  isDateInRange(tx.transactionAt, prevTrendRange.start, prevTrendRange.end)
);

  
  const currentCategoryMap = getCategoryTotal(currentMonthExpenses);
  const lastCategoryMap = getCategoryTotal(lastMonthExpenses);


  return (
    <>
      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <strong style={{ fontSize: 14 }}>순자산 변화</strong>
          <button
            type="button"
            onClick={() => setIncludeDebt((v) => !v)}
            style={{
              fontSize: 11, fontWeight: 800, cursor: "pointer",
              border: `1.5px solid ${includeDebt ? "#FF3B70" : theme.colors.border}`,
              background: includeDebt ? "#FFF0F4" : "rgba(255,255,255,0.8)",
              color: includeDebt ? "#FF3B70" : theme.colors.subtext,
              borderRadius: 999, padding: "4px 10px",
            }}
          >
            {includeDebt ? "빚 포함" : "빚 제외"}
          </button>
        </div>

        <div style={netAssetBoxStyle}>
          <span style={smallSubTextStyle}>현재 총 자산</span>
          <strong style={netAssetTextStyle}>
            {totalAsset.toLocaleString()}원
          </strong>
        </div>

        <div style={assetTrendBoxStyle}>
          <span>지난달 자산 : {lastMonthEndAsset.toLocaleString()}원</span>
          <strong
            style={{
              color: assetDiff >= 0 ? theme.colors.income : theme.colors.expense,
            }}
          >
            {assetDiff >= 0 ? "+" : "-"}
            {Math.abs(assetDiff).toLocaleString()}원 · {assetRate}%
          </strong>
        </div>
      </section>
      <section style={cardStyle}>
  <div style={trendMonthHeaderStyle}>
    <button
      onClick={() =>
        setTrendMonth(new Date(trendYear, trendMonthIndex - 1, 1))
      }
      style={monthNavButtonStyle}
    >
      <ChevronLeft size={16} />
    </button>

    <div style={monthLabelStyle}>
      {trendYear}년 {trendMonthIndex + 1}월 ·{" "}
      {formatMonthRangeLabel(trendRange.start, trendRange.end)}
    </div>

    <button
      onClick={() =>
        setTrendMonth(new Date(trendYear, trendMonthIndex + 1, 1))
      }
      style={monthNavButtonStyle}
    >
      <ChevronRight size={16} />
    </button>
  </div>

  <div style={spendingHeaderStyle}>
    <strong style={{ fontSize: 14 }}>소비 비중</strong>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={smallSubTextStyle}>지출 카테고리별</span>
      <button
        type="button"
        onClick={() => setShowBudgetInTrend(v => !v)}
        style={{
          fontSize: 10, fontWeight: 800, cursor: "pointer",
          border: `1.5px solid ${showBudgetInTrend ? theme.colors.primary : "#E8E1F5"}`,
          background: showBudgetInTrend ? `${theme.colors.primary}18` : "#FAFAFF",
          color: showBudgetInTrend ? theme.colors.primary : "#A59DBD",
          borderRadius: 999, padding: "3px 8px",
        }}
      >
        예산 대비 {showBudgetInTrend ? "ON" : "OFF"}
      </button>
    </div>
  </div>
  {trendCategories.length === 0 ? (
    <p style={emptyTrendTextStyle}>해당 월 지출 데이터가 없습니다.</p>
  ) : (
    <>
      <div
        style={{
          ...donutChartStyle,
          background: `conic-gradient(${trendCategories
            .map((item, index) => {
              const total = trendCategories.reduce(
                (sum, target) => sum + target.amount,
                0
              );
              const start = trendCategories
                .slice(0, index)
                .reduce((sum, target) => sum + target.amount, 0);
              const startPercent = (start / total) * 100;
              const endPercent = ((start + item.amount) / total) * 100;
              const color = donutColors[index % donutColors.length];

              return `${color} ${startPercent}% ${endPercent}%`;
            })
            .join(", ")})`,
        }}
      >
        <div style={donutInnerStyle}>
          <strong>
            {trendCategories
              .reduce((sum, item) => sum + item.amount, 0)
              .toLocaleString()}
          </strong>
총 지출
        </div>
      </div>

      <div style={donutLegendStyle}>
        {trendCategories.map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setSelectedTrendCategory(item.name)}
            style={{
              ...donutLegendItemStyle,
              cursor: "pointer",
              border: "none",
              width: "100%",
              textAlign: "left",
              background: selectedTrendCategory === item.name ? `${donutColors[index % donutColors.length]}22` : "#FAF8FF",
              outline: selectedTrendCategory === item.name ? `1.5px solid ${donutColors[index % donutColors.length]}` : "none",
            }}
          >
            <span
              style={{
                ...donutDotStyle,
                background: donutColors[index % donutColors.length],
              }}
            />
            <span style={{ flex: 1, fontWeight: 800 }}>{item.name}</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: 6 }}>
              {showBudgetInTrend && (
                <span style={{ fontSize: 10, fontWeight: 600, color: budgets[item.name] > 0 ? (item.amount > budgets[item.name] ? "#FF3B70" : "#B0A8C8") : "#B0A8C8" }}>
                  {budgets[item.name] > 0
                    ? `예산 ${Number(budgets[item.name]).toLocaleString()}원 (${Math.round((item.amount / budgets[item.name]) * 100)}%)`
                    : "예산 미설정"}
                </span>
              )}
              <span style={{ fontSize: 11, color: "#9b8ec4", fontWeight: 700 }}>
                {item.amount.toLocaleString()}원
              </span>
            </div>
            <strong style={{ fontSize: 13, minWidth: 32, textAlign: "right" }}>
              {item.percent}%
            </strong>
          </button>
        ))}
      </div>

      {/* 카테고리 거래내역 드릴다운 */}
      {selectedTrendCategory && (
        <div style={categoryDrilldownStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: 13 }}>
              {trendMonthIndex + 1}월 · {selectedTrendCategory}
            </strong>
            <button
              type="button"
              onClick={() => setSelectedTrendCategory(null)}
              style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9b8ec4", lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          {selectedCategoryTransactions.length === 0 ? (
            <p style={{ fontSize: 12, color: "#9b8ec4", textAlign: "center", margin: "12px 0" }}>거래 내역이 없습니다.</p>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {selectedCategoryTransactions
                .sort((a: any, b: any) => new Date(b.transactionAt).getTime() - new Date(a.transactionAt).getTime())
                .map((tx: any) => (
                <div key={tx.id} style={drilldownTxRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#2d2545" }}>
                      {tx.memo || tx.category || "기타"}
                    </div>
                    <div style={{ fontSize: 10, color: "#9b8ec4", marginTop: 1 }}>
                      {new Date(tx.transactionAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                      {tx.owner ? ` · ${tx.owner}` : ""}
                    </div>
                  </div>
                  <strong style={{ fontSize: 13, color: "#FF6B81" }}>
                    -{tx.amount.toLocaleString()}원
                  </strong>
                </div>
              ))}
              <div style={{ marginTop: 4, paddingTop: 8, borderTop: "1px solid #EDE6F9", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#9b8ec4" }}>합계</span>
                <strong style={{ color: "#FF6B81" }}>
                  -{selectedCategoryTransactions.reduce((s: number, tx: any) => s + tx.amount, 0).toLocaleString()}원
                </strong>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )}
</section>

    </>
  );
})()}

{showAccountModal && (
  <div style={{ ...modalOverlayStyle, paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0 }}>
    <div style={modalStyle}>
    {/* 핸들 */}
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 2 }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E0D9F5" }} />
    </div>
    <div style={modalHeaderStyle}>
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <button
      type="button"
      onClick={() => {
        setShowAccountModal(false);
        setEditingAccount(null);
      }}
      style={backButtonStyle}
    >
      <ChevronLeft size={20} />
    </button>

    <strong>
      {editingAccount ? "자산 수정" : "자산 추가"}
    </strong>
  </div>

  <div style={colorChipRowStyle}>
    {["#F6F0FF", "#FFE4F1", "#E8F7FF", "#FFF4D6", "#E8FFF3", "#F2F2F2"].map(
      (color) => (
        <button
          key={color}
          type="button"
          onClick={() => setAccountColor(color)}
          style={{
            ...colorChipStyle,
            background: color,
            border:
              accountColor === color
                ? `2px solid ${theme.colors.primary}`
                : `1px solid ${theme.colors.border}`,
          }}
        >
          {accountColor === color && (
            <span style={colorCheckStyle}>✓</span>
          )}
        </button>
      )
    )}
  </div>
</div>
      <input
        value={accountName}
        onChange={(e) => setAccountName(e.target.value)}
          onFocus={(e) => scrollInputIntoView(e.currentTarget)}
        placeholder="자산 이름"
        style={inputStyle}
      />
      <input
        value={accountSourceKey}
        onChange={(e) => setAccountSourceKey(e.target.value)}
          onFocus={(e) => scrollInputIntoView(e.currentTarget)}
        placeholder="전화번호 / 카카오 이름"
        style={inputStyle}
      />
<select
  value={accountOwnerId}
  onChange={(e) => setAccountOwnerId(e.target.value)}
  style={inputStyle}
>
  <option value="">소유자 선택</option>
  {users.map((user) => (
    <option key={user.id} value={user.id}>
      {user.name}
    </option>
  ))}
</select>
     <div style={accountTypeGridStyle}>
  {[
    { value: "BANK", label: "은행", icon: "🏦" },
    { value: "CARD", label: "카드", icon: "💳" },
    { value: "STOCK", label: "주식", icon: "📈" },
    { value: "SAVING", label: "예적금", icon: "🐷" },
    { value: "CASH", label: "현금", icon: "💵" },
    { value: "LOAN", label: "대출", icon: "⚠️" },
  ].map((item) => {
    const active = accountType === item.value;

    return (
      <button
        key={item.value}
        type="button"
        onClick={() => setAccountType(item.value)}
        style={{
          ...accountTypeButtonStyle,
          border: active
            ? `1px solid ${theme.colors.primary}`
            : `1px solid ${theme.colors.border}`,
          background: active ? theme.colors.primarySoft : "#FFFFFF",
          color: active ? theme.colors.primary : theme.colors.text,
        }}
      >
        <span style={{ fontSize: 18 }}>{item.icon}</span>
        <span>{item.label}</span>
      </button>
    );
  })}
</div>
      <input
        value={accountBalance}
        onChange={(e) => setAccountBalance(e.target.value)}
          onFocus={(e) => scrollInputIntoView(e.currentTarget)}
        placeholder="현재 금액 (주식계좌는 자동계산)"
        type="number"
        style={inputStyle}
      />

{accountType === "STOCK" && (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ fontSize: 12, fontWeight: 800, color: "#7E73A8" }}>예수금 (직접 입력)</div>
    <input
      value={stockCashInput}
      onChange={(e) => setStockCashInput(e.target.value)}
          onFocus={(e) => scrollInputIntoView(e.currentTarget)}
      placeholder="예수금 잔액 (원)"
      type="number"
      style={inputStyle}
    />
    <div style={{ fontSize: 11, color: "#9B96AA", lineHeight: 1.5 }}>
      거래내역의 수입/이체로 자동 반영되지 않은 금액이 있을 때 여기서 직접 수정하세요.
    </div>
  </div>
)}

{accountType === "CARD" && (
  <div style={cardSettingBoxStyle}>
    <div style={cardSettingTitleStyle}>카드 결제 설정</div>

    <div style={dayGridStyle}>
      <div>
        <label style={labelStyle}>매월 결제일</label>
        <div style={dayInputWrapStyle}>
          <input
            type="number"
            placeholder="16"
            value={cardPaymentDay}
            onChange={(e) => setCardPaymentDay(e.target.value)}
          onFocus={(e) => scrollInputIntoView(e.currentTarget)}
            style={dayInputStyle}
          />
          <span style={daySuffixStyle}>일</span>
        </div>
      </div>

      <div>
        <label style={labelStyle}>결산일</label>
        <div style={dayInputWrapStyle}>
          <input
            type="number"
            placeholder="13"
            value={cardCycleEndDay}
            onChange={(e) => {
              setCardCycleEndDay(e.target.value);
              setCardCycleStartDay("1");
            }}
            style={dayInputStyle}
          />
          <span style={daySuffixStyle}>일</span>
        </div>
      </div>
    </div>

    <div style={cardHintStyle}>
      결산일 기준으로 카드 이용금액을 자동 계산합니다.
    </div>
  </div>
)}

{(accountType === "SAVING" || accountType === "LOAN") && (
  <>
    <label style={labelStyle}>만기일</label>
    <input
      type="date"
      value={maturityDate}
      onChange={(e) => setMaturityDate(e.target.value)}
          onFocus={(e) => scrollInputIntoView(e.currentTarget)}
      style={inputStyle}
    />
  </>
)}

{accountType === "LOAN" && (
  <>
    <label style={labelStyle}>월 납부금</label>
    <input
      type="number"
      placeholder="예: 500000"
      value={monthlyPayment}
      onChange={(e) => setMonthlyPayment(e.target.value)}
          onFocus={(e) => scrollInputIntoView(e.currentTarget)}
      style={inputStyle}
    />
  </>
)}

{editingAccount && (
  <button
    style={deleteButtonStyle}
    onClick={async () => {
      if (!confirm("이 자산을 삭제할까요?")) return;

      const res = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "자산 삭제 실패");
        return;
      }

      setShowAccountModal(false);
      setEditingAccount(null);
      setAccountSourceKey("");
      setAccountName("");
      setAccountSourceKey("");
      setAccountType("BANK");
      setAccountBalance("");
      setMaturityDate("");
      setMonthlyPayment("");
      await fetchAccounts();
    }}
  >
    자산 삭제
  </button>
)}


<button
  style={saveButtonStyle}
  onClick={async () => {
    const url = editingAccount
      ? `/api/accounts/${editingAccount.id}`
      : "/api/accounts";

    const method = editingAccount ? "PATCH" : "POST";

    // sourceKey를 AccountAlias(per-user)에도 저장하기 위해 accountId를 나중에 받아 처리
    const myUid = getCurrentUserId();

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardPaymentDay: cardPaymentDay ? Number(cardPaymentDay) : null,
        cardCycleStartDay: cardCycleStartDay ? Number(cardCycleStartDay) : null,
        cardCycleEndDay: cardCycleEndDay ? Number(cardCycleEndDay) : null,
        name: accountName,
        sourceKey: accountSourceKey || null,
        type: accountType,
        balance: Number(accountBalance || 0),
        stockCash: accountType === "STOCK" && stockCashInput !== "" ? Number(stockCashInput) : undefined,
        color: accountColor,
        familyId: getCurrentFamilyId(),
       ownerId:
          accountOwnerId && accountOwnerId !== "0"
            ? Number(accountOwnerId)
            : null,
        ownerName:
          accountOwnerId === "0"
            ? "공동"
            : users.find((user) => String(user.id) === accountOwnerId)?.name || null,
        nextPaymentDate: nextPaymentDate || null,
        nextPaymentAmount: nextPaymentAmount ? Number(nextPaymentAmount) : null,
        nextMonthAmount: nextMonthAmount ? Number(nextMonthAmount) : null,
        maturityDate: maturityDate || null,
        monthlyPayment: monthlyPayment ? Number(monthlyPayment) : null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      console.error("ACCOUNT_SAVE_ERROR", data);
      alert(data?.error || "자산 저장 실패");
      return;
    }

    // sourceKey를 AccountAlias(per-user)에도 저장 — 기기 사용자별로 SMS/카카오 매칭이 분리됨
    const savedAccount = await res.json().catch(() => null);
    const savedAccountId = savedAccount?.id ?? editingAccount?.id;
    if (myUid && savedAccountId) {
      if (accountSourceKey) {
        // 별칭 저장 (upsert)
        fetch("/api/accounts/alias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: savedAccountId, userId: myUid, alias: accountSourceKey }),
        }).catch(console.error);
      } else {
        // 별칭 비어있으면 삭제
        fetch(`/api/accounts/alias?accountId=${savedAccountId}&userId=${myUid}`, {
          method: "DELETE",
        }).catch(console.error);
      }
    }

    setCardPaymentDay("");
    setCardCycleStartDay("");
    setCardCycleEndDay("");

    setNextPaymentDate("");
    setNextPaymentAmount("");
    setNextMonthAmount("");
    
    setAccountColor("#F6F0FF");
    setAccountName("");
    setAccountType("BANK");
    setAccountColor("#F6F0FF");
    setAccountBalance("");

    setMaturityDate("");
    setMonthlyPayment("");

    setShowAccountModal(false);
    setEditingAccount(null);
    setAccountSourceKey("");
    
    await fetchAccounts();
  }}
>
  저장하기
</button>

      <button
        style={cancelButtonStyle}
        onClick={() => {
          setShowAccountModal(false);
          setEditingAccount(null);
        }}
      >
        닫기
      </button>
    </div>
  </div>
)}

{selectedPaletteAccount && (
  <div style={{ ...modalOverlayStyle, paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0 }}>
    <div style={modalStyle}>
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 2 }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E0D9F5" }} />
    </div>
      <strong style={{ fontSize: 16, fontWeight: 900, color: "#2D2545", paddingTop: 4 }}>카드 색상 선택</strong>

      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        {[
          "#F6F0FF",
          "#FFE4F1",
          "#E8F7FF",
          "#FFF4D6",
          "#E8FFF3",
          "#F2F2F2",
        ].map((color) => (
          <button
            key={color}
            onClick={async () => {
              await fetch(`/api/accounts/${selectedPaletteAccount}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ color }),
              });

              setSelectedPaletteAccount(null);
              await fetchAccounts();
            }}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              background: color,
            }}
          />
        ))}
      </div>

      <button
        style={cancelButtonStyle}
        onClick={() => setSelectedPaletteAccount(null)}
      >
        닫기
      </button>
    </div>
  </div>
)}

        <BottomNav />
      </div>
    </main>
  );
}

const tabButtonStyle = {
  border: "none",
  background: "transparent",
  color: theme.colors.subtext,
  fontSize: 13,
  padding: 0,
  cursor: "pointer",
} as const;

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(160deg, #A78BFA28 0%, #A78BFA10 30%, #f8f6ff 65%, #ffffff 100%)",
  padding: "0 0 calc(90px + env(safe-area-inset-bottom))",
  display: "flex",
  justifyContent: "center",
} as const;

const containerStyle = {
  width: "100%",
  maxWidth: 390,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: "calc(env(safe-area-inset-top) + 88px) 16px 0",
} as const;

const tabStyle = {
  height: 46,
  borderRadius: 999,
  background: "white",
  border: "1.5px solid #EDE6F9",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  alignItems: "center",
  textAlign: "center",
  fontSize: 13,
  color: theme.colors.subtext,
  padding: 4,
  boxShadow: "0 4px 14px rgba(167,139,250,0.10)",
} as const;

const activeTabStyle = {
  background: "linear-gradient(135deg, #7C5CFF 0%, #A78BFA 100%)",
  color: "white",
  height: 36,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  boxShadow: "0 4px 12px rgba(124,92,255,0.30)",
} as const;

const cardStyle = {
  background: "white",
  borderRadius: 24,
  padding: "18px 18px 16px",
  border: "1px solid #EDE6F9",
  boxShadow: "0 6px 24px rgba(167,139,250,0.10)",
} as const;

const chartStyle = {
  marginTop: 18,
  height: 120,
  display: "flex",
  alignItems: "end",
  justifyContent: "space-around",
  borderBottom: `1px solid ${theme.colors.border}`,
} as const;
const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(45,37,69,0.35)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
} as const;

const modalStyle = {
  width: "100%",
  maxWidth: 390,
  maxHeight: "90vh",
  overflowY: "auto" as const,
  background: "white",
  borderRadius: "28px 28px 0 0",
  padding: "0 20px 40px",
  display: "flex",
  flexDirection: "column" as const,
  gap: 12,
  boxShadow: "0 -8px 40px rgba(124,92,255,0.15)",
} as const;

const inputStyle = {
  height: 48,
  borderRadius: 16,
  border: "1.5px solid #EDE6F9",
  padding: "0 14px",
  fontSize: 14,
  fontWeight: 700,
  color: "#2D2545",
  background: "#FAFAFF",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
} as const;

const saveButtonStyle = {
  height: 52,
  border: "none",
  borderRadius: 18,
  background: "linear-gradient(135deg, #7C5CFF 0%, #A78BFA 100%)",
  color: "white",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 6px 20px rgba(124,92,255,0.30)",
} as const;

const cancelButtonStyle = {
  height: 44,
  border: "none",
  background: "transparent",
  color: "#B0A8C8",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const monthStyle = {
  marginTop: 8,
  display: "flex",
  justifyContent: "space-around",
  fontSize: 11,
  color: theme.colors.subtext,
} as const;

const coupleStyle = {
  marginTop: 16,
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
} as const;

const percentText = {
  margin: "4px 0 0",
  fontSize: 12,
  color: theme.colors.primary,
  fontWeight: 800,
} as const;

const addAssetButtonStyle = {
  height: 44,
  border: "none",
  borderRadius: 18,
  background: theme.colors.primary,
  color: "white",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
} as const;

const assetHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 2,
  marginBottom: 2,
} as const;

const addAssetSmallButtonStyle = {
  height: 34,
  border: "none",
  borderRadius: 999,
  background: "linear-gradient(135deg, #7C5CFF 0%, #A78BFA 100%)",
  color: "white",
  padding: "0 16px",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(124,92,255,0.25)",
} as const;

const labelStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: theme.colors.text,
  marginTop: 4,
  marginBottom: -4,
} as const;

const cardSettingBoxStyle = {
  background: "linear-gradient(160deg, #F4EFFE 0%, #EDE6FC 100%)",
  border: "1.5px solid #DDD6FE",
  borderRadius: 18,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 12,
} as const;

const cardSettingTitleStyle = {
  fontSize: 13,
  fontWeight: 900,
  color: theme.colors.text,
} as const;

const dayGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
} as const;

const dayInputWrapStyle = {
  height: 44,
  borderRadius: 14,
  border: `1px solid ${theme.colors.border}`,
  background: "white",
  display: "flex",
  alignItems: "center",
  padding: "0 10px",
} as const;

const dayInputStyle = {
  width: "100%",
  border: "none",
  outline: "none",
  fontSize: 15,
  fontWeight: 800,
  background: "transparent",
} as const;

const daySuffixStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: theme.colors.subtext,
} as const;

const cardHintStyle = {
  fontSize: 11,
  color: theme.colors.subtext,
  lineHeight: 1.4,
} as const;
const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
} as const;

const colorChipRowStyle = {
  display: "flex",
  gap: 8,
} as const;

const colorChipStyle = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
} as const;

const colorCheckStyle = {
  fontSize: 10,
  fontWeight: 900,
  color: theme.colors.primary,
} as const;

const accountTypeGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
} as const;

const accountTypeButtonStyle = {
  height: 52,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 900,
  background: "#FFFFFF",
  cursor: "pointer",
} as const;

const deleteButtonStyle = {
  height: 48,
  border: "none",
  borderRadius: 16,
  background: "#FFF3F6",
  color: "#FF3B70",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
} as const;

const spendingHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
} as const;

const smallSubTextStyle = {
  fontSize: 11,
  color: theme.colors.subtext,
} as const;

const emptyDonutWrapStyle = {
  marginTop: 18,
  display: "flex",
  alignItems: "center",
  gap: 18,
} as const;

const donutEmptyStyle = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  border: "16px solid #F1ECFF",
} as const;

const categoryListStyle = {
  marginTop: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
} as const;

const categoryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
} as const;

const monthSummaryBoxStyle = {
  marginTop: 12,
  borderRadius: 18,
  background: "linear-gradient(160deg, #F4EFFE 0%, #EDE6FC 100%)",
  border: "1px solid #DDD6FE",
  padding: "14px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontSize: 12,
  color: theme.colors.text,
} as const;

const monthSummaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
} as const;

const incomeSummaryCardStyle = {
  borderRadius: 14,
  background: "#ECFFF6",
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
} as const;

const expenseSummaryCardStyle = {
  borderRadius: 14,
  background: "#FFF3F6",
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
} as const;

const summaryLabelStyle = {
  fontSize: 11,
  color: theme.colors.subtext,
  fontWeight: 800,
} as const;

const categoryLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
} as const;

const categoryIconBoxStyle = {
  width: 26,
  height: 26,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
} as const;

const dualChartStyle = {
  marginTop: 18,
  height: 110,
  display: "flex",
  alignItems: "end",
  justifyContent: "space-around",
  borderBottom: `1px solid ${theme.colors.border}`,
} as const;

const dualBarGroupStyle = {
  width: 34,
  border: "none",
  background: "transparent",
  display: "flex",
  alignItems: "end",
  justifyContent: "center",
  gap: 5,
  cursor: "pointer",
} as const;

const dualBarStyle = {
  width: 12,
  borderRadius: 999,
} as const;


const netAssetBoxStyle = {
  marginTop: 14,
  borderRadius: 20,
  background: "linear-gradient(160deg, #F4EFFE 0%, #EDE6FC 100%)",
  border: "1.5px solid #DDD6FE",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
} as const;

const netAssetTextStyle = {
  fontSize: 26,
  fontWeight: 900,
  color: "#7C5CFF",
  letterSpacing: "-0.5px",
} as const;

const trendText = {
  marginTop: 10,
  fontSize: 12,
  color: theme.colors.subtext,
  fontWeight: 700,
} as const;

const trendListStyle = {
  marginTop: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
} as const;

const trendItemStyle = {
  minHeight: 58,
  borderRadius: 18,
  background: "#FFFFFF",
  border: `1px solid ${theme.colors.border}`,
  padding: "12px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
} as const;

const trendBadgeStyle = {
  minWidth: 58,
  height: 30,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  fontSize: 12,
  fontWeight: 900,
} as const;

const emptyTrendTextStyle = {
  marginTop: 14,
  fontSize: 12,
  color: theme.colors.subtext,
} as const;

const assetTrendBoxStyle = {
  marginTop: 10,
  borderRadius: 16,
  background: "#FAFAFF",
  border: "1px solid #EDE6F9",
  padding: "12px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 12,
  fontWeight: 800,
  color: "#6B6080",
} as const;

const donutColors = ["#9B7CFF", "#F59AC8", "#7CCBFF", "#7BE3B1", "#FFD66B"];

const donutChartStyle = {
  width: 178,
  height: 178,
  borderRadius: "50%",
  margin: "18px auto 16px",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 18px 40px rgba(155, 124, 255, 0.18)",
} as const;

const donutInnerStyle = {
  width: 94,
  height: 94,
  borderRadius: "50%",
  background: "linear-gradient(180deg, #FFFFFF 0%, #FAF8FF 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  fontSize: 12,
  color: theme.colors.text,
  boxShadow: "inset 0 0 0 1px rgba(167,139,250,0.12)",
} as const;

const donutLegendStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 8,
  marginTop: 4,
} as const;

const donutLegendItemStyle = {
  minHeight: 34,
  borderRadius: 14,
  background: "#FAF8FF",
  padding: "0 10px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 800,
} as const;

const donutDotStyle = {
  width: 9,
  height: 9,
  borderRadius: 999,
  flexShrink: 0,
} as const;

const monthNavButtonStyle = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid #EDE6F9",
  background: "#FAFAFF",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
} as const;

const monthLabelStyle = {
  padding: "6px 16px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #F4EFFE 0%, #EDE6FC 100%)",
  color: "#7C5CFF",
  fontSize: 12,
  fontWeight: 900,
  border: "1px solid #DDD6FE",
} as const;

const trendMonthHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
} as const;


const trendToggleStyle = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
} as const;

const trendToggleButtonStyle = {
  height: 36,
  border: "1.5px solid #EDE6F9",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
} as const;

const categoryDrilldownStyle = {
  marginTop: 14,
  padding: "12px 14px",
  borderRadius: 18,
  background: "#F8F5FF",
  border: "1px solid #EDE6F9",
} as const;

const drilldownTxRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 0",
  borderBottom: "1px solid #EDE6F910",
} as const;

const budgetUsageListStyle = {
  marginTop: 16,
  height: 190,
  overflowY: "scroll",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
  touchAction: "pan-y",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  paddingRight: 4,
} as const;

const modalCloseButtonStyle = {
  width: 30,
  height: 30,
  border: "none",
  borderRadius: "50%",
  background: "#F4F0FF",
  color: theme.colors.primary,
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1,
  cursor: "pointer",
} as const;

const backButtonStyle = {
  width: 30,
  height: 30,
  border: "none",
  background: "transparent",
  color: "#9B96AA",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
} as const;

export default function AnalysisPage() {
  return (
    <Suspense fallback={null}>
      <AnalysisPageContent />
    </Suspense>
  );
}
