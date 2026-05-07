"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/navigation/BottomNav";
import SpendingCategoryCard from "@/components/dashboard/SpendingCategoryCard";
import { ChevronLeft } from "lucide-react";
import { theme } from "@/components/lib/theme";
import AssetAccountGrid from "@/components/analysis/AssetAccountGrid";
import StockHoldingList from "@/components/analysis/StockHoldingList";

import { TrendingUp, TrendingDown } from "lucide-react";
import {
  formatMonthRangeLabel,
  getBaseMonthByStartDay,
  getCustomMonthRange,
  getSavedMonthStartDay,
  isDateInRange,
} from "@/components/lib/monthRange";

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
} from "lucide-react";

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
  
  displayOrder?: number;
  ownerId?: number | null;
  owner?: {
    id: number;
    name: string;
  } | null;
};

export default function AnalysisPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<"ASSET" | "SPENDING" | "TREND">("ASSET");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedPaletteAccount, setSelectedPaletteAccount] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [accountOwnerId, setAccountOwnerId] = useState("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("BANK");
  const [accountBalance, setAccountBalance] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [nextPaymentAmount, setNextPaymentAmount] = useState("");
  const [nextMonthAmount, setNextMonthAmount] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [cardPaymentDay, setCardPaymentDay] = useState("");
  const [cardCycleStartDay, setCardCycleStartDay] = useState("");
  const [cardCycleEndDay, setCardCycleEndDay] = useState("");
  const [selectedStockAccount, setSelectedStockAccount] = useState<Account | null>(null);
const [trendMoneyType, setTrendMoneyType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  
const [monthStartDay, setMonthStartDay] = useState(1);
const [trendMonth, setTrendMonth] = useState(() => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
});

const [selectedMonthSummary, setSelectedMonthSummary] = useState<{
  label: string;
  income: number;
  expense: number;
} | null>(null);

  const [accountColor, setAccountColor] = useState("#F6F0FF");
  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
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
  
  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data || []))
      .catch(console.error);
    const savedStartDay = getSavedMonthStartDay();
    setMonthStartDay(savedStartDay);
    setTrendMonth(getBaseMonthByStartDay(new Date(), savedStartDay));

     fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        const savedMyName = localStorage.getItem("alien_my_name") || "나";
        const savedPartnerName =
          localStorage.getItem("alien_partner_name") || "파트너";

        const mappedUsers = (data.users || []).map((user: any) => {
          if (user.role === "OWNER") return { ...user, name: savedMyName };
          if (user.role === "MEMBER") return { ...user, name: savedPartnerName };
          return user;
        });

        setUsers([...mappedUsers, { id: 0, name: "공동" }]);

  })
  .catch(console.error);

    fetchAccounts();
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
    <main style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>분석</h1>

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

{tab === "SPENDING" && (() => {
  const baseMonth = getBaseMonthByStartDay(new Date(), monthStartDay);
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

  const savedBudgets =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("alien_category_budgets") || "{}")
      : {};

  const topCategories = Object.entries(categoryTotals)
    .map(([name, amount]) => {
      const budget = Number(savedBudgets[name] || 0);
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
          <strong style={{ fontSize: 14 }}>예산 대비 사용률</strong>
          <span style={smallSubTextStyle}>
            {formatMonthRangeLabel(currentRange.start, currentRange.end)}
          </span>
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
              const iconData = getCustomCategoryIcon(name);
              const Icon = iconData.icon;

              return (
                <div key={name} style={categoryRowStyle}>
                  <div style={categoryLeftStyle}>
                    <div style={{ ...categoryIconBoxStyle, background: iconData.bg }}>
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
        <div style={spendingHeaderStyle}>
          <strong style={{ fontSize: 14 }}>커플 지출 비중</strong>
          <span style={smallSubTextStyle}>
            {formatMonthRangeLabel(ownerRange.start, ownerRange.end)}
          </span>
        </div>

        <div style={coupleStyle}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 34 }}>👽</div>
            <strong>{users[0]?.name || "나"}</strong>
            <p style={percentText}>{getPercent(users[0]?.name || "나")}</p>
          </div>

          <div style={{ fontSize: 24 }}>💗</div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 34 }}>👽</div>
            <strong>{users[1]?.name || "파트너"}</strong>
            <p style={percentText}>{getPercent(users[1]?.name || "파트너")}</p>
          </div>
        </div>
      </section>
    </>
  );
})()}

        {tab === "ASSET" && (
          <>
<div style={assetHeaderStyle}>
  <strong style={{ fontSize: 15 }}>자산 목록</strong>

  <button
    onClick={() => {
      setEditingAccount(null);
      setAccountName("");
      setAccountType("BANK");
      setAccountBalance("");
      setAccountOwnerId("");
      setShowAccountModal(true);
      setCardPaymentDay("");
      setCardCycleStartDay("");
      setCardCycleEndDay("");
    }}
    style={addAssetSmallButtonStyle}
  >
    + List 추가
  </button>
</div>

            <AssetAccountGrid
              accounts={accounts}
              onSelectStockAccount={(account) => {
                setSelectedStockAccount(account);
              }}
              onEdit={(account) => {
                setEditingAccount(account);
                setCardPaymentDay(account.cardPaymentDay ? String(account.cardPaymentDay) : "");
                setCardCycleStartDay(account.cardCycleStartDay ? String(account.cardCycleStartDay) : "");
                setCardCycleEndDay(account.cardCycleEndDay ? String(account.cardCycleEndDay) : "");
                setAccountName(account.name);
                setAccountType(account.type);
                setAccountBalance(String(account.balance));
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

  const totalAsset = accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );

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

const trendTargetTransactions =
  trendMoneyType === "EXPENSE" ? currentMonthExpenses : currentMonthIncome;

const trendCategoryMap = getCategoryTotal(trendTargetTransactions);

const trendCategories = Object.entries(trendCategoryMap)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([name, amount]) => ({
    name,
    amount,
  }));

const lastMonthExpenses = expenses.filter((tx) =>
  isDateInRange(tx.transactionAt, prevTrendRange.start, prevTrendRange.end)
);

  
  const currentCategoryMap = getCategoryTotal(currentMonthExpenses);
  const lastCategoryMap = getCategoryTotal(lastMonthExpenses);


  return (
    <>
      <section style={cardStyle}>
        <strong style={{ fontSize: 14 }}>순자산 변화</strong>

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
<strong style={{ fontSize: 14 }}>
  {trendMoneyType === "EXPENSE" ? "소비 비중" : "수입 비중"}
</strong>
    <span style={smallSubTextStyle}>카테고리별</span>
  </div>
<div style={trendToggleStyle}>
  <button
    onClick={() => setTrendMoneyType("EXPENSE")}
    style={{
      ...trendToggleButtonStyle,
      background: trendMoneyType === "EXPENSE" ? "#FFF3F6" : "#FFFFFF",
      color: trendMoneyType === "EXPENSE" ? theme.colors.expense : theme.colors.subtext,
    }}
  >
    소비
  </button>

  <button
    onClick={() => setTrendMoneyType("INCOME")}
    style={{
      ...trendToggleButtonStyle,
      background: trendMoneyType === "INCOME" ? "#ECFFF6" : "#FFFFFF",
      color: trendMoneyType === "INCOME" ? theme.colors.income : theme.colors.subtext,
    }}
  >
    수입
  </button>
</div>
  {trendCategories.length === 0 ? (
    <p style={emptyTrendTextStyle}>해당 월 소비 데이터가 없습니다.</p>
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
{trendMoneyType === "EXPENSE" ? "총 지출" : "총 수입"}
        </div>
      </div>

      <div style={donutLegendStyle}>
        {trendCategories.map((item, index) => {
          const total = trendCategories.reduce(
            (sum, target) => sum + target.amount,
            0
          );
          const percent = total ? Math.round((item.amount / total) * 100) : 0;

          return (
            <div key={item.name} style={donutLegendItemStyle}>
              <span
                style={{
                  ...donutDotStyle,
                  background: donutColors[index % donutColors.length],
                }}
              />
              <span style={{ flex: 1 }}>{item.name}</span>
              <strong>{percent}%</strong>
            </div>
          );
        })}
      </div>
    </>
  )}
</section>

    </>
  );
})()}

{showAccountModal && (
  <div style={modalOverlayStyle}>
    <div style={modalStyle}>
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
        placeholder="자산 이름"
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
        placeholder="현재 금액"
        type="number"
        style={inputStyle}
      />

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
      setAccountName("");
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

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardPaymentDay: cardPaymentDay ? Number(cardPaymentDay) : null,
        cardCycleStartDay: cardCycleStartDay ? Number(cardCycleStartDay) : null,
        cardCycleEndDay: cardCycleEndDay ? Number(cardCycleEndDay) : null,
        name: accountName,
        type: accountType,
        balance: Number(accountBalance || 0),
        color: accountColor,
        familyId: 1,
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
  <div style={modalOverlayStyle}>
    <div style={modalStyle}>
      <strong>카드 색상 선택</strong>

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
} as const;

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

const tabStyle = {
  height: 42,
  borderRadius: 18,
  border: `1px solid ${theme.colors.border}`,
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  alignItems: "center",
  textAlign: "center",
  fontSize: 13,
  color: theme.colors.subtext,
} as const;

const activeTabStyle = {
  background: theme.colors.primary,
  color: "white",
  height: 34,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
} as const;

const cardStyle = {
  background: "white",
  borderRadius: 22,
  padding: "16px",
  border: `1px solid ${theme.colors.border}`,
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
  background: "rgba(0,0,0,0.28)",
  display: "flex",
  alignItems: "end",
  justifyContent: "center",
  zIndex: 50,
} as const;

const modalStyle = {
  width: "100%",
  maxWidth: 390,
  background: "white",
  borderRadius: "26px 26px 0 0",
  padding: "22px 18px 28px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
} as const;

const inputStyle = {
  height: 44,
  borderRadius: 14,
  border: `1px solid ${theme.colors.border}`,
  padding: "0 12px",
  fontSize: 14,
} as const;

const saveButtonStyle = {
  height: 46,
  border: "none",
  borderRadius: 16,
  background: theme.colors.primary,
  color: "white",
  fontWeight: 800,
  fontSize: 14,
} as const;

const cancelButtonStyle = {
  height: 42,
  border: "none",
  background: "transparent",
  color: theme.colors.subtext,
  fontWeight: 700,
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
  height: 32,
  border: "none",
  borderRadius: 999,
  background: theme.colors.primary,
  color: "white",
  padding: "0 14px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
} as const;

const labelStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: theme.colors.text,
  marginTop: 4,
  marginBottom: -4,
} as const;

const cardSettingBoxStyle = {
  background: "#F8F4FF",
  border: `1px solid ${theme.colors.border}`,
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
  height: 44,
  border: "none",
  borderRadius: 16,
  background: "#FFE4E6",
  color: "#E11D48",
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
  borderRadius: 16,
  background: "#F8F4FF",
  padding: "12px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
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
  borderRadius: 18,
  background: "#F8F4FF",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
} as const;

const netAssetTextStyle = {
  fontSize: 24,
  fontWeight: 950,
  color: theme.colors.primary,
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
  background: "#FFFFFF",
  border: `1px solid ${theme.colors.border}`,
  padding: "12px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 12,
  fontWeight: 800,
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
  border: `1px solid ${theme.colors.border}`,
  background: "#FFFFFF",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
} as const;

const monthLabelStyle = {
  padding: "6px 14px",
  borderRadius: 999,
  background: theme.colors.primarySoft,
  color: theme.colors.primary,
  fontSize: 12,
  fontWeight: 900,
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
  height: 34,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
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