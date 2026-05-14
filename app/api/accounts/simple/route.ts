import { NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        owner: true,
        color: true,
        balance: true,
        sourceKey: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("accounts/simple error:", error);

    return NextResponse.json(
      { accounts: [], error: "계좌 조회 실패" },
      { status: 500 }
    );
  }
}