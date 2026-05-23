import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const familyIdParam = req.nextUrl.searchParams.get("familyId");

    const goals = await prisma.goal.findMany({
    where: familyIdParam
      ? {
          familyId: Number(familyIdParam),
        }
      : {
          familyId: -1,
        },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("목표 조회 실패:", error);

    return NextResponse.json(
      { error: "목표 조회 실패" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const goal = await prisma.goal.create({
      data: {
        familyId: body.familyId,
        userId: body.userId || null,
        title: body.title,
        icon: body.icon || "🛸",
        targetAmount: body.targetAmount,
        currentAmount: body.currentAmount || 0,
        periodType: body.periodType || "ALWAYS",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("목표 생성 실패:", error);
    return NextResponse.json(
      { error: "목표 생성 실패" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "목표 ID 필요" },
        { status: 400 }
      );
    }

    // isPinned 전용 토글
    if (body.isPinnedToggle) {
      const current = await prisma.goal.findUnique({ where: { id: body.id }, select: { isPinned: true } });
      const updated = await prisma.goal.update({
        where: { id: body.id },
        data: { isPinned: !current?.isPinned },
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.goal.update({
      where: {
        id: body.id,
      },
      data: {
        title: body.title,
        icon: body.icon || "🛸",
        targetAmount: body.targetAmount,
        currentAmount: body.currentAmount,
        periodType: body.periodType || "ALWAYS",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("목표 수정 실패:", error);
    return NextResponse.json(
      { error: "목표 수정 실패" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { error: "목표 ID 필요" },
        { status: 400 }
      );
    }

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("목표 삭제 실패:", error);
    return NextResponse.json({ error: "목표 삭제 실패" }, { status: 500 });
  }
}
