import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

async function getNaverStockPrice(code: string) {
  const cleanCode = code.replace(/[^0-9A-Z]/gi, "").toUpperCase();

  const res = await fetch(
    `https://m.stock.naver.com/api/stock/${cleanCode}/basic`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return Number(String(data.closePrice || "0").replace(/,/g, ""));
}

export async function GET(req: NextRequest) {
  try {
    const accountId = Number(req.nextUrl.searchParams.get("accountId"));

    if (!accountId) {
      return NextResponse.json({ error: "accountId 필요" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    const holdings = await prisma.stockHolding.findMany({
      where: { accountId },
    });

    // 순입금액 = 예수금
    const netDeposit = Number(account?.stockCash || 0);

    // 배당금 거래 조회 (category가 "배당금"인 수입 거래)
    const dividendTransactions = await prisma.transaction.findMany({
      where: {
        familyId: 1,
        type: "INCOME",
        category: "배당금",
        toAccountId: accountId,
      },
    });

    // 배당금 합계 (배당금은 예수금으로 처리)
    const totalDividend = dividendTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount || 0),
      0
    );

    // 주식 현평가액 계산
    let currentStockValue = 0;

    for (const item of holdings) {
      const currentPrice =
        (await getNaverStockPrice(item.code)) || item.avgPrice;

      currentStockValue += currentPrice * item.quantity;
    }

const purchaseAmount = holdings.reduce(
  (sum, item) =>
    sum + Number(item.quantity || 0) * Number(item.avgPrice || 0),
  0
);

const profitAmount = totalDividend + currentStockValue - purchaseAmount;

const profitRate =
  purchaseAmount > 0 ? (profitAmount / purchaseAmount) * 100 : 0;

    return NextResponse.json({
      stockCash: netDeposit,
      currentStockValue,
      totalDividend,
      netDeposit,
      profitAmount,
      profitRate,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "주식 요약 조회 실패", detail: error.message },
      { status: 500 }
    );
  }
}