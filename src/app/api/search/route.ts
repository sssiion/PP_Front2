import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // 프론트엔드에서 보낸 검색어(query)를 추출합니다.
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
        return NextResponse.json(
            { error: "검색어가 필요합니다." },
            { status: 400 }
        );
    }

    try {
        // 카카오 키워드 검색 API 호출
        const response = await fetch(
            `https://dapi.kakao.com/v2/local/search/keyword.json?query=
            ${encodeURIComponent
            (query)}`, // 거리순 정렬
            {
                headers: {
                    Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Kakao Search API Error:", error);
        return NextResponse.json(
            { error: "검색 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}