import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const familyId = Number(searchParams.get("familyId"));
    const confirmCode = searchParams.get("confirmCode") || "";

    if (!familyId) {
      return NextResponse.json({ error: "familyId가 필요합니다." }, { status: 400 });
    }

    // 가족 존재 확인 + 코드 검증
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      return NextResponse.json({ error: "가족을 찾을 수 없습니다." }, { status: 404 });
    }
    if (family.code.toUpperCase() !== confirmCode.toUpperCase()) {
      return NextResponse.json({ error: "가족코드가 일치하지 않습니다." }, { status: 400 });
    }

    // 계좌 목록 먼저 조회 (StockHolding, AccountAlias 삭제용)
    const accounts = await prisma.account.findMany({
      where: { familyId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    // 1. StockHolding 삭제
    if (accountIds.length > 0) {
      await prisma.stockHolding.deleteMany({
        where: { accountId: { in: accountIds } },
      });
    }

    // 2. AccountAlias 삭제
    if (accountIds.length > 0) {
      await prisma.accountAlias.deleteMany({
        where: { accountId: { in: accountIds } },
      });
    }

    // 3. Transaction 삭제
    await prisma.transaction.deleteMany({ where: { familyId } });

    // 4. Account 삭제
    await prisma.account.deleteMany({ where: { familyId } });

    // 5. User 삭제
    await prisma.user.deleteMany({ where: { familyId } });

    // 6. Family 삭제
    await prisma.family.delete({ where: { id: familyId } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "데이터 삭제 실패", detail: error.message },
      { status: 500 }
    );
  }
}
