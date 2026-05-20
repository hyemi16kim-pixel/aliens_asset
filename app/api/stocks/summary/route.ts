import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

async function getNaverStockPrice(code: string) {
  const cleanCode = code.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  const res = await fetch(
    "https://m.stock.naver.com/api/stock/" + cleanCode + "/basic",
    { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" }, cache: "no-store" }
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

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });
    }

    const holdings = await prisma.stockHolding.findMany({ where: { accountId } });

    // 예수금: DB에 직접 저장된 값 (이체/매수/매도/배당 시 자동 갱신)
    const cashBalance = Number(account.stockCash || 0);

    // 매입원가: 현재 보유 종목의 수량 × 평균단가
    const purchaseCost = holdings.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.avgPrice || 0),
      0
    );

    // 배당금: 이 계좌로 입금된 배당금 카테고리 수입 합계
    const dividendTxs = await prisma.transaction.findMany({
      where: { toAccountId: accountId, type: "INCOME", category: "배당금" },
    });
    const totalDividend = dividendTxs.reduce(
      (sum, tx) => sum + Number(tx.amount || 0),
      0
    );

    // 주식 현재 평가액
    let currentStockValue = 0;
    for (const item of holdings) {
      const currentPrice = (await getNaverStockPrice(item.code)) || Number(item.avgPrice);
      currentStockValue += currentPrice * Number(item.quantity);
    }

    // 총평가 = 주식 + 예수금
    const totalValue = currentStockValue + cashBalance;

    // 수익금액 = (현재 주식 평가 - 매입원가) + 배당금
    const profitAmount =
      purchaseCost > 0
        ? currentStockValue - purchaseCost + totalDividend
        : totalDividend;

    // 수익률 = 수익 / 매입원가 × 100
    const profitRate = purchaseCost > 0 ? (profitAmount / purchaseCost) * 100 : 0;

    return NextResponse.json({
      stockCash: cashBalance,
      currentStockValue,
      totalValue,
      totalDividend,
      purchaseCost,
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
