"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";
import { RightSidebar, Place } from "@/components/RightSidebar";
import { fetchMockRecommendations } from "@/lib/mockApi";

export default function Home() {
  // 애플리케이션의 핵심 상태들을 관리합니다.
  const [searchedLocation, setSearchedLocation] = useState<naver.maps.LatLng | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 카테고리 선택 시 호출되는 함수
  const handleCategorySelect = async (contentTypeId: number) => {
    if (!searchedLocation) {
      alert("먼저 지역을 검색해주세요.");
      return;
    }

    // 이미 선택된 카테고리를 다시 누르면 사이드바를 닫습니다.
    if (selectedCategoryId === contentTypeId && isRightSidebarOpen) {
        setIsRightSidebarOpen(false);
        setSelectedCategoryId(null);
        setRecommendedPlaces([]);
        return;
    }

    setIsLoading(true);
    setIsRightSidebarOpen(true);
    setSelectedCategoryId(contentTypeId);

    // 백엔드 API 호출 URL 구성 (예시)
    const { y: lat, x: lon } = searchedLocation;
    const url = `http://localhost:8080/api/recommend/list3?lat=${lat}&lon=${lon}&time=13:30:00&windowMin=15&radius=8000&pageSize=200&type=${contentTypeId}`;
    console.log("Requesting to:", url);

    // 임시 Mock API 호출
    const places = await fetchMockRecommendations(contentTypeId);
    setRecommendedPlaces(places);
    setIsLoading(false);
  };

  return (
      <main className="relative flex h-screen w-screen">
        {/* 왼쪽 사이드바 */}
        <Sidebar
            setSearchedLocation={setSearchedLocation}
            onCategorySelect={handleCategorySelect}
            selectedCategoryId={selectedCategoryId}
        />

        {/* 중앙 지도 영역 */}
        <MapContainer
            searchedLocation={searchedLocation}
            recommendedPlaces={recommendedPlaces}
        />

        {/* 오른쪽 추천 장소 사이드바 */}
        <RightSidebar
            isOpen={isRightSidebarOpen}
            onClose={() => {
                setIsRightSidebarOpen(false);
                setSelectedCategoryId(null);
                setRecommendedPlaces([]);
            }}
            places={recommendedPlaces}
            isLoading={isLoading}
        />
      </main>
  );
}