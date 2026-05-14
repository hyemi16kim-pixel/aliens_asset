import { NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function POST() {
  try {
    const stockAccounts = await prisma.account.findMany({
      where: { familyId: 1, type: "STOCK" },
      include: { stockHoldings: true },
    });

    const results = [];

    for (const account of stockAccounts) {
      const transactions = await prisma.transaction.findMany({
        where: {
          familyId: 1,
          OR: [{ fromAccountId: account.id }, { toAccountId: account.id }],
        },
      });

      let cashIn = 0;
      let cashOut = 0;
      let buyTxTotal = 0;

      for (const tx of transactions) {
        const amount = Number(tx.amount || 0);

        if (tx.type === "INCOME" && tx.toAccountId === account.id) {
          cashIn += amount;
        }

        if (tx.type === "EXPENSE" && tx.fromAccountId === account.id) {
          cashOut += amount;

          if (tx.category?.includes("주식 매수")) {
            buyTxTotal += amount;
          }
        }

        if (tx.type === "TRANSFER") {
          if (tx.toAccountId === account.id) cashIn += amount;
          if (tx.fromAccountId === account.id) cashOut += amount;
        }
      }

      const holdingPurchaseTotal = account.stockHoldings.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0) * Number(item.avgPrice || 0),
        0
      );

      const hasBuyTransactions = buyTxTotal > 0;

      const stockCash = hasBuyTransactions
        ? cashIn - cashOut
        : cashIn - holdingPurchaseTotal;

      await prisma.account.update({
        where: { id: account.id },
        data: {
          stockCash: Math.round(stockCash),
          balance: 0,
        },
      });

      results.push({
        accountId: account.id,
        name: account.name,
        cashIn,
        cashOut,
        buyTxTotal,
        holdingPurchaseTotal,
        stockCash,
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { error: "주식 예수금 재계산 실패", detail: error.message },
      { status: 500 }
    );
  }
}