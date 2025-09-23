"use client";

import { useEffect, useRef } from "react";
import { List } from "lucide-react";
import { Spot } from "@/app/page"; // 1. page.tsx에서 정의한 Spot 타입 import

// 부모로부터 받을 props 타입 정의
interface MapContainerProps {
    centerLocation: naver.maps.LatLng | null;
    spots: Spot[];
    onToggleRecsPanel: () => void;
}

export function MapContainer({ centerLocation, spots, onToggleRecsPanel }: MapContainerProps) {
    const mapRef = useRef<naver.maps.Map | null>(null);
    const mainMarkerRef = useRef<naver.maps.Marker | null>(null);
    const recommendationMarkersRef = useRef<naver.maps.Marker[]>([]); // 추천 장소 마커들

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
    }, [spots]);

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
