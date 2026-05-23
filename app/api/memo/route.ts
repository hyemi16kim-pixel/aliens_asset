import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

// GET: 공동 메모 불러오기
export async function GET(req: NextRequest) {
  try {
    const familyIdParam = req.nextUrl.searchParams.get("familyId");
    if (!familyIdParam) {
      return NextResponse.json({ error: "familyId 필요" }, { status: 400 });
    }

    const family = await prisma.family.findUnique({
      where: { id: Number(familyIdParam) },
      select: { sharedMemo: true },
    });

    if (!family) {
      return NextResponse.json({ error: "가족 없음" }, { status: 404 });
    }

    return NextResponse.json({ memo: family.sharedMemo || "" });
  } catch (error) {
    console.error("메모 조회 실패:", error);
    return NextResponse.json({ error: "메모 조회 실패" }, { status: 500 });
  }
}

// PUT: 공동 메모 저장
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { familyId, memo } = body;

    if (!familyId) {
      return NextResponse.json({ error: "familyId 필요" }, { status: 400 });
    }

    await prisma.family.update({
      where: { id: Number(familyId) },
      data: { sharedMemo: memo ?? "" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("메모 저장 실패:", error);
    return NextResponse.json({ error: "메모 저장 실패" }, { status: 500 });
  }
}
