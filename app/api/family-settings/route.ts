import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/family-settings?familyId=X
export async function GET(req: NextRequest) {
  try {
    const familyId = Number(req.nextUrl.searchParams.get("familyId") || 1);

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        users: { orderBy: { role: "asc" } },
      },
    });

    if (!family) return NextResponse.json({ error: "가족을 찾을 수 없습니다." }, { status: 404 });

    const owner = family.users.find((u) => u.role === "OWNER");
    const partner = family.users.find((u) => u.role === "MEMBER");

    return NextResponse.json({
      familyId: family.id,
      familyName: family.name,
      monthStartDay: family.monthStartDay,
      budgets: family.budgets,
      owner: owner ? { id: owner.id, name: owner.name, color: owner.color } : null,
      partner: partner ? { id: partner.id, name: partner.name, color: partner.color } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "설정 조회 실패", detail: error.message }, { status: 500 });
  }
}

// PATCH /api/family-settings
export async function PATCH(req: NextRequest) {
  let step = "body-parse";
  try {
    const body = await req.json();
    const familyId = Number(body.familyId || 1);

    // 가족 존재 여부 확인
    step = "family-check";
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      return NextResponse.json({ error: "가족을 찾을 수 없습니다.", detail: `familyId=${familyId}` }, { status: 404 });
    }

    // 가족 설정 업데이트
    step = "family-update";
    const updateData: any = {};
    if (body.familyName !== undefined && String(body.familyName).trim()) {
      updateData.name = String(body.familyName).trim();
    }
    if (body.monthStartDay !== undefined) updateData.monthStartDay = Number(body.monthStartDay);
    if (body.budgets !== undefined) updateData.budgets = body.budgets;

    if (Object.keys(updateData).length > 0) {
      await prisma.family.update({ where: { id: familyId }, data: updateData });
    }

    // 사용자(OWNER) 이름/색상 업데이트
    step = "owner-update";
    if (body.ownerId && (body.ownerName !== undefined || body.ownerColor !== undefined)) {
      const ownerUpdate: any = {};
      if (body.ownerName !== undefined) ownerUpdate.name = String(body.ownerName);
      if (body.ownerColor !== undefined) ownerUpdate.color = String(body.ownerColor);
      await prisma.user.update({ where: { id: Number(body.ownerId) }, data: ownerUpdate });
    }

    // 사용자(MEMBER) 이름/색상 업데이트
    step = "partner-update";
    if (body.partnerId && (body.partnerName !== undefined || body.partnerColor !== undefined)) {
      const partnerUpdate: any = {};
      if (body.partnerName !== undefined) partnerUpdate.name = String(body.partnerName);
      if (body.partnerColor !== undefined) partnerUpdate.color = String(body.partnerColor);
      await prisma.user.update({ where: { id: Number(body.partnerId) }, data: partnerUpdate });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(`[family-settings PATCH] step=${step}`, error);
    return NextResponse.json(
      { error: "설정 저장 실패", detail: `[${step}] ${error.message}` },
      { status: 500 }
    );
  }
}
