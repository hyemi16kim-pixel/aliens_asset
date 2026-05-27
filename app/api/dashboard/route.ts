import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

const clampDay = (year: number, monthIndex: number, day: number) => {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
};

const getBaseMonthByStartDay = (today: Date, startDay: number) => {
  const year = today.getFullYear();
  const monthIndex = today.getMonth();

  if (today.getDate() < startDay) {
    return new Date(year, monthIndex - 1, 1);
  }

  return new Date(year, monthIndex, 1);
};

const getCustomMonthRange = (baseMonth: Date, startDay: number) => {
  const year = baseMonth.getFullYear();
  const monthIndex = baseMonth.getMonth();

  const start = new Date(
    year,
    monthIndex,
    clampDay(year, monthIndex, startDay),
    0,
    0,
    0,
    0
  );

  const nextBase = new Date(year, monthIndex + 1, 1);

  const end = new Date(
    nextBase.getFullYear(),
    nextBase.getMonth(),
    clampDay(nextBase.getFullYear(), nextBase.getMonth(), startDay) - 1,
    23,
    59,
    59,
    999
  );

  return { start, end };
};

export async function GET(req: NextRequest) {
  try {
    const monthStartDayParam = Number(
      req.nextUrl.searchParams.get("monthStartDay") || 1
    );

    const familyIdParam = req.nextUrl.searchParams.get("familyId");
    const familyId = familyIdParam ? Number(familyIdParam) : undefined;

    const familyWhere = familyId ? { familyId } : { familyId: -1 };

    const monthStartDay = Math.min(
      Math.max(Number.isFinite(monthStartDayParam) ? monthStartDayParam : 1, 1),
      31
    );

    const currentBaseMonth = getBaseMonthByStartDay(new Date(), monthStartDay);
    const currentRange = getCustomMonthRange(currentBaseMonth, monthStartDay);

    const previousBaseMonth = new Date(
      currentBaseMonth.getFullYear(),
      currentBaseMonth.getMonth() - 1,
      1
    );
    const previousRange = getCustomMonthRange(previousBaseMonth, monthStartDay);

    const [
      accounts,
      goals,
      recentTransactions,
      summaryTransactions,
      previousTransactions,
      familyUsers,
      ownerExpenseTx,
    ] = await Promise.all([
      prisma.account.findMany({
        where: familyWhere,
        include: {
          stockHoldings: true,
        },
      }),

      prisma.goal.findMany({
        where: familyWhere,
        orderBy: { id: "asc" },
      }),

      prisma.transaction.findMany({
        where: familyWhere,
        select: {
          id: true,
          type: true,
          amount: true,
          category: true,
          owner: true,
          memo: true,
          transactionAt: true,
          fromAccountId: true,
          toAccountId: true,
          fromAccount: { select: { id: true, name: true, type: true } },
          toAccount: { select: { id: true, name: true, type: true } },
        },
        orderBy: {
          transactionAt: "desc",
        },
        take: 10,
      }),

      prisma.transaction.findMany({
        where: {
          ...familyWhere,
          type: {
            in: ["INCOME", "EXPENSE"],
          },
          transactionAt: {
            gte: currentRange.start,
            lte: currentRange.end,
          },
        },
        select: {
          type: true,
          amount: true,
        },
      }),

      prisma.transaction.findMany({
        where: {
          ...familyWhere,
          type: {
            in: ["INCOME", "EXPENSE"],
          },
          transactionAt: {
            gte: previousRange.start,
            lte: previousRange.end,
          },
        },
        select: {
          type: true,
          amount: true,
        },
      }),

      prisma.user.findMany({
        where: familyId ? { familyId } : { familyId: -1 },
        select: { id: true, name: true, role: true },
        orderBy: { id: "asc" },
      }),

      prisma.transaction.findMany({
        where: {
          ...familyWhere,
          type: "EXPENSE",
          transactionAt: {
            gte: currentRange.start,
            lte: currentRange.end,
          },
        },
        select: {
          owner: true,
          amount: true,
        },
      }),
    ]);

    // Account type asset calculation:
    // - STOCK: cash (stockCash) + stock holdings value (quantity x avgPrice)
    // - LOAN/CARD: debt accounts - subtract (balance is positive = borrowed amount)
    // - Others: add balance as-is
    const totalAsset = accounts.reduce((sum: number, account: any) => {
      if (account.type === "STOCK") {
        const stockValue = (account.stockHoldings || []).reduce(
          (stockSum: number, holding: any) =>
            stockSum +
            Number(holding.quantity || 0) * Number(holding.avgPrice || 0),
          0
        );
        return sum + Number(account.stockCash || 0) + stockValue;
      }

      if (account.type === "LOAN" || account.type === "CARD") {
        return sum - Math.abs(Number(account.balance || 0));
      }

      return sum + Number(account.balance || 0);
    }, 0);

    // debtAmount: total debt amount (expressed as positive number)
    const debtAmount = accounts
      .filter(
        (account: any) => account.type === "LOAN" || account.type === "CARD"
      )
      .reduce(
        (sum: number, account: any) =>
          sum + Math.abs(Number(account.balance || 0)),
        0
      );

    let totalIncome = 0;
    let totalExpense = 0;
    let previousIncome = 0;
    let previousExpense = 0;

    summaryTransactions.forEach((tx: any) => {
      const amount = Number(tx.amount || 0);

      if (tx.type === "INCOME") totalIncome += amount;
      if (tx.type === "EXPENSE") totalExpense += amount;
    });

    previousTransactions.forEach((tx: any) => {
      const amount = Number(tx.amount || 0);

      if (tx.type === "INCOME") previousIncome += amount;
      if (tx.type === "EXPENSE") previousExpense += amount;
    });

    // 저축형(targetAmount>0)만 합산, 잔액형(targetAmount<0)은 별도 처리
    const savingGoals = goals.filter((g: any) => Number(g.targetAmount) > 0);
    const targetAmount = savingGoals.reduce(
      (sum: number, goal: any) => sum + Number(goal.targetAmount),
      0
    );
    const currentGoalAmount = savingGoals.reduce(
      (sum: number, goal: any) => sum + Number(goal.currentAmount),
      0
    );

    // Compute per-owner expense breakdown for couple spending chart
    const ownerExpenses: Record<string, number> = {};
    ownerExpenseTx.forEach((tx: any) => {
      const key = tx.owner || "미지정";
      ownerExpenses[key] = (ownerExpenses[key] || 0) + Number(tx.amount || 0);
    });

    return NextResponse.json({
      totalAsset,
      debtAmount,

      totalIncome,
      totalExpense,
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      monthlyNet: totalIncome - totalExpense,

      incomeDiff: totalIncome - previousIncome,
      expenseDiff: totalExpense - previousExpense,

      targetAmount,
      currentGoalAmount,
      goalCount: goals.length,

      recentTransactions,
      accounts,
      ownerExpenses,
      familyUsers,
      monthRange: {
        start: currentRange.start.toISOString(),
        end: currentRange.end.toISOString(),
            },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "dashboard error" }, { status: 500 });
  }
}
