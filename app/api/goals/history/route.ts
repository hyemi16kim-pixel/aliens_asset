import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

// GoalHistory model added - run `npx prisma generate` to get full type support.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const goalId = Number(req.nextUrl.searchParams.get("goalId"));
    if (!goalId) return NextResponse.json({ error: "goalId required" }, { status: 400 });

    const histories = await db.goalHistory.findMany({
      where: { goalId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (histories as any[]).map((h) => ({
      ...h,
      createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("goal history fetch failed:", error);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const goalIdNum = Number(body.goalId);
    const prevAmountNum = Number(body.prevAmount);
    const newAmountNum = Number(body.newAmount);
    const memoVal: string | null = body.memo || null;

    if (!goalIdNum || isNaN(prevAmountNum) || isNaN(newAmountNum)) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    const changeAmount = newAmountNum - prevAmountNum;

    await db.goalHistory.create({
      data: {
        goalId: goalIdNum,
        prevAmount: prevAmountNum,
        newAmount: newAmountNum,
        changeAmount,
        memo: memoVal,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("goal history save failed:", error);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}
