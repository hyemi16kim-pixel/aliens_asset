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

    const stockCash = Number(account?.stockCash || 0);

    let currentStockValue = 0;
    let buyStockValue = 0;

    for (const item of holdings) {
      const currentPrice =
        (await getNaverStockPrice(item.code)) || item.avgPrice;

      currentStockValue += currentPrice * item.quantity;
      buyStockValue += item.avgPrice * item.quantity;
    }

    const totalValue = stockCash + currentStockValue;
    const baseValue = stockCash + buyStockValue;
    const profitAmount = totalValue - baseValue;
    const profitRate = baseValue > 0 ? (profitAmount / baseValue) * 100 : 0;

    await prisma.account.update({
      where: { id: accountId },
      data: { balance: Math.round(totalValue) },
    });

    return NextResponse.json({
      stockCash,
      currentStockValue,
      buyStockValue,
      totalValue,
      baseValue,
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