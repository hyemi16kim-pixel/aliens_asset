import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

type TxType = "INCOME" | "EXPENSE" | "TRANSFER";

async function applyBalance(tx: {
  type: TxType;
  amount: number;
  fromAccountId?: number | null;
  toAccountId?: number | null;
}) {
  if (tx.type === "EXPENSE" && tx.fromAccountId) {
    const fromAccount = await prisma.account.findUnique({
      where: { id: tx.fromAccountId },
    });
    await prisma.account.update({
      where: { id: tx.fromAccountId },
      data: {
        balance: { decrement: tx.amount },
        // STOCK 계좌에서 지출(매수 등)하면 예수금도 차감
        stockCash:
          fromAccount?.type === "STOCK" ? { decrement: tx.amount } : undefined,
      },
    });
  }

  if (tx.type === "INCOME" && tx.toAccountId) {
    const toAccount = await prisma.account.findUnique({
      where: { id: tx.toAccountId },
    });

    await prisma.account.update({
      where: { id: tx.toAccountId },
      data: {
        balance: { increment: tx.amount },
        stockCash:
          toAccount?.type === "STOCK" ? { increment: tx.amount } : undefined,
      },
    });
  }

  if (tx.type === "TRANSFER") {
    if (tx.fromAccountId) {
      const fromAccount = await prisma.account.findUnique({
        where: { id: tx.fromAccountId },
      });
      const isDebt = ["LOAN", "CARD"].includes(fromAccount?.type ?? "");
      const currentBalance = Number(fromAccount?.balance ?? 0);
      await prisma.account.update({
        where: { id: tx.fromAccountId },
        data: {
          // 부채 계좌: 잔액이 양수면 증가(부채 늘어남), 음수면 감소(더 깊어짐)
          // 일반 계좌: 감소
          balance: isDebt
            ? (currentBalance >= 0 ? { increment: tx.amount } : { decrement: tx.amount })
            : { decrement: tx.amount },
          stockCash:
            fromAccount?.type === "STOCK" ? { decrement: tx.amount } : undefined,
        },
      });
    }

    if (tx.toAccountId) {
      const toAccount = await prisma.account.findUnique({
        where: { id: tx.toAccountId },
      });
      const isDebt = ["LOAN", "CARD"].includes(toAccount?.type ?? "");
      const currentBalance = Number(toAccount?.balance ?? 0);
      await prisma.account.update({
        where: { id: tx.toAccountId },
        data: {
          // 부채 계좌로 이체(상환): 잔액이 양수면 감소, 음수면 증가(덜 음수 = 부채 줄어듦)
          // 일반 계좌: 증가
          balance: isDebt
            ? (currentBalance >= 0 ? { decrement: tx.amount } : { increment: tx.amount })
            : { increment: tx.amount },
          stockCash:
            toAccount?.type === "STOCK" ? { increment: tx.amount } : undefined,
        },
      });
    }
  }
}

// 주식 매수/매도 트랜잭션 삭제 시 보유수량 롤백
async function rollbackStockHolding(tx: {
  category: string | null;
  amount: number;
  memo: string | null;
  fromAccountId: number | null;
  toAccountId: number | null;
}) {
  if (tx.category !== "주식 매수" && tx.category !== "주식 매도") return;

  // memo 형식: "삼성전자(005930) 10주"
  const match = (tx.memo || "").match(/^(.+)\(([A-Z0-9]+)\)\s+(\d+)주/);
  if (!match) return;

  const name = match[1].trim();
  const code = match[2];
  const qty = Number(match[3]);
  const isBuy = tx.category === "주식 매수";
  const accountId = isBuy ? tx.fromAccountId : tx.toAccountId;
  if (!accountId) return;

  const db = prisma as any;
  const holding = await db.stockHolding.findUnique({
    where: { accountId_code: { accountId, code } },
  });

  if (isBuy) {
    // 매수 취소 → 수량 감소, avgPrice 복원
    if (!holding) return;
    const newQty = holding.quantity - qty;
    if (newQty <= 0) {
      await db.stockHolding.delete({ where: { id: holding.id } });
    } else {
      const currentCost = holding.quantity * Number(holding.avgPrice);
      const buyCost = Number(tx.amount);
      const prevCost = Math.max(currentCost - buyCost, 0);
      const restoredAvgPrice = Math.round(prevCost / newQty);
      await db.stockHolding.update({
        where: { id: holding.id },
        data: { quantity: newQty, avgPrice: restoredAvgPrice },
      });
    }
  } else {
    // 매도 취소 → 수량 증가 (avgPrice는 기존 유지)
    if (holding) {
      await db.stockHolding.update({
        where: { id: holding.id },
        data: { quantity: holding.quantity + qty },
      });
    } else {
      // 전량 매도로 보유 종목이 삭제된 경우 → 매도 단가로 재생성
      const avgPrice = Math.round(Number(tx.amount) / qty);
      await db.stockHolding.create({
        data: { accountId, name, code, quantity: qty, avgPrice },
      });
    }
  }
}

async function rollbackBalance(tx: {
  type: TxType;
  amount: number;
  fromAccountId?: number | null;
  toAccountId?: number | null;
}) {
  if (tx.type === "EXPENSE" && tx.fromAccountId) {
    const fromAccount = await prisma.account.findUnique({
      where: { id: tx.fromAccountId },
    });
    await prisma.account.update({
      where: { id: tx.fromAccountId },
      data: {
        balance: { increment: tx.amount },
        // STOCK 계좌 롤백 시 예수금도 복원
        stockCash:
          fromAccount?.type === "STOCK" ? { increment: tx.amount } : undefined,
      },
    });
  }

  if (tx.type === "INCOME" && tx.toAccountId) {
    const toAccount = await prisma.account.findUnique({
      where: { id: tx.toAccountId },
    });

    await prisma.account.update({
      where: { id: tx.toAccountId },
      data: {
        balance: { decrement: tx.amount },
        stockCash:
          toAccount?.type === "STOCK" ? { decrement: tx.amount } : undefined,
      },
    });
  }

  if (tx.type === "TRANSFER") {
    if (tx.fromAccountId) {
      const fromAccount = await prisma.account.findUnique({
        where: { id: tx.fromAccountId },
      });
      const isDebt = ["LOAN", "CARD"].includes(fromAccount?.type ?? "");
      const currentBalance = Number(fromAccount?.balance ?? 0);
      await prisma.account.update({
        where: { id: tx.fromAccountId },
        data: {
          balance: isDebt
            ? (currentBalance >= 0 ? { decrement: tx.amount } : { increment: tx.amount })
            : { increment: tx.amount },
          stockCash:
            fromAccount?.type === "STOCK" ? { increment: tx.amount } : undefined,
        },
      });
    }

    if (tx.toAccountId) {
      const toAccount = await prisma.account.findUnique({
        where: { id: tx.toAccountId },
      });
      const isDebt = ["LOAN", "CARD"].includes(toAccount?.type ?? "");
      const currentBalance = Number(toAccount?.balance ?? 0);
      await prisma.account.update({
        where: { id: tx.toAccountId },
        data: {
          balance: isDebt
            ? (currentBalance >= 0 ? { increment: tx.amount } : { decrement: tx.amount })
            : { decrement: tx.amount },
          stockCash:
            toAccount?.type === "STOCK" ? { decrement: tx.amount } : undefined,
        },
      });
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const familyId = Number(searchParams.get("familyId") || 1);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 300; // 기본 최대 300개

    const transactions = await prisma.transaction.findMany({
      where: { familyId },
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
      orderBy: { transactionAt: "desc" },
      take: limit,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("거래 조회 실패:", error);
    return NextResponse.json({ error: "거래 조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await prisma.transaction.create({
      data: {
        familyId: body.familyId,
        userId: body.userId || null,
        fromAccountId: body.fromAccountId || null,
        toAccountId: body.toAccountId || null,
        type: body.type,
        amount: Number(body.amount),
        category: body.category,
        owner: body.owner || null,
        memo: body.memo || null,
        transactionAt: body.transactionAt ? new Date(body.transactionAt) : new Date(),
      },
    });

    await applyBalance(result as any);

    return NextResponse.json(result);
  } catch (error) {
    console.error("거래 저장 실패:", error);
    return NextResponse.json({ error: "거래 저장 실패" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "거래 ID 필요" }, { status: 400 });
    }

    const oldTx = await prisma.transaction.findUnique({
      where: { id: body.id },
    });

    if (!oldTx) throw new Error("기존 거래 없음");

    await rollbackBalance(oldTx as any);
    await rollbackStockHolding(oldTx as any);

    const result = await prisma.transaction.update({
      where: { id: body.id },
      data: {
        type: body.type,
        amount: Number(body.amount),
        fromAccountId: body.fromAccountId || null,
        toAccountId: body.toAccountId || null,
        category: body.category,
        owner: body.owner || null,
        memo: body.memo || null,
        transactionAt: body.transactionAt ? new Date(body.transactionAt) : undefined,
      },
    });

    await applyBalance(result as any);

    return NextResponse.json(result);
  } catch (error) {
    console.error("거래 수정 실패:", error);
    return NextResponse.json({ error: "거래 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "거래 ID 필요" }, { status: 400 });
    }

    const oldTx = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!oldTx) throw new Error("기존 거래 없음");

    await rollbackBalance(oldTx as any);
    await rollbackStockHolding(oldTx as any);

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("거래 삭제 실패:", error);
    return NextResponse.json({ error: "거래 삭제 실패" }, { status: 500 });
  }
}
