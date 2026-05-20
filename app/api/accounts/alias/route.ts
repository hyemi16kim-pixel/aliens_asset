import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/accounts/alias?userId=X
export async function GET(req: NextRequest) {
  try {
    const userId = Number(req.nextUrl.searchParams.get("userId") || 0);
    if (!userId) return NextResponse.json([]);

    const aliases = await prisma.accountAlias.findMany({
      where: { userId },
    });

    return NextResponse.json(aliases);
  } catch (error: any) {
    return NextResponse.json({ error: "별칭 조회 실패", detail: error.message }, { status: 500 });
  }
}

// POST /api/accounts/alias  { accountId, userId, alias }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accountId = Number(body.accountId);
    const userId = Number(body.userId);
    const alias = String(body.alias || "").trim();

    if (!accountId || !userId || !alias) {
      return NextResponse.json({ error: "accountId, userId, alias 필수" }, { status: 400 });
    }

    const result = await prisma.accountAlias.upsert({
      where: { accountId_userId: { accountId, userId } },
      update: { alias },
      create: { accountId, userId, alias },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: "별칭 저장 실패", detail: error.message }, { status: 500 });
  }
}

// DELETE /api/accounts/alias?accountId=X&userId=Y
export async function DELETE(req: NextRequest) {
  try {
    const accountId = Number(req.nextUrl.searchParams.get("accountId"));
    const userId = Number(req.nextUrl.searchParams.get("userId"));

    if (!accountId || !userId) {
      return NextResponse.json({ error: "accountId, userId 필수" }, { status: 400 });
    }

    await prisma.accountAlias.deleteMany({ where: { accountId, userId } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: "별칭 삭제 실패", detail: error.message }, { status: 500 });
  }
}
