import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/components/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const familyId = Number(
      req.nextUrl.searchParams.get("familyId") || 1
    );

    const type = req.nextUrl.searchParams.get("type");

    const categories = await prisma.category.findMany({
      where: {
        familyId,
        ...(type ? { type: type as any } : {}),
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("카테고리 조회 오류:", error);

    return NextResponse.json(
      {
        error: "카테고리 조회 실패",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      familyId = 1,
      name,
      type,
      displayOrder = 0,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        {
          error: "이름과 타입은 필수입니다",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findFirst({
      where: {
        familyId,
        name,
        type,
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const category = await prisma.category.create({
      data: {
        familyId,
        name,
        type,
        displayOrder,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("카테고리 추가 오류:", error);

    return NextResponse.json(
      {
        error: "카테고리 추가 실패",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        {
          error: "카테고리 ID가 필요합니다",
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("카테고리 삭제 오류:", error);

    return NextResponse.json(
      {
        error: "카테고리 삭제 실패",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}