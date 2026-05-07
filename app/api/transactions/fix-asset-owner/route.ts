import { NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function GET() {
  try {
    const txs = await prisma.transaction.findMany({
      where: {
        category: "자산 수정",
        owner: "미지정",
      },
      include: {
        fromAccount: { include: { owner: true } },
        toAccount: { include: { owner: true } },
      },
    });

    await Promise.all(
      txs.map((tx) => {
        const ownerName =
          tx.toAccount?.owner?.name ||
          tx.fromAccount?.owner?.name ||
          "미지정";

        return prisma.transaction.update({
          where: { id: tx.id },
          data: { owner: ownerName },
        });
      })
    );

    return NextResponse.json({
      ok: true,
      updated: txs.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "자산 수정 owner 보정 실패" },
      { status: 500 }
    );
  }
}