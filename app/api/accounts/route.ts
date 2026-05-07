import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function GET() {
  try {
    const family = await prisma.family.findUnique({
      where: { code: "ALIEN-001" },
    });

    if (!family) {
      return NextResponse.json([]);
    }

    const accounts = await prisma.account.findMany({
      where: { familyId: family.id },
      include: {
        owner: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const withCardAmounts = await Promise.all(
      accounts.map(async (account: any) => {
        if (account.type !== "CARD" || !account.cardCycleEndDay) {
          return account;
        }

        const endDay = account.cardCycleEndDay;

        const thisStart = new Date(year, month - 1, endDay + 1);
        const thisEnd = new Date(year, month, endDay, 23, 59, 59);

        const nextStart = new Date(year, month, endDay + 1);
        const nextEnd = new Date(year, month + 1, endDay, 23, 59, 59);

        const [thisTxs, nextTxs] = await Promise.all([
          prisma.transaction.findMany({
            where: {
              familyId: family.id,
              type: "EXPENSE",
              fromAccountId: account.id,
              transactionAt: {
                gte: thisStart,
                lte: thisEnd,
              },
            },
          }),
          prisma.transaction.findMany({
            where: {
              familyId: family.id,
              type: "EXPENSE",
              fromAccountId: account.id,
              transactionAt: {
                gte: nextStart,
                lte: nextEnd,
              },
            },
          }),
        ]);

const [thisPaidTxs, nextPaidTxs] = await Promise.all([
  prisma.transaction.findMany({
    where: {
      familyId: family.id,
      type: "TRANSFER",
      toAccountId: account.id,
      transactionAt: {
        gte: thisStart,
        lte: thisEnd,
      },
    },
  }),
  prisma.transaction.findMany({
    where: {
      familyId: family.id,
      type: "TRANSFER",
      toAccountId: account.id,
      transactionAt: {
        gte: nextStart,
        lte: nextEnd,
      },
    },
  }),
]);

const thisExpense = thisTxs.reduce(
  (sum, tx) => sum + Number(tx.amount || 0),
  0
);

const nextExpense = nextTxs.reduce(
  (sum, tx) => sum + Number(tx.amount || 0),
  0
);

const thisPaid = thisPaidTxs.reduce(
  (sum, tx) => sum + Number(tx.amount || 0),
  0
);

const nextPaid = nextPaidTxs.reduce(
  (sum, tx) => sum + Number(tx.amount || 0),
  0
);

const nextPaymentAmount = Math.max(thisExpense - thisPaid, 0);
const nextMonthAmount = Math.max(nextExpense - nextPaid, 0);

        return {
          ...account,
          nextPaymentAmount,
          nextMonthAmount,
        };
      })
    );

    return NextResponse.json(withCardAmounts);
  } catch (error) {
    console.error("ACCOUNTS_GET_ERROR", error);

    return NextResponse.json(
      { error: "계좌 조회 실패" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const family = await prisma.family.upsert({
      where: { code: "ALIEN-001" },
      update: {},
      create: {
        code: "ALIEN-001",
        name: "우리 가족",
      },
    });
    const account = await prisma.account.create({
      data: {
        familyId: family.id,
        cardPaymentDay: body.cardPaymentDay ?? null,
        cardCycleStartDay: body.cardCycleStartDay ?? null,
        cardCycleEndDay: body.cardCycleEndDay ?? null,
        name: body.name,
        type: body.type,
        color: body.color || "#F6F0FF",
        balance: Number(body.balance || 0),
        memo: body.memo || null,
        ownerId: body.ownerId ?? null,
        nextPaymentDate: body.nextPaymentDate ? new Date(body.nextPaymentDate) : null,
        nextPaymentAmount: body.nextPaymentAmount ?? null,
        nextMonthAmount: body.nextMonthAmount ?? null,
        maturityDate: body.maturityDate ? new Date(body.maturityDate) : null,
        monthlyPayment: body.monthlyPayment ?? null,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("ACCOUNTS_POST_ERROR", error);

    return NextResponse.json(
      {
        error: "계좌 추가 실패",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "계좌 ID 필요" }, { status: 400 });
    }

    const account = await prisma.account.update({
      where: { id: Number(body.id) },
      data: {
        name: body.name,
        type: body.type,
        balance: Number(body.balance || 0),
        memo: body.memo || null,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "계좌 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "계좌 ID 필요" }, { status: 400 });
    }

    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "계좌 삭제 실패" }, { status: 500 });
  }
}