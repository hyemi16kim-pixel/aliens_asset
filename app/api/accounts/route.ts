import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";
import { getCardBills } from "@/components/lib/cardBilling";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const familyId = Number(req.nextUrl.searchParams.get("familyId") || 1);

    const accounts = await prisma.account.findMany({
      where: { familyId },
      include: { owner: true },
      orderBy: { displayOrder: "asc" },
    });

    // 카드 결제 예정액: 결산일 회차별 사용액에서 카드로 들어온 이체를 오래된 회차부터 차감
    const cards = accounts.filter((a: any) => a.type === "CARD");
    const bills = await getCardBills(familyId, cards);

    const withCardAmounts = accounts.map((account: any) => {
      const bill = bills.get(account.id);
      if (!bill) return account;
      return {
        ...account,
        cardBill: bill,
        cardOutstanding: bill.outstanding,
        // 기존 화면 호환용: 다음 결제(미납 포함) / 다다음 결제
        nextPaymentAmount: bill.dueAmount + bill.overdueAmount,
        nextMonthAmount: bill.nextAmount,
      };
    });

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
