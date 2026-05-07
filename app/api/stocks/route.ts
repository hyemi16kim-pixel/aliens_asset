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
      return NextResponse.json(
        { error: "accountId가 필요합니다." },
        { status: 400 }
      );
    }

    const holdings = await prisma.stockHolding.findMany({
      where: { accountId },
      orderBy: { id: "asc" },
    });

    const result = await Promise.all(
      holdings.map(async (item: any) => {
        const currentPrice = (await getNaverStockPrice(item.code)) || item.avgPrice;
        const marketValue = currentPrice * item.quantity;
        const purchaseAmount = item.avgPrice * item.quantity;
        const profitAmount = marketValue - purchaseAmount;
        const profitRate =
          purchaseAmount > 0 ? (profitAmount / purchaseAmount) * 100 : 0;

        return {
          id: item.id,
          name: item.name,
          code: item.code,
          quantity: item.quantity,
          avgPrice: item.avgPrice,
          currentPrice,
          marketValue,
          purchaseAmount,
          profitAmount,
          profitRate,
        };
      })
    );
        const totalMarketValue = result.reduce(
        (sum, item) => sum + item.marketValue,
        0
        );

        const account = await prisma.account.findUnique({
        where: { id: accountId },
        });

        await prisma.account.update({
        where: { id: accountId },
        data: {
            balance: Math.round(totalMarketValue + Number(account?.stockCash || 0)),
        },
        });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "보유종목 조회 실패", detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const accountId = Number(body.accountId);
    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim();
    const quantity = Number(body.quantity || 0);
    const avgPrice = Number(body.avgPrice || 0);

    if (!accountId || !name || !code || !quantity || !avgPrice) {
      return NextResponse.json(
        { error: "종목명, 코드, 수량, 평균단가를 모두 입력하세요." },
        { status: 400 }
      );
    }

    const holding = await prisma.stockHolding.upsert({
      where: {
        accountId_code: {
          accountId,
          code,
        },
      },
      update: {
        name,
        quantity,
        avgPrice,
      },
      create: {
        accountId,
        name,
        code,
        quantity,
        avgPrice,
      },
    });

    return NextResponse.json(holding);
  } catch (error: any) {
    return NextResponse.json(
      { error: "보유종목 저장 실패", detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const id = Number(body.id);
    const quantity = Number(body.quantity || 0);
    const avgPrice = Number(body.avgPrice || 0);

    if (!id || !quantity || !avgPrice) {
      return NextResponse.json(
        { error: "수량과 평균단가를 입력하세요." },
        { status: 400 }
      );
    }

    const holding = await prisma.stockHolding.update({
      where: { id },
      data: {
        quantity,
        avgPrice,
      },
    });

    return NextResponse.json(holding);
  } catch (error: any) {
    return NextResponse.json(
      { error: "보유종목 수정 실패", detail: error.message },
      { status: 500 }
    );
  }
}