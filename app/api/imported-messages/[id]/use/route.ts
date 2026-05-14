import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const messageId = Number(id);

    if (!messageId) {
      return NextResponse.json(
        { error: "문자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const message = await prisma.importedMessage.update({
      where: {
        id: messageId,
      },
      data: {
        status: "USED",
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("문자 사용 처리 실패:", error);

    return NextResponse.json(
      { error: "문자 사용 처리 실패" },
      { status: 500 }
    );
  }
}