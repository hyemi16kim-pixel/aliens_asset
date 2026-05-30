import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const familyId = Number(req.nextUrl.searchParams.get("familyId") || 1);

    const accounts = await prisma.account.findMany({
      where: { familyId },
      include: { owner: true },
      orderBy: { displayOrder: "asc" },
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const withCardAmounts = await Promise.all(
      accounts.map(async (account: any) => {
        if (account.type !== "CARD") {
          return account;
        }

        const endDay = account.cardCycleEndDay as number | null;

        // cardCycleEndDay 미설정 시 당월 1일~말일을 기본 사이클로 사용
        let thisStart: Date, thisEnd: Date, nextStart: Date, nextEnd: Date;
        if (endDay) {
          thisStart = new Date(year, month - 1, endDay + 1);
          thisEnd = new Date(year, month, endDay, 23, 59, 59);
          nextStart = new Date(year, month, endDay + 1);
          nextEnd = new Date(year, month + 1, endDay, 23, 59, 59);
        } else {
          // 사이클 미설정: 당월 1일 ~ 말일
          thisStart = new Date(year, month, 1);
          thisEnd = new Date(year, month + 1, 0, 23, 59, 59);
          nextStart = new Date(year, month + 1, 1);
          nextEnd = new Date(year, month + 2, 0, 23, 59, 59);
        }

        const [thisTxs, nextTxs, thisPaidTxs, nextPaidTxs, thisPrepaid, nextPrepaid] = await Promise.all([
          prisma.transaction.findMany({
            where: { familyId, type: "EXPENSE", fromAccountId: account.id, transactionAt: { gte: thisStart, lte: thisEnd } },
          }),
          prisma.transaction.findMany({
            where: { familyId, type: "EXPENSE", fromAccountId: account.id, transactionAt: { gte: nextStart, lte: nextEnd } },
          }),
          // 날짜 범위 기반 일반 이체 납부
          prisma.transaction.findMany({
            where: { familyId, type: "TRANSFER", toAccountId: account.id, transactionAt: { gte: thisStart, lte: thisEnd } },
          }),
          prisma.transaction.findMany({
            where: { familyId, type: "TRANSFER", toAccountId: account.id, transactionAt: { gte: nextStart, lte: nextEnd } },
          }),
          // 카테고리 기반 선결제 (날짜 무관하게 해당 사이클에 차감)
          prisma.transaction.findMany({
            where: { familyId, type: "TRANSFER", toAccountId: account.id, category: "카드 전월 선결제" },
          }),
          prisma.transaction.findMany({
            where: { familyId, type: "TRANSFER", toAccountId: account.id, category: "카드 이번달 선결제" },
          }),
        ]);

        const thisExpense = thisTxs.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
        const nextExpense = nextTxs.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
        const thisPaid =
          thisPaidTxs.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0) +
          thisPrepaid.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
        const nextPaid =
          nextPaidTxs.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0) +
          nextPrepaid.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

        return {
          ...account,
          nextPaymentAmount: Math.max(thisExpense - thisPaid, 0),
          nextMonthAmount: Math.max(nextExpense - nextPaid, 0),
        };
      })
    );

    return NextResponse.json(withCardAmounts);
  } catch (error) {
    console.error("ACCOUNTS_GET_ERROR", error);
    return NextResponse.json({ error: "계좌 조회 실패" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const familyId = Number(body.familyId || 1);

    const account = await prisma.account.create({
      data: {
        familyId,
        cardPaymentDay: body.cardPaymentDay ?? null,
        cardCycleStartDay: body.cardCycleStartDay ?? null,
        cardCycleEndDay: body.cardCycleEndDay ?? null,
        name: body.name,
        type: body.type,
        color: body.color || "#F6F0FF",
        balance: ["LOAN", "CARD"].includes(body.type)
          ? Math.abs(Number(body.balance || 0))
          : Number(body.balance || 0),
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
      { error: "계좌 추가 실패", detail: error instanceof Error ? error.message : String(error) },
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

    const updateData: any = {
      name: body.name,
      type: body.type,
      balance: Number(body.balance || 0),
      memo: body.memo || null,
    };

    // STOCK 계좌: 예수금 직접 수정 지원
    if (body.type === "STOCK" && body.stockCash !== undefined) {
      updateData.stockCash = Number(body.stockCash);
    }
    // 계좌별 추가 필드
    if (body.cardPaymentDay !== undefined) updateData.cardPaymentDay = body.cardPaymentDay ? Number(body.cardPaymentDay) : null;
    if (body.cardCycleStartDay !== undefined) updateData.cardCycleStartDay = body.cardCycleStartDay ? Number(body.cardCycleStartDay) : null;
    if (body.cardCycleEndDay !== undefined) updateData.cardCycleEndDay = body.cardCycleEndDay ? Number(body.cardCycleEndDay) : null;
    if (body.maturityDate !== undefined) updateData.maturityDate = body.maturityDate ? new Date(body.maturityDate) : null;
    if (body.monthlyPayment !== undefined) updateData.monthlyPayment = body.monthlyPayment ? Number(body.monthlyPayment) : null;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.ownerId !== undefined) updateData.ownerId = body.ownerId ?? null;
    if (body.displayOrder !== undefined) updateData.displayOrder = Number(body.displayOrder);

    const account = await prisma.account.update({
      where: { id: Number(body.id) },
      data: updateData,
      include: { owner: true },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("ACCOUNTS_PATCH_ERROR", error);
    return NextResponse.json({ error: "계좌 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });
    await prisma.account.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ACCOUNTS_DELETE_ERROR", error);
    return NextResponse.json({ error: "계좌 삭제 실패" }, { status: 500 });
  }
}
