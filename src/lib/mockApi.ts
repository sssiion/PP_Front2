import type { Place } from "@/components/RightSidebar";

// 백엔드 API로부터 받을 추천 장소에 대한 예시 데이터입니다.
const mockPlaces: Place[] = [
    {
        title: "경복궁",
        addr1: "서울 종로구 사직로 161",
        firstimage: "http://tong.visitkorea.or.kr/cms/resource/84/2678684_image2_1.jpg",
        mapy: "37.579617",
        mapx: "126.977041",
    },
    {
        title: "N서울타워",
        addr1: "서울 용산구 남산공원길 105",
        firstimage: "http://tong.visitkorea.or.kr/cms/resource/03/2678803_image2_1.jpg",
        mapy: "37.551169",
        mapx: "126.988227",
    },
    {
        title: "롯데월드",
        addr1: "서울 송파구 올림픽로 240",
        firstimage: "http://tong.visitkorea.or.kr/cms/resource/93/2691593_image2_1.jpg",
        mapy: "37.511115",
        mapx: "127.098163",
    },
    {
        title: "국립중앙박물관",
        addr1: "서울 용산구 서빙고로 137",
        firstimage: "http://tong.visitkorea.or.kr/cms/resource/64/2675964_image2_1.jpg",
        mapy: "37.523859",
        mapx: "126.980458",
    },
];

// 백엔드 API 호출을 흉내 내는 비동기 함수입니다.
// 실제로는 여기서 fetch를 사용하여 백엔드에 요청을 보냅니다.
export const fetchMockRecommendations = (contentTypeId: number): Promise<Place[]> => {
    console.log(`Fetching recommendations for contentTypeId: ${contentTypeId}...`);

    return new Promise((resolve) => {
        // 1초의 딜레이를 주어 실제 네트워크 요청처럼 보이게 합니다.
        setTimeout(() => {
            console.log("Mock data fetched!");
            // 실제 API라면 contentTypeId에 따라 다른 데이터를 반환해야 합니다.
            // 여기서는 예시로 항상 같은 데이터를 반환합니다.
            resolve(mockPlaces);
        }, 1000);
    });
};
