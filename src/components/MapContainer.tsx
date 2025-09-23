"use client";

import { useEffect, useRef } from "react";
import type { Place } from "./RightSidebar";
import { OdsayRoute } from "@/types/odsay";

interface MapContainerProps {
    searchedLocation: naver.maps.LatLng | null;
    recommendedPlaces: Place[];
    selectedRoute: OdsayRoute | null;
    directionsDestination: Place | null;
}

export function MapContainer({ searchedLocation, recommendedPlaces, selectedRoute, directionsDestination }: MapContainerProps) {
    const mapElement = useRef<HTMLDivElement>(null);
    const mapRef = useRef<naver.maps.Map | null>(null);
    const mainMarkerRef = useRef<naver.maps.Marker | null>(null);
    const recommendationMarkersRef = useRef<naver.maps.Marker[]>([]);
    const directionsPolylineRef = useRef<naver.maps.Polyline[]>([]);
    const directionsMarkersRef = useRef<naver.maps.Marker[]>([]);

    // 지도 초기화
    useEffect(() => {
        const { naver } = window;
        if (!mapElement.current || !naver) return;

        const location = new naver.maps.LatLng(37.5665, 126.9780);
        const mapOptions: naver.maps.MapOptions = {
            center: location,
            zoom: 12,
            zoomControl: false,
        };

        mapRef.current = new naver.maps.Map(mapElement.current, mapOptions);
    }, []);

    // 검색된 위치로 지도 이동 및 메인 마커 표시
    useEffect(() => {
        if (searchedLocation && mapRef.current) {
            if (mainMarkerRef.current) {
                mainMarkerRef.current.setMap(null);
            }

            mapRef.current.setCenter(searchedLocation);
            mapRef.current.setZoom(12);

            mainMarkerRef.current = new naver.maps.Marker({
                position: searchedLocation,
                map: mapRef.current || undefined,
                icon: {
                    content: `<div style="background-color: red; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                    anchor: new naver.maps.Point(12.5, 12.5),
                }
            });
        }
    }, [searchedLocation]);

    // 추천 장소 마커 표시
    useEffect(() => {
        if (!mapRef.current) return;

        recommendationMarkersRef.current.forEach(marker => marker.setMap(null));
        recommendationMarkersRef.current = [];

        if (selectedRoute) return; // 경로 결과가 있을때는 추천 장소 마커를 숨김

        if (recommendedPlaces.length > 0) {
            const firstPlaceLocation = new naver.maps.LatLng(parseFloat(recommendedPlaces[0].mapy), parseFloat(recommendedPlaces[0].mapx));
            const bounds = new naver.maps.LatLngBounds(firstPlaceLocation, firstPlaceLocation);

            if (mainMarkerRef.current) {
                bounds.extend(mainMarkerRef.current.getPosition());
            }

            const newMarkers: naver.maps.Marker[] = [];
            recommendedPlaces.forEach(place => {
                const location = new naver.maps.LatLng(parseFloat(place.mapy), parseFloat(place.mapx));
                const marker = new naver.maps.Marker({
                    position: location,
                    map: mapRef.current || undefined,
                });
                newMarkers.push(marker);
                bounds.extend(location);
            });

            recommendationMarkersRef.current = newMarkers;

            mapRef.current.fitBounds(bounds, { top: 100, right: 400, bottom: 100, left: 100 });
        }

    }, [recommendedPlaces, selectedRoute]);

    const isValidLatLng = (lat: number, lng: number) => {
        if (!lat || !lng || lat === 0 || lng === 0) return false;
        if (lat < 33 || lat > 39) return false;
        if (lng < 124 || lng > 132) return false;
        return true;
    };

    // ODsay 대중교통 길찾기 경로 표시
    useEffect(() => {
        // 1. 기존 경로/마커가 있다면 삭제
        if (directionsPolylineRef.current.length > 0) {
            directionsPolylineRef.current.forEach(line => line.setMap(null));
            directionsPolylineRef.current = [];
        }
        if (directionsMarkersRef.current.length > 0) {
            directionsMarkersRef.current.forEach(marker => marker.setMap(null));
            directionsMarkersRef.current = [];
        }

        if (!selectedRoute || !mapRef.current || !searchedLocation || !directionsDestination) {
            if (mainMarkerRef.current) mainMarkerRef.current.setMap(mapRef.current);
            return;
        }

        if (mainMarkerRef.current) mainMarkerRef.current.setMap(null);

        const newPolylines: naver.maps.Polyline[] = [];
        const newMarkers: naver.maps.Marker[] = [];
        const { pathInfo, geometry } = selectedRoute;

        // --- 마커 생성 --- //
        const startLatLng = searchedLocation;
        const destinationLatLng = new naver.maps.LatLng(parseFloat(directionsDestination.mapy), parseFloat(directionsDestination.mapx));

        newMarkers.push(new naver.maps.Marker({
            position: startLatLng,
            map: mapRef.current,
            icon: { content: `<div style="background-color: #1B75D9; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">S</div>`, anchor: new naver.maps.Point(12.5, 12.5) }
        }));
        newMarkers.push(new naver.maps.Marker({
            position: destinationLatLng,
            map: mapRef.current,
            icon: { content: `<div style="background-color: #D92D2D; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">D</div>`, anchor: new naver.maps.Point(12.5, 12.5) }
        }));
        directionsMarkersRef.current = newMarkers;

        // --- 단일 폴리라인 생성 --- //
        const masterPath: naver.maps.LatLng[] = [];
        if (isValidLatLng(startLatLng.y, startLatLng.x)) {
            masterPath.push(startLatLng);
        }

        // 1. 모든 대중교통 상세 경로 좌표를 추가
        geometry?.lane?.forEach(lane => {
            lane.section.forEach(sec => {
                sec.graphPos.forEach(p => {
                    if (isValidLatLng(p.y, p.x)) {
                        masterPath.push(new naver.maps.LatLng(p.y, p.x));
                    }
                });
            });
        });

        // 2. 모든 도보 경로의 시작/끝 좌표를 추가
        pathInfo.subPath.forEach(subPath => {
            if (subPath.trafficType === 3) {
                if (isValidLatLng(subPath.startY, subPath.startX)) {
                    masterPath.push(new naver.maps.LatLng(subPath.startY, subPath.startX));
                }
                if (isValidLatLng(subPath.endY, subPath.endX)) {
                    masterPath.push(new naver.maps.LatLng(subPath.endY, subPath.endX));
                }
            }
        });

        if (isValidLatLng(destinationLatLng.y, destinationLatLng.x)) {
            masterPath.push(destinationLatLng);
        }

        // 연속된 중복 좌표 제거하여 경로를 부드럽게 만듦
        const uniqueMasterPath = masterPath.filter((point, index, self) =>
            index === 0 || !point.equals(self[index - 1])
        );

        const transitStyle = {
            strokeWeight: 8,
            strokeOpacity: 0.9,
            strokeColor: '#2E64FE',
            strokeLineCap: "round" as naver.maps.StrokeLineCapType,
            strokeLineJoin: "round" as naver.maps.StrokeLineJoinType,
        };

        const routePolyline = new naver.maps.Polyline({
            map: mapRef.current,
            path: uniqueMasterPath,
            ...transitStyle
        });
        newPolylines.push(routePolyline);
        directionsPolylineRef.current = newPolylines;

        // --- 지도 범위 조절 --- //
        const bounds = new naver.maps.LatLngBounds(startLatLng, destinationLatLng);
        mapRef.current?.fitBounds(bounds, { top: 100, right: 400, bottom: 100, left: 100 });

    }, [selectedRoute, searchedLocation, directionsDestination]);

    return (
        <section className="flex-1 h-full relative">
            <div ref={mapElement} className="w-full h-full" />

            <div className="absolute top-4 right-4 space-y-2 z-10">
                <button className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100">🗺️</button>
                <button className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100">📍</button>
                <button className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100">⚙️</button>
            </div>
        </section>
    );
}