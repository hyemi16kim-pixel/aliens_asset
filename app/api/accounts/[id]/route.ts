import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const params = await context.params;
    const id = Number(params.id);

    const before = await prisma.account.findUnique({
      where: { id },
    });

    if (!before) {
      return NextResponse.json(
        { error: "계좌를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        name: body.name ?? before.name,
        sourceKey:
        body.sourceKey !== undefined ? body.sourceKey : before.sourceKey,
        cardPaymentDay:
        body.cardPaymentDay !== undefined ? body.cardPaymentDay : before.cardPaymentDay,
        cardCycleStartDay:
        body.cardCycleStartDay !== undefined ? body.cardCycleStartDay : before.cardCycleStartDay,
        cardCycleEndDay:
        body.cardCycleEndDay !== undefined ? body.cardCycleEndDay : before.cardCycleEndDay,
        type: body.type ?? before.type,
        ownerId: body.ownerId !== undefined ? body.ownerId : before.ownerId,
        nextPaymentDate:
        body.nextPaymentDate !== undefined
            ? body.nextPaymentDate
            ? new Date(body.nextPaymentDate)
            : null
            : before.nextPaymentDate,
        nextPaymentAmount:
        body.nextPaymentAmount !== undefined
            ? body.nextPaymentAmount
            : before.nextPaymentAmount,
        nextMonthAmount:
        body.nextMonthAmount !== undefined
            ? body.nextMonthAmount
            : before.nextMonthAmount,
        maturityDate:
        body.maturityDate !== undefined
            ? body.maturityDate
            ? new Date(body.maturityDate)
            : null
            : before.maturityDate,
        monthlyPayment:
        body.monthlyPayment !== undefined
            ? body.monthlyPayment
            : before.monthlyPayment,
        balance:
          body.balance !== undefined
            ? (["LOAN", "CARD"].includes(body.type ?? before.type)
                ? Math.abs(Number(body.balance))
                : Number(body.balance))
            : before.balance,
        color: body.color ?? before.color,
      },
    });

        const beforeBalance = Number(before.balance || 0);
        const afterBalance = Number(updated.balance || 0);
        const diff = afterBalance - beforeBalance;

        const accountOwner = updated.ownerId
        ? await prisma.user.findUnique({
            where: { id: updated.ownerId },
            })
        : null;

        if (diff !== 0) {
          // 대출·카드는 부채 계좌: 잔액 증가 = 빚 늘어남(지출), 잔액 감소 = 빚 줄어듦(수입)
          // 일반 계좌: 잔액 증가 = 수입, 잔액 감소 = 지출
          const isDebt = ["LOAN", "CARD"].includes(before.type);
          const txType = isDebt
            ? (diff > 0 ? "EXPENSE" : "INCOME")
            : (diff > 0 ? "INCOME" : "EXPENSE");

          await prisma.transaction.create({
            data: {
              familyId: before.familyId,
              userId: updated.ownerId || null,
              owner: body.ownerName || accountOwner?.name || "미지정",
              type: txType,
              amount: Math.abs(diff),
              category: "자산 수정",
              memo: `${updated.name} 자산 수정`,
              transactionAt: new Date(),
              fromAccountId: txType === "EXPENSE" ? id : null,
              toAccountId: txType === "INCOME" ? id : null,
            },
          });
        }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "계좌 수정 실패" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = Number(params.id);

    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "계좌 삭제 실패" },
      { status: 500 }
    );
  }
}