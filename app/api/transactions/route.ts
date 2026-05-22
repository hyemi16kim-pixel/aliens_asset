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
    const limit = limitParam ? Number(limitParam) : undefined;

    const transactions = await prisma.transaction.findMany({
      where: { familyId },
      include: {
        fromAccount: { select: { id: true, name: true, type: true } },
        toAccount: { select: { id: true, name: true, type: true } },
      },
      orderBy: limit ? { id: "desc" } : { transactionAt: "desc" },
      ...(limit ? { take: limit } : {}),
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

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("거래 삭제 실패:", error);
    return NextResponse.json({ error: "거래 삭제 실패" }, { status: 500 });
  }
}