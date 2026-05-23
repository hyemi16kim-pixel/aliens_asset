import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/family/password
 * body: { familyId, action: "check" | "set" | "remove", password?: string }
 *
 * action=check  → 비밀번호 일치 여부 확인 (로그인 시)
 * action=set    → 비밀번호 등록 또는 변경
 * action=remove → 비밀번호 삭제
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { familyId, action, password } = body;

    if (!familyId || !action) {
      return NextResponse.json({ error: "familyId와 action이 필요합니다." }, { status: 400 });
    }

    const family = await prisma.family.findUnique({ where: { id: Number(familyId) } });
    if (!family) {
      return NextResponse.json({ error: "가족을 찾을 수 없습니다." }, { status: 404 });
    }

    if (action === "check") {
      // 비밀번호가 설정되지 않은 경우 → 바로 통과
      if (!family.password) {
        return NextResponse.json({ ok: true, hasPassword: false });
      }
      // 비밀번호가 있는 경우 → 일치 여부 확인
      const match = family.password === String(password ?? "");
      return NextResponse.json({ ok: match, hasPassword: true });
    }

    if (action === "set") {
      const pw = String(password ?? "").trim();
      if (!pw) {
        return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
      }
      await prisma.family.update({
        where: { id: Number(familyId) },
        data: { password: pw },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "remove") {
      await prisma.family.update({
        where: { id: Number(familyId) },
        data: { password: null },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "알 수 없는 action입니다." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "처리 실패", detail: error.message }, { status: 500 });
  }
}

/**
 * GET /api/family/password?familyId=X
 * 비밀번호 설정 여부만 반환 (실제 비밀번호는 노출 안 함)
 */
export async function GET(req: NextRequest) {
  try {
    const familyId = Number(req.nextUrl.searchParams.get("familyId"));
    if (!familyId) return NextResponse.json({ error: "familyId가 필요합니다." }, { status: 400 });

    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) return NextResponse.json({ error: "가족을 찾을 수 없습니다." }, { status: 404 });

    return NextResponse.json({ hasPassword: !!family.password });
  } catch (error: any) {
    return NextResponse.json({ error: "조회 실패", detail: error.message }, { status: 500 });
  }
}
