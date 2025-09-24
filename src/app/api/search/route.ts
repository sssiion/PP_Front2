import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY;

  if (!KAKAO_API_KEY) {
    console.error("Kakao API key is not set");
    return NextResponse.json(
      { error: "Server configuration error: Kakao API key is missing" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Kakao API error: ${response.status}`, errorBody);
      return NextResponse.json(
        { error: "Failed to fetch from Kakao API", details: errorBody },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
