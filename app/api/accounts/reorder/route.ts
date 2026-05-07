import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const accountIds = body.accountIds as number[];

    if (!Array.isArray(accountIds)) {
      return NextResponse.json(
        { error: "accountIds가 필요합니다." },
        { status: 400 }
      );
    }

    await Promise.all(
      accountIds.map((id, index) =>
        prisma.account.update({
          where: { id: Number(id) },
          data: { displayOrder: index },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ACCOUNT_REORDER_ERROR", error);

    return NextResponse.json(
      { error: "계좌 순서 저장 실패" },
      { status: 500 }
    );
  }
}