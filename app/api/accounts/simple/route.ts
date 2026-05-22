import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const familyId = Number(req.nextUrl.searchParams.get("familyId") || 0);
    const userId = Number(req.nextUrl.searchParams.get("userId") || 0);

    const accounts = await prisma.account.findMany({
      where: familyId ? { familyId } : {},
      select: {
        id: true,
        name: true,
        type: true,
        owner: true,
        color: true,
        balance: true,
        sourceKey: true,
        accountAliases: {
          where: userId ? { userId } : { userId: -1 },
          select: { alias: true },
        },
      },
      orderBy: { id: "asc" },
    });

    const result = accounts.map(({ accountAliases, ...a }) => ({
      ...a,
      aliases:
        accountAliases.length > 0
          ? accountAliases.map((aa) => aa.alias)
          : a.sourceKey
          ? [a.sourceKey]
          : [],
    }));

    return NextResponse.json({ accounts: result });
  } catch (error) {
    console.error("accounts/simple error:", error);
    return NextResponse.json(
      { accounts: [], error: "failed" },
      { status: 500 }
    );
  }
}
