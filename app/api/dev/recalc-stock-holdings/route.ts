import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

// GET: 미리보기 (DB 변경 없음)
export async function GET(req: NextRequest) {
  const familyId = Number(req.nextUrl.searchParams.get("familyId") || 1);
  return calcResult(familyId, false);
}

// POST: 실제 반영
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const familyId = Number(body.familyId || req.nextUrl.searchParams.get("familyId") || 1);
  return calcResult(familyId, true);
}

async function calcResult(familyId: number, apply: boolean) {
  try {
    const db = prisma as any;

    // 주식 매수/매도 트랜잭션 전체 조회 (오래된 순)
    const tradeTxs = await prisma.transaction.findMany({
      where: {
        familyId,
        category: { in: ["주식 매수", "주식 매도"] },
      },
      orderBy: { transactionAt: "asc" },
    });

    // accountId + code 기준으로 거래 누적 계산
    type HoldingState = { name: string; quantity: number; totalCost: number };
    const holdingMap: Record<string, HoldingState> = {};

    for (const tx of tradeTxs) {
      const memo = tx.memo || "";
      const match = memo.match(/^(.+)\(([A-Z0-9]+)\)\s+(\d+)주/);
      if (!match) continue;

      const name = match[1].trim();
      const code = match[2];
      const qty = Number(match[3]);
      const amount = Number(tx.amount || 0);
      const isBuy = tx.category === "주식 매수";
      const accountId = isBuy ? tx.fromAccountId : tx.toAccountId;
      if (!accountId) continue;

      const key = `${accountId}__${code}`;
      if (!holdingMap[key]) {
        holdingMap[key] = { name, quantity: 0, totalCost: 0 };
      }

      if (isBuy) {
        holdingMap[key].quantity += qty;
        holdingMap[key].totalCost += amount;
      } else {
        // 매도: 수량 감소, 비용도 비례 차감
        const before = holdingMap[key];
        const ratio = before.quantity > 0 ? qty / before.quantity : 0;
        holdingMap[key].quantity = Math.max(0, before.quantity - qty);
        holdingMap[key].totalCost = Math.max(0, before.totalCost - before.totalCost * ratio);
      }
    }

    // 결과 정리
    const results = [];

    for (const [key, state] of Object.entries(holdingMap)) {
      const [accountIdStr, code] = key.split("__");
      const accountId = Number(accountIdStr);
      const avgPrice = state.quantity > 0 ? Math.round(state.totalCost / state.quantity) : 0;

      // 기존 보유 조회
      const existing = await db.stockHolding.findUnique({
        where: { accountId_code: { accountId, code } },
      });

      results.push({
        accountId,
        code,
        name: state.name,
        prevQty: existing?.quantity ?? null,
        newQty: state.quantity,
        prevAvgPrice: existing?.avgPrice ?? null,
        newAvgPrice: avgPrice,
        action: state.quantity === 0 ? "DELETE" : existing ? "UPDATE" : "CREATE",
      });

      if (apply) {
        if (state.quantity === 0) {
          // 전량 매도된 경우 삭제
          if (existing) {
            await db.stockHolding.delete({ where: { id: existing.id } });
          }
        } else if (existing) {
          await db.stockHolding.update({
            where: { id: existing.id },
            data: { quantity: state.quantity, avgPrice, name: state.name },
          });
        } else {
          await db.stockHolding.create({
            data: { accountId, code, name: state.name, quantity: state.quantity, avgPrice },
          });
        }
      }
    }

    return NextResponse.json({ ok: true, familyId, applied: apply, results });
  } catch (error: any) {
    return NextResponse.json(
      { error: "recalc-holdings failed", detail: error.message },
      { status: 500 }
    );
  }
}
