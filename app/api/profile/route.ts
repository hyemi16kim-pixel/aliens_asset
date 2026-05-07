import { NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function GET() {
  try {
    const family = await prisma.family.upsert({
      where: { code: "ALIEN-001" },
      update: {},
      create: {
        code: "ALIEN-001",
        name: "우리 가족",
      },
    });

    const owner =
      (await prisma.user.findFirst({
        where: { familyId: family.id, role: "OWNER" },
      })) ||
      (await prisma.user.create({
        data: {
          familyId: family.id,
          role: "OWNER",
          name: "나",
        },
      }));

    const member =
      (await prisma.user.findFirst({
        where: { familyId: family.id, role: "MEMBER" },
      })) ||
      (await prisma.user.create({
        data: {
          familyId: family.id,
          role: "MEMBER",
          name: "파트너",
        },
      }));

    const fullFamily = await prisma.family.findUnique({
      where: { id: family.id },
      include: {
        goals: true,
        transactions: true,
      },
    });

    const transactions = fullFamily?.transactions || [];
    const goals = fullFamily?.goals || [];

    const totalIncome = transactions
      .filter((tx) => tx.type === "INCOME")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpense = transactions
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

    return NextResponse.json({
      familyCode: family.code,
      familyName: family.name,
      users: [owner, member],
      totalAsset: totalIncome - totalExpense,
      monthlySaving: totalIncome - totalExpense,
      goalPercent: totalTarget
        ? Math.round((totalCurrent / totalTarget) * 100)
        : 0,
    });
  } catch (error) {
    console.error("프로필 조회 실패:", error);
    return NextResponse.json({ error: "프로필 조회 실패" }, { status: 500 });
  }
}