"use client"

import { useState , useEffect} from "react"
import { Sidebar } from "@/components/Sidebar";
import { format } from "date-fns";
import { MapContainer } from "@/components/MapContainer";
import { RecsSidebar } from "@/components/RecsSidebar";

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
    const [dateTime, setDateTime] = useState<Date | null>(null);
    const [recommendedSpots, setRecommendedSpots] = useState<Spot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecsPanelOpen, setIsRecsPanelOpen] = useState(false);

    const toggleRecsPanel = () => setIsRecsPanelOpen(!isRecsPanelOpen);

    // 2. 검색 버튼을 눌렀을 때 실행될 데이터 요청 함수
    const handleSearch = async () => {
        if (!searchedLocation) {
            alert("먼저 기준 위치를 검색해주세요.");
            return;
        }
        setIsLoading(true);

        const searchDateTime = dateTime || new Date();

        setRecommendedSpots([]); // 이전 결과 초기화
        toggleRecsPanel();
        // 상태 값들을 조합하여 동적인 API URL 생성
        const lat = searchedLocation.lat();
        const lon = searchedLocation.lng();
        // 3. 결정된 시간(searchDateTime)을 포맷팅하여 API URL에 사용
        const time = format(searchDateTime, "HH:mm:ss");

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

    return (
        <main className="flex h-screen w-screen overflow-hidden">
            <Sidebar
                query={query}
                onQueryChange={setQuery}
                onSearch={handleSearch}
                setSearchedLocation={setSearchedLocation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                dateTime={dateTime}
                onDateTimeChange={setDateTime}
            />

            <div className="flex-1 relative">
                <MapContainer
                    centerLocation={searchedLocation}
                    spots={recommendedSpots}
                    onToggleRecsPanel={toggleRecsPanel}
                />
                {isRecsPanelOpen && (
                    <RecsSidebar
                        onClose={toggleRecsPanel}
                        places={recommendedSpots}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </main>
    );
}