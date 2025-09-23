"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";
import { RightSidebar, Place } from "@/components/RightSidebar";
import { fetchMockRecommendations } from "@/lib/mockApi";
import { OdsayRoute } from "@/types/odsay";


export default function Home() {
  // 애플리케이션의 핵심 상태들을 관리합니다.
  const [searchedLocation, setSearchedLocation] = useState<naver.maps.LatLng | null>(null);
  const [query, setQuery] = useState(""); // 검색어 상태 추가
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [directionsDestination, setDirectionsDestination] = useState<Place | null>(null);
  const [isDirectionsLoading, setIsDirectionsLoading] = useState(false);
  const [directionsResult, setDirectionsResult] = useState<OdsayRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // 길찾기 목적지 선택 시 호출되는 함수
  const handleGetDirections = async (place: Place) => {
    if (!searchedLocation) {
      alert("출발지가 설정되지 않았습니다. 먼저 지역을 검색해주세요.");
      return;
    }
    setDirectionsDestination(place);
    setIsDirectionsLoading(true);
    setDirectionsResult([]);
    setSelectedRouteIndex(0);

    try {
      const url = `/api/odsay-directions?sx=${searchedLocation.x}&sy=${searchedLocation.y}&ex=${place.mapx}&ey=${place.mapy}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "경로 데이터를 가져오는 데 실패했습니다.");
      }
      const data = await response.json();
      // 총 소요시간이 짧은 순으로 경로 정렬
      data.sort((a: OdsayRoute, b: OdsayRoute) => a.pathInfo.info.totalTime - b.pathInfo.info.totalTime);
      setDirectionsResult(data);
    } catch (e) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert('경로를 가져오는 중 알 수 없는 오류가 발생했습니다.');
      }
      setDirectionsDestination(null);
    } finally {
      setIsDirectionsLoading(false);
    }
  };

  const handleSelectRoute = (index: number) => {
    setSelectedRouteIndex(index);
  };


  const handleCategorySelect = async (contentTypeId: number, locationOverride: naver.maps.LatLng | null = null) => {
    // 새로운 카테고리 검색 시, 기존 경로 결과 초기화
    setDirectionsDestination(null);
    setDirectionsResult([]);

    const locationToUse = locationOverride || searchedLocation;

    if (!locationToUse) {
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
    const { y: lat, x: lon } = locationToUse;
    const url = `http://localhost:8080/api/recommend/list3?lat=${lat}&lon=${lon}&time=13:30:00&windowMin=15&radius=8000&pageSize=200&type=${contentTypeId}`;

    // 주석: 아래는 실제 백엔드 API를 호출하는 부분입니다.
    // API 주소, 파라미터 등을 수정하려면 이 로직을 변경하면 됩니다.
    try {
      const response = await fetch(url);
      const data = await response.json();

      // 주석: 백엔드 응답 구조에 따라 실제 데이터가 있는 경로를 지정합니다.
      // 현재 구조는 { response: { body: { items: { item: [...] } } } } 입니다.
      // 만약 구조가 변경되면 아래의 `data.response.body.items.item` 부분을 수정해야 합니다.
      const places = data.response?.body?.items?.item || [];
      setRecommendedPlaces(places);

    } catch {
      alert("백엔드 연결에 실패하여 임시 데이터로 표시합니다.");
      // 주석: API 연동 실패 시 Mock 데이터를 불러옵니다.
      const places = await fetchMockRecommendations(contentTypeId);
      setRecommendedPlaces(places);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <main className="relative flex h-screen w-screen">
        {/* 왼쪽 사이드바 */}
        <Sidebar
            query={query}
            setQuery={setQuery}
            setSearchedLocation={setSearchedLocation}
            onCategorySelect={handleCategorySelect}
            selectedCategoryId={selectedCategoryId}
        />

        {/* 중앙 지도 영역 */}
        <MapContainer
            searchedLocation={searchedLocation}
            recommendedPlaces={recommendedPlaces}
            selectedRoute={directionsResult?.[selectedRouteIndex]}
        />

        {/* 오른쪽 추천 장소 사이드바 */}
        <RightSidebar
            isOpen={isRightSidebarOpen}
            onClose={() => {
                setIsRightSidebarOpen(false);
                setSelectedCategoryId(null);
                setRecommendedPlaces([]);
                setDirectionsDestination(null);
                setDirectionsResult([]);
            }}
            places={recommendedPlaces}
            isLoading={isLoading}
            onGetDirections={handleGetDirections}
            directionsResult={directionsResult}
            isDirectionsLoading={isDirectionsLoading}
            originName={query}
            directionsDestination={directionsDestination}
            onSelectRoute={handleSelectRoute}
            selectedRouteIndex={selectedRouteIndex}
        />
      </main>
  );
}