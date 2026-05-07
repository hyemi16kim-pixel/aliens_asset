import { NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function GET() {
  try {
    let family = await prisma.family.findUnique({
      where: {
        code: "ALIEN-001",
      },
    });

    if (!family) {
      family = await prisma.family.create({
        data: {
          code: "ALIEN-001",
          name: "Alien Family",
        },
      });
    }

    let user = await prisma.user.findFirst({
      where: {
        familyId: family.id,
        name: "나",
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          familyId: family.id,
          name: "나",
          role: "OWNER",
        },
      });
    }

    const goalCount = await prisma.goal.count({
    where: { familyId: family.id },
    });

    if (goalCount === 0) {
    await prisma.goal.createMany({
        data: [
        {
            familyId: family.id,
            userId: user.id,
            title: "여행 자금",
            targetAmount: 2000000,
            currentAmount: 1250000,
        },
        {
            familyId: family.id,
            userId: user.id,
            title: "신혼집 마련",
            targetAmount: 30000000,
            currentAmount: 12500000,
        },
        ],
    });
    }

    return NextResponse.json({
      family,
      user,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "초기 데이터 생성 실패" },
      { status: 500 }
    );
  }
}