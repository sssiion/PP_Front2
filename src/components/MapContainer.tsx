"use client"; // 지도 API는 클라이언트 측에서 동작하므로 이 지시어가 필요합니다.

import { useEffect, useRef, useState } from "react"; // 1. useEffect와 useRef를 import 합니다.
import {List, MapPin} from "lucide-react";

interface MapContainerProps {
    selectedLocation: any;
    onToggleRecsPanel: () => void; // 함수 타입 추가
    recommendedPlaces: any[]; // 부모로부터 추천 장소 목록을 받음
}

export function MapContainer({ selectedLocation, onToggleRecsPanel, recommendedPlaces }: MapContainerProps) {

    const mapRef = useRef<naver.maps.Map | null>(null); // 지도 인스턴스를 저장할 ref
    const recommendationMarkersRef = useRef<naver.maps.Marker[]>([]); // 추천 마커들을 저장할 ref

    // 3. 컴포넌트가 처음 화면에 표시된 후 딱 한 번만 실행될 코드를 작성합니다.
    useEffect(() => {
        const { naver } = window;
        if (!mapRef.current && naver) { // 지도가 없을 때만 초기화
            const mapInstance = new naver.maps.Map('map', { // id 'map'을 가진 div에 지도를 생성
                center: new naver.maps.LatLng(37.5665, 126.978),
                zoom: 12,
                zoomControl: false,
            });
            mapRef.current = mapInstance;
        }
    }, []);

    useEffect(() => {
        if (!mapRef.current || !window.naver) return;

        const map = mapRef.current;
        const { naver } = window;

        // 1. 기존 추천 마커들 제거
        recommendationMarkersRef.current.forEach(marker => marker.setMap(null));
        recommendationMarkersRef.current = [];

        // 2. 새로운 추천 장소 데이터로 마커 생성
        if (recommendedPlaces.length > 0) {
            const firstPlace = recommendedPlaces[0];
            const startPoint = new naver.maps.LatLng(parseFloat(firstPlace.mapY), parseFloat(firstPlace.mapX));
            const bounds = new naver.maps.LatLngBounds(startPoint, startPoint);
            const newMarkers: any[] = [];

            recommendedPlaces.forEach(place => {
                const location = new naver.maps.LatLng(parseFloat(place.mapY), parseFloat(place.mapX));
                const marker = new naver.maps.Marker({
                    position: location,
                    map: map,
                });
                newMarkers.push(marker);
                bounds.extend(location); // 마커 위치를 포함하도록 경계 확장
            });

            recommendationMarkersRef.current = newMarkers;

            // 3. 모든 마커가 보이도록 지도 시야 조정
            map.fitBounds(bounds, { top: 100, right: 450, bottom: 100, left: 100 });
        }
    }, [recommendedPlaces]); // recommendedPlaces 데이터가 바뀔 때마다 이 로직 실행


    return (
        <section className="flex-1 h-full relative">

            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div id="map" className="w-full h-full" />
            </div>

            {/* 지도 컨트롤 버튼들 */}
            <div className="absolute top-4 right-4 space-y-2">
                {/* 2. 추천 목록을 여는 버튼 추가 */}
                <button
                    onClick={onToggleRecsPanel} // 부모로부터 받은 함수 실행
                    className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100"
                >
                    <List className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        </section>
    );
}