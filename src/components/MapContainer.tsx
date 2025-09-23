"use client";

import { useEffect, useRef } from "react";
import type { Place } from "./RightSidebar";
import { OdsayRoute } from "@/types/odsay";

interface MapContainerProps {
    searchedLocation: naver.maps.LatLng | null;
    recommendedPlaces: Place[];
    selectedRoute: OdsayRoute | null;
}

export function MapContainer({ searchedLocation, recommendedPlaces, selectedRoute }: MapContainerProps) {
    const mapElement = useRef<HTMLDivElement>(null);
    const mapRef = useRef<naver.maps.Map | null>(null);
    const mainMarkerRef = useRef<naver.maps.Marker | null>(null);
    const recommendationMarkersRef = useRef<naver.maps.Marker[]>([]);
    const directionsPolylineRef = useRef<naver.maps.Polyline[]>([]);

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

    // ODsay 대중교통 길찾기 경로 표시
    useEffect(() => {
        // 1. 기존 경로가 있다면 삭제
        if (directionsPolylineRef.current.length > 0) {
            directionsPolylineRef.current.forEach(line => line.setMap(null));
            directionsPolylineRef.current = [];
        }

        if (!selectedRoute || !mapRef.current || !searchedLocation) {
            return;
        }

        const newPolylines: naver.maps.Polyline[] = [];
        const { pathInfo, geometry } = selectedRoute;

        // 모든 경로에 적용할 단일 스타일 (수정된 부분)
        const uniformStyle = {
            strokeWeight: 9,
            strokeOpacity: 0.9,
            strokeColor: '#2E64FE',
            strokeLineCap: "round" as naver.maps.StrokeLineCapType,
            strokeLineJoin: "round" as naver.maps.StrokeLineJoinType,
        };

        // 출발지(빨간 점)와 경로 시작점을 잇는 연결선 추가
        if (pathInfo.subPath.length > 0) {
            const routeStartPoint = new naver.maps.LatLng(pathInfo.subPath[0].startY, pathInfo.subPath[0].startX);
            // 거리가 2km 이내일 때만 연결선 표시 (수정된 부분)
            if (mapRef.current.getProjection().getDistance(searchedLocation, routeStartPoint) < 2000) {
                const connectorLine = new naver.maps.Polyline({
                    map: mapRef.current!,
                    path: [searchedLocation, routeStartPoint],
                    ...uniformStyle
                });
                newPolylines.push(connectorLine);
            }
        }

        // subPath를 순회하며 도보 경로 그리기
        pathInfo.subPath.forEach((subPath) => {
            if (subPath.trafficType === 3) { // trafficType 3: 도보
                const lineArray = [
                    new naver.maps.LatLng(subPath.startY, subPath.startX),
                    new naver.maps.LatLng(subPath.endY, subPath.endX)
                ];
                const polyline = new naver.maps.Polyline({
                    map: mapRef.current!,
                    path: lineArray,
                    ...uniformStyle
                });
                newPolylines.push(polyline);
            }
        });

        // geometry.lane을 순회하며 버스/지하철 경로 그리기
        geometry?.lane?.forEach((lane) => {
            lane.section?.forEach((section) => {
                const lineArray: naver.maps.LatLng[] = [];
                section.graphPos?.forEach((pos) => {
                    lineArray.push(new naver.maps.LatLng(pos.y, pos.x));
                });

                if (lineArray.length > 1) {
                    const polyline = new naver.maps.Polyline({
                        map: mapRef.current!,
                        path: lineArray,
                        ...uniformStyle
                    });
                    newPolylines.push(polyline);
                }
            });
        });

        directionsPolylineRef.current = newPolylines;

        // 경로가 보이도록 지도 범위 조절
        if (geometry?.boundary) {
            const boundary = new naver.maps.LatLngBounds(
                new naver.maps.LatLng(geometry.boundary.top, geometry.boundary.left),
                new naver.maps.LatLng(geometry.boundary.bottom, geometry.boundary.right)
            );
            mapRef.current?.fitBounds(boundary, { top: 100, right: 400, bottom: 100, left: 100 });
        }

    }, [selectedRoute, searchedLocation]);

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