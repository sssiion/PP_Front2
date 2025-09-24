"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";
import { RightSidebar } from "@/components/RightSidebar";
import { OdsayRoute } from "@/types/odsay";
import { Spot } from "@/types/spot";
import { format } from "date-fns";

export default function Home() {
    // 애플리케이션의 핵심 상태들을 관리합니다.
    const [query, setQuery] = useState("서울역");
    const [searchedLocation, setSearchedLocation] = useState<naver.maps.LatLng | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // 카테고리 기본 선택 없음
    const [selectedTime, setSelectedTime] = useState<string>("13:30");

    const [recommendedSpots, setRecommendedSpots] = useState<Spot[]>([]);
    const [isRecsPanelOpen, setIsRecsPanelOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [directionsDestination, setDirectionsDestination] = useState<Spot | null>(null);
    const [isDirectionsLoading, setIsDirectionsLoading] = useState(false);
    const [directionsResult, setDirectionsResult] = useState<OdsayRoute[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

    // 페이지 로드 시 기본 위치(서울역) 설정 및 검색 실행
    useEffect(() => {
        if (window.naver) {
            const defaultLocation = new window.naver.maps.LatLng(37.5557, 126.9730);
            setSearchedLocation(defaultLocation);
        }
    }, []);

    const handleSearch = async () => {
        if (!searchedLocation) {
            alert("먼저 기준 위치를 검색해주세요.");
            return;
        }

        setIsLoading(true);
        setRecommendedSpots([]);
        setIsRecsPanelOpen(true);
        // 검색 시 기존 경로 결과 초기화
        setDirectionsDestination(null);
        setDirectionsResult([]);

        const finalDateTime = new Date(); // 항상 현재 날짜를 사용
        if (selectedTime) {
            const [hours, minutes] = selectedTime.split(':');
            finalDateTime.setHours(Number(hours), Number(minutes), 0, 0);
        }

        const lat = searchedLocation.lat();
        const lon = searchedLocation.lng();
        const time = format(finalDateTime, "HH:mm:ss");
        const categoryQuery = selectedCategory || "";

        const apiUrl = `https://pp-production-d014.up.railway.app/api/recommend/?lat=${lat}&lon=${lon}&time=${time}&type=${categoryQuery}&radius=8000`;

        console.log("Requesting API URL:", apiUrl); // 디버깅을 위한 로그 추가

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: Spot[] = await response.json();
            console.log("서버로부터 받은 실제 데이터:", data);

            if (data.length === 0) {
                alert("해당 조건에 맞는 추천 장소가 없습니다.");
            }

            data.sort((a, b) => a.distanceMeters - b.distanceMeters);
            setRecommendedSpots(data);
        } catch (error) {
            console.error("추천 장소 검색 실패:", error);
            alert("추천 장소를 불러오는 데 실패했습니다.");
            setIsRecsPanelOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetDirections = async (spot: Spot) => {
        if (!searchedLocation) {
            alert("출발지가 설정되지 않았습니다. 먼저 지역을 검색해주세요.");
            return;
        }
        setDirectionsDestination(spot);
        setIsDirectionsLoading(true);
        setDirectionsResult([]);
        setSelectedRouteIndex(0);

        try {
            const url = `/api/odsay-directions?sx=${searchedLocation.lng()}&sy=${searchedLocation.lat()}&ex=${spot.mapX}&ey=${spot.mapY}`;
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "경로 데이터를 가져오는 데 실패했습니다.");
            }
            const data = await response.json();
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

    return (
        <main className="relative flex h-screen w-screen">
            <Sidebar
                query={query}
                setQuery={setQuery}
                setSearchedLocation={setSearchedLocation}
                onSearch={handleSearch}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                time={selectedTime}
                onTimeChange={setSelectedTime}
            />

            <MapContainer
                searchedLocation={searchedLocation}
                recommendedSpots={recommendedSpots}
                selectedRoute={directionsResult?.[selectedRouteIndex]}
                directionsDestination={directionsDestination}
            />

            <RightSidebar
                isOpen={isRecsPanelOpen}
                onClose={() => {
                    setIsRecsPanelOpen(false);
                    setDirectionsDestination(null);
                    setDirectionsResult([]);
                }}
                spots={recommendedSpots}
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