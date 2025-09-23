"use client"

import { useState , useEffect} from "react"
import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";
import { RecsSidebar } from "@/components/RecsSidebar";

interface Spot {
    contentId: string;
    title: string;
    addr1: string;
    firstImage: string;
    distanceMeters: number;
    mapx: string; // 좌표는 문자열로 올 수 있으므로 string으로 받음
    mapy: string;
}

export default function Home() {
    const [selectedLocation, setSelectedLocation] = useState<any>(null);

    // 2. 오른쪽 사이드바의 열림/닫힘 상태를 관리
    const [isRecsPanelOpen, setIsRecsPanelOpen] = useState(false);

    const [recommendedPlaces, setRecommendedPlaces] = useState<Spot[]>([]);

    // 3. 상태를 반전시키는 함수
    const toggleRecsPanel = () => {
        setIsRecsPanelOpen(!isRecsPanelOpen);
    };

    useEffect(() => {
        const fetchRecommendedSpots = async () => {
            try {
                const apiUrl = "http://localhost:8080/api/recommend/list3?lat=37.5557&lon=126.9730&time=13:30:00";
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('API fetching failed');
                const data: Spot[] = await response.json();
                data.sort((a, b) => a.distanceMeters - b.distanceMeters);
                setRecommendedPlaces(data);
            } catch (error) {
                console.error("추천 관광지 데이터를 불러오는 데 실패했습니다:", error);
            }
        };

        fetchRecommendedSpots();
    }, []);

    return (
          <main className="flex h-screen w-screen overflow-hidden">
              <Sidebar onLocationSelect={setSelectedLocation} />

              <div className="flex-1 relative">
                  <MapContainer
                      selectedLocation={selectedLocation}
                      onToggleRecsPanel={toggleRecsPanel}
                      recommendedPlaces={recommendedPlaces}
                      // 4. 버튼을 누를 함수를 props로 전달
                  />


                  {/* 5. isRecsPanelOpen이 true일 때만 오른쪽 사이드바를 렌더링 */}
                  {isRecsPanelOpen &&
                      <RecsSidebar
                          onClose={toggleRecsPanel}
                          places={recommendedPlaces}
                      />}
              </div>

          </main>
    );
}