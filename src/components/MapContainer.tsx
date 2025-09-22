"use client"; // 지도 API는 클라이언트 측에서 동작하므로 이 지시어가 필요합니다.

import { useEffect, useRef } from "react"; // 1. useEffect와 useRef를 import 합니다.
import { MapPin } from "lucide-react";

export function MapContainer() {

    const mapElement = useRef<HTMLDivElement>(null);

    // 3. 컴포넌트가 처음 화면에 표시된 후 딱 한 번만 실행될 코드를 작성합니다.
    useEffect(() => {
        const { naver } = window;
        // 지도를 표시할 div와 naver API가 모두 준비되었는지 확인합니다.
        if (!mapElement.current || !naver) return;

        // 지도의 중심 좌표와 옵션을 설정합니다.
        const location = new naver.maps.LatLng(37.5665, 126.9780);
        const mapOptions: naver.maps.MapOptions = {
            center: location,
            zoom: 12,
            zoomControl: false,
        };

        // 새로운 지도 객체를 생성합니다.
        const map = new naver.maps.Map(mapElement.current, mapOptions);

        // (선택) 여기에 마커를 추가할 수 있습니다.
        // new naver.maps.Marker({ position: location, map });

    }, []);

    return (
        <section className="flex-1 h-full relative">
            {/* 지도 API 연동 전 Placeholder */}
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div ref={mapElement} className="w-full h-full" />
            </div>

            {/* 지도 컨트롤 버튼들 */}
            <div className="absolute top-4 right-4 space-y-2">
                <button className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100">🗺️</button>
                <button className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100">📍</button>
                <button className="w-10 h-10 bg-white rounded-md shadow-md flex items-center justify-center hover:bg-gray-100">⚙️</button>
            </div>
        </section>
    );
}