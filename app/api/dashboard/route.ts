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

    const [accounts, recentTransactions, summaryTransactions, previousTransactions] =
      await Promise.all([
        prisma.account.findMany({
          where: { familyId: 1 },
        }),

        prisma.transaction.findMany({
          where: { familyId: 1 },
          include: {
            fromAccount: {
              select: { id: true, name: true, type: true },
            },
            toAccount: {
              select: { id: true, name: true, type: true },
            },
          },
          orderBy: {
            transactionAt: "desc",
          },
          take: 20,
        }),

        prisma.transaction.findMany({
          where: {
            familyId: 1,
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
            category: true,
          },
        }),

        prisma.transaction.findMany({
          where: {
            familyId: 1,
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
      ]);

    const totalAsset = accounts.reduce(
      (sum: number, account: any) =>
      sum + Number(account.balance || 0),
      0
    );

   const debtAmount = accounts
  .filter((account: any) => account.type === "LOAN" || account.type === "CARD")
  .reduce(
    (sum: number, account: any) =>
      sum + Math.abs(Number(account.balance || 0)),
    0
  );

    let totalIncome = 0;
    let totalExpense = 0;
    let previousIncome = 0;
    let previousExpense = 0;

    const categoryMap: Record<string, number> = {};

    summaryTransactions.forEach((tx: any) => {
      const amount = Number(tx.amount || 0);

      if (tx.type === "INCOME") {
        totalIncome += amount;
      }

      if (tx.type === "EXPENSE") {
        totalExpense += amount;
        categoryMap[tx.category || "기타"] =
          (categoryMap[tx.category || "기타"] || 0) + amount;
      }
    });

    previousTransactions.forEach((tx: any) => {
      const amount = Number(tx.amount || 0);

      if (tx.type === "INCOME") previousIncome += amount;
      if (tx.type === "EXPENSE") previousExpense += amount;
    });

    const spendingCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, amount]) => ({
        category,
        amount,
      }));

    return NextResponse.json({
      totalAsset,
      debtAmount,
      totalIncome,
      totalExpense,
      incomeDiff: totalIncome - previousIncome,
      expenseDiff: totalExpense - previousExpense,
      recentTransactions,
      spendingCategories,
      accounts,
      monthRange: {
        start: currentRange.start.toISOString(),
        end: currentRange.end.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "대시보드 조회 실패" }, { status: 500 });
  }
}