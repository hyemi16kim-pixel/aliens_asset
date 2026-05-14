import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

type TxType = "INCOME" | "EXPENSE" | "TRANSFER";

async function applyBalance(tx: {
  type: TxType;
  amount: number;
  fromAccountId?: number | null;
  toAccountId?: number | null;
}) {
  if (tx.type === "EXPENSE" && tx.fromAccountId) {
    await prisma.account.update({
      where: { id: tx.fromAccountId },
      data: { balance: { decrement: tx.amount } },
    });
  }

  const incomeAccountId = tx.toAccountId || tx.fromAccountId;

  if (tx.type === "INCOME" && incomeAccountId) {
    const toAccount = await prisma.account.findUnique({
      where: { id: incomeAccountId },
    });

    await prisma.account.update({
      where: { id: incomeAccountId },
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

      await prisma.account.update({
        where: { id: tx.fromAccountId },
        data: {
          balance: { decrement: tx.amount },
          stockCash:
            fromAccount?.type === "STOCK" ? { decrement: tx.amount } : undefined,
        },
      });
    }

    if (tx.toAccountId) {
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
  }
}

async function rollbackBalance(tx: {
  type: TxType;
  amount: number;
  fromAccountId?: number | null;
  toAccountId?: number | null;
}) {
  if (tx.type === "EXPENSE" && tx.fromAccountId) {
    await prisma.account.update({
      where: { id: tx.fromAccountId },
      data: { balance: { increment: tx.amount } },
    });
  }

  const incomeAccountId = tx.toAccountId || tx.fromAccountId;

  if (tx.type === "INCOME" && incomeAccountId) {
    const toAccount = await prisma.account.findUnique({
      where: { id: incomeAccountId },
    });

    await prisma.account.update({
      where: { id: incomeAccountId },
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

      await prisma.account.update({
        where: { id: tx.fromAccountId },
        data: {
          balance: { increment: tx.amount },
          stockCash:
            fromAccount?.type === "STOCK" ? { increment: tx.amount } : undefined,
        },
      });
    }

    if (tx.toAccountId) {
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
  }
}

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        fromAccount: { select: { id: true, name: true, type: true } },
        toAccount: { select: { id: true, name: true, type: true } },
      },
      orderBy: { transactionAt: "desc" },
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