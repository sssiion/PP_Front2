"use client";

import { useEffect, useRef } from "react";
import type { Place } from "./RightSidebar";

interface MapContainerProps {
    searchedLocation: naver.maps.LatLng | null;
    recommendedPlaces: Place[];
}

export function MapContainer({ searchedLocation, recommendedPlaces }: MapContainerProps) {
    const mapElement = useRef<HTMLDivElement>(null);
    const mapRef = useRef<naver.maps.Map | null>(null);
    const mainMarkerRef = useRef<naver.maps.Marker | null>(null);
    const recommendationMarkersRef = useRef<naver.maps.Marker[]>([]);

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

    }, [recommendedPlaces]);



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