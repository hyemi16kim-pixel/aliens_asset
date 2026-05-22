import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

// GET: preview recalculation (no DB changes)
export async function GET(req: NextRequest) {
  const familyId = Number(req.nextUrl.searchParams.get("familyId") || 1);
  return calcResult(familyId, false);
}

// POST: apply recalculation to DB
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const familyId = Number(body.familyId || req.nextUrl.searchParams.get("familyId") || 1);
  return calcResult(familyId, true);
}

async function calcResult(familyId: number, apply: boolean) {
  try {
    const stockAccounts = await prisma.account.findMany({
      where: { familyId, type: "STOCK" },
      include: { stockHoldings: true },
    });

    const results = [];

    for (const account of stockAccounts) {
      const transactions = await prisma.transaction.findMany({
        where: {
          familyId,
          OR: [{ fromAccountId: account.id }, { toAccountId: account.id }],
        },
      });

      let cashIn = 0;
      let cashOut = 0;
      const txLog: string[] = [];

      for (const tx of transactions) {
        const amount = Number(tx.amount || 0);

        // Dividend income into this account
        if (tx.type === "INCOME" && tx.toAccountId === account.id) {
          cashIn += amount;
          txLog.push("INCOME +" + amount + " [" + tx.category + "]");
        }

        // Old-style EXPENSE (pre-fix stock trades recorded as EXPENSE)
        if (tx.type === "EXPENSE" && tx.fromAccountId === account.id) {
          cashOut += amount;
          txLog.push("EXPENSE -" + amount + " [" + tx.category + "]");
        }

        if (tx.type === "TRANSFER") {
          if (tx.toAccountId === account.id) {
            // Money in: deposit or stock sale proceeds
            cashIn += amount;
            txLog.push("TRANSFER_IN +" + amount + " [" + tx.category + "]");
          }
          if (tx.fromAccountId === account.id) {
            // Money out: stock purchase or withdrawal
            cashOut += amount;
            txLog.push("TRANSFER_OUT -" + amount + " [" + tx.category + "]");
          }
        }
      }

      // Handle manually-added holdings that have no corresponding trade transaction.
      // Sum up recorded buy transactions (both TRANSFER and legacy EXPENSE).
      const holdingsCost = (account.stockHoldings as any[]).reduce(
        (sum: number, h: any) => sum + Number(h.quantity || 0) * Number(h.avgPrice || 0),
        0
      );
      const txStockBuyOut = transactions
        .filter((tx: any) =>
          tx.category === "주식 매수" &&
          tx.fromAccountId === account.id &&
          (tx.type === "TRANSFER" || tx.type === "EXPENSE")
        )
        .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
      // Only add the gap (manually added holdings not in any transaction)
      const unmatchedHoldingCost = Math.max(0, holdingsCost - txStockBuyOut);
      if (unmatchedHoldingCost > 0) {
        cashOut += unmatchedHoldingCost;
        txLog.push("MANUAL_HOLDING -" + unmatchedHoldingCost);
      }

      const newStockCash = Math.round(cashIn - cashOut);
      const prevStockCash = Number(account.stockCash || 0);

      if (apply) {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            stockCash: newStockCash,
            balance: newStockCash,
          },
        });
      }

      results.push({
        accountId: account.id,
        name: account.name,
        prevStockCash,
        newStockCash,
        cashIn,
        cashOut,
        txCount: transactions.length,
        txLog,
        applied: apply,
        prevBalance: Number(account.balance || 0),
        newBalance: newStockCash,
      });
    }

    return NextResponse.json({ ok: true, familyId, results });
  } catch (error: any) {
    return NextResponse.json(
      { error: "recalc failed", detail: error.message },
      { status: 500 }
    );
  }
}
