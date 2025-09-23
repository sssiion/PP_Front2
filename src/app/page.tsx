"use client"

import { useState , useEffect} from "react"
import { Sidebar } from "@/components/Sidebar";
import { format } from "date-fns";
import { MapContainer } from "@/components/MapContainer";
import { RecsSidebar } from "@/components/RecsSidebar";
import { OdsayRoute } from "@/types/odsay";

export interface Spot {
    contentId: string;
    title: string;
    addr1: string;
    firstImage: string;
    distanceMeters: number;
    mapX: number; // 좌표는 문자열로 올 수 있으므로 string으로 받음
    mapY: number;
}

export default function Home() {
    const [query, setQuery] = useState("서울역");
    const [searchedLocation, setSearchedLocation] = useState<naver.maps.LatLng | null>(null);

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>("");// e.g., "14:30"

    const [recommendedSpots, setRecommendedSpots] = useState<Spot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecsPanelOpen, setIsRecsPanelOpen] = useState(false);

    const [directionsDestination, setDirectionsDestination] = useState<Spot | null>(null);
    const [selectedRoute, setSelectedRoute] = useState<OdsayRoute | null>(null);

    const toggleRecsPanel = () => setIsRecsPanelOpen(!isRecsPanelOpen);

    // 2. 검색 버튼을 눌렀을 때 실행될 데이터 요청 함수
    const handleSearch = async () => {
        if (!searchedLocation) {
            alert("먼저 기준 위치를 검색해주세요.");
            return;
        }

        setIsLoading(true);
        setRecommendedSpots([]); // 이전 결과 초기화
        toggleRecsPanel();

        const finalDateTime = selectedDate ? new Date(selectedDate) : new Date();
        if (selectedTime) {
            const [hours, minutes] = selectedTime.split(':');
            finalDateTime.setHours(Number(hours), Number(minutes), 0, 0);
        }
        // 상태 값들을 조합하여 동적인 API URL 생성
        const lat = searchedLocation.lat();
        const lon = searchedLocation.lng();
        // 3. 결정된 시간(searchDateTime)을 포맷팅하여 API URL에 사용
        const time = format(finalDateTime, "HH:mm:ss");

        // 카테고리가 있다면 쿼리에 추가 (실제 API가 카테고리를 지원해야 함)
        const categoryQuery = selectedCategory ? `&category=${selectedCategory}` : "";

        const apiUrl = `http://localhost:8080/api/recommend/?lat=${lat}&lon=${lon}&time=${time}&type=${categoryQuery}`;

        try {
            const response = await fetch(apiUrl);
            const data: Spot[] = await response.json();
            console.log("서버로부터 받은 실제 데이터:", data);
            data.sort((a, b) => a.distanceMeters - b.distanceMeters);
            setRecommendedSpots(data);
        } catch (error) {
            console.error("추천 장소 검색 실패:", error);
            alert("추천 장소를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (window.naver) {
            setSearchedLocation(new window.naver.maps.LatLng(37.5557, 126.9730));
        }
    }, []);

    const handleRouteSearch = async (destination: Spot) => {
        if (!searchedLocation) {
            alert("출발지가 설정되지 않았습니다.");
            return;
        }

        // 목적지와 로딩 상태 업데이트
        setDirectionsDestination(destination);
        setIsLoading(true);

        const sx = searchedLocation.lng(); // 출발지 경도
        const sy = searchedLocation.lat();  // 출발지 위도
        const ex = destination.mapX;     // 도착지 경도
        const ey = destination.mapY;     // 도착지 위도

        // 여기에 실제 ODsay API 호출 코드를 작성합니다.
        // 예시: const apiUrl = `https://api.odsay.com/v1/api/searchPubTransPath?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=...`;
        try {
            // const response = await fetch(apiUrl);
            // const data = await response.json();
            // setSelectedRoute(data.result); // 실제 API 응답 구조에 맞게 수정

            // --- 임시 더미 데이터 ---
            // 실제 API 연동 전 테스트를 위한 가짜 경로 데이터입니다.
            const dummyRouteData = { /* ... ODsay API 응답과 유사한 구조의 가짜 데이터 ... */ };
            setSelectedRoute(dummyRouteData as OdsayRoute);
            // --- 임시 더미 데이터 끝 ---

        } catch (error) {
            console.error("길찾기 API 호출 실패:", error);
            alert("경로를 찾는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex h-screen w-screen overflow-hidden">
            <Sidebar
                query={query}
                onQueryChange={setQuery}
                onSearch={handleSearch}
                setSearchedLocation={setSearchedLocation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                date={selectedDate}
                onDateChange={setSelectedDate}
                time={selectedTime}
                onTimeChange={setSelectedTime}
            />

            <div className="flex-1 relative">
                <MapContainer
                    centerLocation={searchedLocation}
                    spots={recommendedSpots}
                    onToggleRecsPanel={toggleRecsPanel}
                    selectedRoute={selectedRoute}
                    directionsDestination={directionsDestination}
                />
                {isRecsPanelOpen && (
                    <RecsSidebar
                        onClose={toggleRecsPanel}
                        places={recommendedSpots}
                        isLoading={isLoading}
                        // ✨ 4. RecsSidebar에 길찾기 요청 함수 전달
                        onRouteSearch={handleRouteSearch}
                        // ✨ 5. RecsSidebar에 경로 결과와 목적지 정보 전달
                        routeInfo={selectedRoute}
                        destinationInfo={directionsDestination}
                    />
                )}
            </div>
        </main>
    );
}