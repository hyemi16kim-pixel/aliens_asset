import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const accountId = Number(body.accountId);
    const tradeType = body.tradeType as "BUY" | "SELL";
    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim().toUpperCase();
    const quantity = Number(body.quantity || 0);
    const price = Number(body.price || 0);
    const owner = body.owner || "공동";
    const transactionAt = body.transactionAt
      ? new Date(body.transactionAt)
      : new Date();

    if (!accountId || !tradeType || !name || !code || !quantity || !price) {
      return NextResponse.json(
        { error: "주식 거래 정보를 모두 입력하세요." },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.type !== "STOCK") {
      return NextResponse.json(
        { error: "증권계좌를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const tradeAmount = quantity * price;
    const currentStockCash = Number(account.stockCash || 0);

    const before = await prisma.stockHolding.findUnique({
      where: {
        accountId_code: {
          accountId,
          code,
        },
      },
    });

    if (tradeType === "BUY") {
      if (currentStockCash < tradeAmount) {
        return NextResponse.json(
          { error: "예수금이 부족합니다." },
          { status: 400 }
        );
      }

      const beforeQty = before?.quantity || 0;
      const beforeCost = before ? before.quantity * before.avgPrice : 0;
      const addCost = tradeAmount;
      const nextQty = beforeQty + quantity;
      const nextAvgPrice = Math.round((beforeCost + addCost) / nextQty);

      await prisma.stockHolding.upsert({
        where: {
          accountId_code: {
            accountId,
            code,
          },
        },
        update: {
          name,
          quantity: nextQty,
          avgPrice: nextAvgPrice,
        },
        create: {
          accountId,
          name,
          code,
          quantity,
          avgPrice: price,
        },
      });

      await prisma.account.update({
        where: { id: accountId },
        data: {
          stockCash: currentStockCash - tradeAmount,
        },
      });
    }

    if (tradeType === "SELL") {
      if (!before || before.quantity < quantity) {
        return NextResponse.json(
          { error: "보유 수량이 부족합니다." },
          { status: 400 }
        );
      }

      const nextQty = before.quantity - quantity;

      if (nextQty === 0) {
        await prisma.stockHolding.delete({
          where: { id: before.id },
        });
      } else {
        await prisma.stockHolding.update({
          where: { id: before.id },
          data: { quantity: nextQty },
        });
      }

      await prisma.account.update({
        where: { id: accountId },
        data: {
          stockCash: currentStockCash + tradeAmount,
        },
      });
    }

    await prisma.transaction.create({
      data: {
        familyId: 1,
        userId: 1,
        owner,
        type: tradeType === "BUY" ? "EXPENSE" : "INCOME",
        amount: tradeAmount,
        category: tradeType === "BUY" ? "주식 매수" : "주식 매도",
        memo: `${name}(${code}) ${quantity}주`,
        transactionAt,
        fromAccountId: tradeType === "BUY" ? accountId : null,
        toAccountId: tradeType === "SELL" ? accountId : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "주식 거래 저장 실패", detail: error.message },
      { status: 500 }
    );
  }
}