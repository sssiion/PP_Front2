// naver.d.ts

// 이 파일은 @types/navermaps에 누락된 타입들을 보강하고, 
// 프로젝트 전역에서 사용될 커스텀 타입을 정의합니다.

// Service.search의 응답 아이템 타입
interface NaverSearchItem {
    title: string;
    address: string;
    roadAddress: string;
    category: string;
}

// Service.search의 응답 구조 타입
interface NaverSearchResponse {
    v2: {
        items: NaverSearchItem[];
    };
}

// naver.maps 전역 네임스페이스를 확장합니다.
// 이를 통해 기존 타입 정의를 덮어쓰지 않고 안전하게 새로운 타입(Service.search)을 추가할 수 있습니다.
declare namespace naver.maps {
    namespace Service {
        function search(
            options: {
                query: string;
                count?: number;
            },
            callback: (status: naver.maps.Service.Status, response: NaverSearchResponse) => void
        ): void;
    }
}
