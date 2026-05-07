import { NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function POST() {
  try {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE '_prisma%'
    `;

    if (tables.length === 0) {
      return NextResponse.json({ ok: true, message: "삭제할 테이블 없음" });
    }

    const tableNames = tables
      .map((t: any) => `"${t.tablename}"`)
      .join(", ");

    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;
    `);

    return NextResponse.json({ ok: true, deletedTables: tables });
  } catch (error) {
    console.error("reset error:", error);

    return NextResponse.json(
      {
        error: "초기화 실패",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}