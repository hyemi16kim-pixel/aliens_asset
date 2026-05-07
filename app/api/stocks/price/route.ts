import { NextRequest, NextResponse } from "next/server";

async function getNaverStockPrice(code: string) {
  const cleanCode = code.replace(/[^0-9A-Z]/gi, "").toUpperCase();

  const res = await fetch(
    `https://m.stock.naver.com/api/stock/${cleanCode}/basic`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("네이버 시세 조회 실패");
  }

  const data = await res.json();

  const price = Number(String(data.closePrice || "0").replace(/,/g, ""));
  const name = data.stockName || cleanCode;

  return {
    code: cleanCode,
    name,
    price,
  };
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "code가 필요합니다." }, { status: 400 });
    }

    const data = await getNaverStockPrice(code);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "주식 현재가 조회 실패", detail: error.message },
      { status: 500 }
    );
  }
}