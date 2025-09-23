"use client";

import { useEffect, useRef } from "react";
import { List } from "lucide-react";
import { Spot } from "@/app/page"; // page.tsx에서 정의한 Spot 타입 import
import { OdsayRoute } from "@/types/odsay";

// 부모로부터 받을 props 타입 정의
interface MapContainerProps {
    centerLocation: naver.maps.LatLng | null;
    spots: Spot[];
    onToggleRecsPanel: () => void;
    selectedRoute: OdsayRoute | null; // 길찾기 경로 데이터
    directionsDestination: Spot | null;
}

export function MapContainer({ centerLocation, spots, onToggleRecsPanel, selectedRoute, directionsDestination }: MapContainerProps) {
    const mapRef = useRef<naver.maps.Map | null>(null);
    const mainMarkerRef = useRef<naver.maps.Marker | null>(null);
    const recommendationMarkersRef = useRef<naver.maps.Marker[]>([]); // 추천 장소 마커들

    // ✨ 2단계: 경로 표시를 위한 Ref 추가
    const directionsPolylineRef = useRef<naver.maps.Polyline[]>([]);
    const directionsMarkersRef = useRef<naver.maps.Marker[]>([]);

    // ✨ 동료 코드에서 가져온 안정성 높은 헬퍼 함수
    const isValidLatLng = (lat: number, lng: number) => {
        if (!lat || !lng || lat === 0 || lng === 0) return false;
        // 대한민국 위경도 대략적 범위
        if (lat < 33 || lat > 39) return false;
        if (lng < 124 || lng > 132) return false;
        return true;
    };

    // 지도 초기화 로직
    useEffect(() => {
        const { naver } = window;

        if (mapRef.current || !naver)
            return;

        // 지도가 아직 생성되지 않았고, naver API가 로드되었을 때만 실행
        if (!mapRef.current && naver) {
            const mapInstance = new naver.maps.Map('map', {
                center: new naver.maps.LatLng(37.5665, 126.978), // 초기 중심 위치
                zoom: 12,
                zoomControl: false,
            });
            mapRef.current = mapInstance;
        }
    }, []); // centerLocation이 처음 설정될 때를 위해 의존성 추가

    // 2. 검색 위치(centerLocation)가 변경되면 실행
    useEffect(() => {
        if (!mapRef.current || !centerLocation) return;
        const map = mapRef.current;

        // 2-1. 새로운 위치를 검색하면, 이전 추천 마커들을 즉시 제거
        recommendationMarkersRef.current.forEach(marker => marker.setMap(null));
        recommendationMarkersRef.current = [];

        if (mainMarkerRef.current) {
            mainMarkerRef.current.setMap(null);
        }

        map.panTo(centerLocation);

        const marker = new window.naver.maps.Marker({
            position: centerLocation,
            map: map,
            icon: {
                content: '<div class="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
                anchor: new window.naver.maps.Point(10, 10),
            },
        });
        mainMarkerRef.current = marker;

    }, [centerLocation]);

    // 3. 추천 장소(recommendedSpots)가 변경되면 실행
    useEffect(() => {
        if (!mapRef.current || !window.naver) return;
        const map = mapRef.current;
        const { naver } = window;

        // 기존 추천 마커들 제거 (검색 위치 변경 시 이미 제거되지만, 안전을 위해 유지)
        recommendationMarkersRef.current.forEach(marker => marker.setMap(null));
        recommendationMarkersRef.current = [];

        if (selectedRoute) return;

        if (spots.length > 0) {
            // 1. 첫 번째 장소의 좌표로 초기 경계를 생성합니다. (괄호 안을 채우는 핵심 부분)
            const firstSpot = spots[0];
            const startPoint = new naver.maps.LatLng(Number(firstSpot.mapY), Number(firstSpot.mapX));
            const bounds = new naver.maps.LatLngBounds(startPoint, startPoint);

            const newMarkers: naver.maps.Marker[] = [];
            spots.forEach(spot => {
                const location = new naver.maps.LatLng(Number(spot.mapY), Number(spot.mapX));
                const marker = new naver.maps.Marker({ position: location, map: map });
                newMarkers.push(marker);
                // 2. 나머지 장소들을 포함하도록 경계를 확장합니다.
                bounds.extend(location);
            });

            if (mainMarkerRef.current) {
                bounds.extend(mainMarkerRef.current.getPosition());
            }

            recommendationMarkersRef.current = newMarkers;
            // 3. 최종 경계에 맞춰 지도를 보여줍니다.
            map.fitBounds(bounds, { top: 100, right: 450, bottom: 100, left: 100 });
        }
    }, [spots, selectedRoute]);

    useEffect(() => {
        // --- 사전 준비 ---
        if (!mapRef.current || !window.naver) return;
        const map = mapRef.current;
        const { naver } = window;

        // --- 기존 경로/마커가 있다면 삭제 ---
        directionsPolylineRef.current.forEach(line => line.setMap(null));
        directionsPolylineRef.current = [];
        directionsMarkersRef.current.forEach(marker => marker.setMap(null));
        directionsMarkersRef.current = [];

        // --- 필요한 데이터가 없으면 경로를 그리지 않고 종료 ---
        if (!selectedRoute || !centerLocation || !directionsDestination) {
            // 경로 그리기가 끝났으므로, 숨겨뒀던 메인 마커를 다시 표시
            if (mainMarkerRef.current) mainMarkerRef.current.setMap(map);
            return;
        }

        // --- 경로 그리기를 시작하면, 기존 메인 마커는 숨김 ---
        if (mainMarkerRef.current) mainMarkerRef.current.setMap(null);

        const newPolylines: naver.maps.Polyline[] = [];
        const newMarkers: naver.maps.Marker[] = [];
        const { pathInfo, geometry } = selectedRoute;

        // --- 마커 생성 (출발 'S', 도착 'D') ---
        const startLatLng = centerLocation;
        const destinationLatLng = new naver.maps.LatLng(Number(directionsDestination.mapY), Number(directionsDestination.mapX));

        newMarkers.push(new naver.maps.Marker({
            position: startLatLng,
            map: map,
            icon: { content: `<div style="background-color: #1B75D9; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">S</div>`, anchor: new naver.maps.Point(12.5, 12.5) }
        }));
        newMarkers.push(new naver.maps.Marker({
            position: destinationLatLng,
            map: map,
            icon: { content: `<div style="background-color: #D92D2D; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">D</div>`, anchor: new naver.maps.Point(12.5, 12.5) }
        }));
        directionsMarkersRef.current = newMarkers;

        // --- 경로 좌표(masterPath) 수집 ---
        const masterPath: naver.maps.LatLng[] = [];
        if (isValidLatLng(startLatLng.y, startLatLng.x)) {
            masterPath.push(startLatLng);
        }
        geometry?.lane?.forEach(lane => {
            lane.section.forEach(sec => {
                sec.graphPos.forEach(p => {
                    if (isValidLatLng(p.y, p.x)) {
                        masterPath.push(new naver.maps.LatLng(p.y, p.x));
                    }
                });
            });
        });
        pathInfo?.subPath?.forEach(subPath => {
            if (subPath.trafficType === 3) { // 도보 구간
                if (isValidLatLng(subPath.startY, subPath.startX)) masterPath.push(new naver.maps.LatLng(subPath.startY, subPath.startX));
                if (isValidLatLng(subPath.endY, subPath.endX)) masterPath.push(new naver.maps.LatLng(subPath.endY, subPath.endX));
            }
        });
        if (isValidLatLng(destinationLatLng.y, destinationLatLng.x)) {
            masterPath.push(destinationLatLng);
        }
        const uniqueMasterPath = masterPath.filter((point, index, self) => index === 0 || !point.equals(self[index - 1]));

        // --- 경로선(Polyline) 생성 ---
        const routePolyline = new naver.maps.Polyline({
            map: map,
            path: uniqueMasterPath,
            strokeWeight: 8,
            strokeOpacity: 0.9,
            strokeColor: '#2E64FE',
            strokeLineCap: "round",
            strokeLineJoin: "round",
        });
        newPolylines.push(routePolyline);
        directionsPolylineRef.current = newPolylines;

        // --- 지도 범위 조절 ---
        const bounds = new naver.maps.LatLngBounds(startLatLng, destinationLatLng);
        map.fitBounds(bounds, { top: 100, right: 450, bottom: 100, left: 100 });

    }, [selectedRoute, centerLocation, directionsDestination]); // 의존성 배열

    return (
        <section className="flex-1 h-full relative">
            <div id="map" className="w-full h-full" />
            <div className="absolute top-4 right-4 space-y-2 z-10">
                <button
                    onClick={onToggleRecsPanel}
                    className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100"
                >
                    <List className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        </section>
    );
}
