import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code") || "ALIEN-001";

    let family = await prisma.family.findUnique({
      where: { code },
    });

    if (!family) {
      family = await prisma.family.create({
        data: {
          code,
          name: code,
        },
      });
    }

    let user = await prisma.user.findFirst({
      where: { familyId: family.id, role: "OWNER" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { familyId: family.id, name: "나", role: "OWNER" },
      });
    }

    let partner = await prisma.user.findFirst({
      where: { familyId: family.id, role: "MEMBER" },
    });

    if (!partner) {
      partner = await prisma.user.create({
        data: { familyId: family.id, name: "파트너", role: "MEMBER" },
      });
    }

    return NextResponse.json({
      family,
      users: [user, partner],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "초기 데이터 생성 실패" },
      { status: 500 }
    );
  }
}
