import { NextRequest, NextResponse } from "next/server";
import { PathInfo } from "@/types/odsay";

// 이 함수는 /api/odsay-directions 경로로 들어오는 GET 요청을 처리합니다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sx = searchParams.get("sx"); // Start X (Longitude)
  const sy = searchParams.get("sy"); // Start Y (Latitude)
  const ex = searchParams.get("ex"); // End X (Longitude)
  const ey = searchParams.get("ey"); // End Y (Latitude)

  if (!sx || !sy || !ex || !ey) {
    return NextResponse.json(
      { error: "출발지와 목적지 좌표(sx, sy, ex, ey)가 모두 필요합니다." },
      { status: 400 }
    );
  }

  // --- 주석: ODsay API 키 설정 --- //
  // .env.local 파일에서 ODsay API 키를 불러옵니다.
  const ODSAY_API_KEY = process.env.ODSAY_API_KEY;

  if (!ODSAY_API_KEY) {
    console.error("ODsay API 키가 설정되지 않았습니다.");
    return NextResponse.json(
        { error: "서버 설정 오류: API 키가 없습니다." },
        { status: 500 }
    );
  }

  // API 키에 포함된 특수문자(+, &, / 등)를 안전하게 전달하기 위해 인코딩합니다.
  const encodedApiKey = encodeURIComponent(ODSAY_API_KEY);

  try {
    // 1단계: searchPubTransPathT 호출하여 mapObj 얻기
    const pathSearchUrl = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=${encodedApiKey}`;
    const pathSearchResponse = await fetch(pathSearchUrl);

    if (!pathSearchResponse.ok) {
      const errorText = await pathSearchResponse.text();
      console.error("ODsay Path Search API Error:", errorText);
      return NextResponse.json(
        { error: "ODsay 경로 검색 API 호출에 실패했습니다.", details: errorText },
        { status: pathSearchResponse.status }
      );
    }

    const pathData = await pathSearchResponse.json();

    if (pathData.error) {
      console.error("ODsay Path Search API Logic Error:", pathData.error);
      return NextResponse.json(
        { error: `ODsay 경로 검색 API 오류: ${pathData.error.message}` },
        { status: 400 }
      );
    }

    // 여러 경로에 대한 그래픽 정보를 병렬로 요청
    const combinedResults = await Promise.all(
      pathData.result.path.map(async (path: PathInfo) => {
        const mapObj = path.info?.mapObj;
        if (!mapObj) {
          return { pathInfo: path, geometry: null }; // mapObj가 없는 경우 (도보 경로 등)
        }

        const laneUrl = `https://api.odsay.com/v1/api/loadLane?mapObject=0:0@${mapObj}&apiKey=${encodedApiKey}`;
        const laneResponse = await fetch(laneUrl);
        if (!laneResponse.ok) {
          return { pathInfo: path, geometry: null }; // lane 요청 실패 시
        }
        const laneData = await laneResponse.json();
        if (laneData.error) {
          return { pathInfo: path, geometry: null }; // lane 로직 에러 시
        }
        return { pathInfo: path, geometry: laneData.result };
      })
    );

    // 최종 경로 데이터를 클라이언트에 반환
    return NextResponse.json(combinedResults);

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
