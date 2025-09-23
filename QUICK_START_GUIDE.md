# 지도 기능 빠른 시작 가이드 (복사-붙여넣기용)

이 문서는 Next.js 프로젝트에 지도 및 경로 탐색 기능을 가장 빠르게 추가할 수 있도록, 필요한 모든 코드와 절차를 안내합니다. 아래 순서대로 파일을 생성하고 코드를 복사-붙여넣기 하세요.

---

## 1단계: 사전 설정

### 1.1. 의존성 설치
프로젝트 터미널에서 아래 명령어를 실행하세요.

```bash
# 지도 아이콘 및 shadcn/ui 기본 유틸리티
npm install lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui 컴포넌트 (이미 설치했다면 생략)
# npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input
```

### 1.2. 네이버 지도 스크립트 추가
`src/app/layout.tsx` 파일을 열고, `<head>` 태그 안에 아래 `<Script>` 태그를 추가하세요.
**`YOUR_NAVER_MAPS_CLIENT_ID`** 부분은 실제 발급받은 네이버 지도 Client ID로 반드시 교체해야 합니다.

```tsx
// src/app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <Script
          strategy="beforeInteractive"
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_NAVER_MAPS_CLIENT_ID&submodules=geocoder,drawing`}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 1.3. API 키 설정
프로젝트 최상위 폴더에 `.env.local` 파일을 생성하고, 발급받은 ODSay API 키를 추가하세요.

```
# .env.local
ODSAY_API_KEY=YOUR_ODSAY_API_KEY
```

---

## 2단계: 코드 복사 및 붙여넣기

아래 각 파일 경로에 맞게 파일을 생성하고, 해당 코드 블록의 내용을 그대로 복사하여 붙여넣으세요.

### 📄 파일: `src/types/odsay.d.ts`
```ts
export interface OdsayRoute {
    pathInfo: PathInfo;
    geometry: Geometry;
}

export interface PathInfo {
    info: {
        totalTime: number;
        mapObj?: string;
    };
    subPath: SubPath[];
}

export interface SubPath {
    trafficType: 1 | 2 | 3; // 1: 지하철, 2: 버스, 3: 도보
    sectionTime: number;
    lane?: {
        name?: string;
        busNo?: string;
    }[];
    startName?: string;
    endName?: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface Geometry {
    lane: Lane[];
    boundary: {
        top: number;
        left: number;
        bottom: number;
        right: number;
    };
}

export interface Lane {
    type: 1 | 2;
    section: {
        graphPos: { x: number; y: number }[];
    }[];
}
```

### 📄 파일: `src/types/naver.d.ts`
```ts
// @types/navermaps에 누락된 타입을 보강합니다.
declare namespace naver.maps {
    namespace Service {
        function geocode(
            options: { query: string },
            callback: (status: naver.maps.Service.Status, response: GeocodeResponse) => void
        ): void;

        interface GeocodeResponse {
            v2: {
                addresses: AddressItem[];
            };
        }

        interface AddressItem {
            roadAddress: string;
            jibunAddress: string;
            x: string;
            y: string;
        }
    }
}
```

### 📄 파일: `src/lib/utils.ts`
```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 📄 파일: `src/lib/mockApi.ts`
```ts
import type { Place } from "@/components/RightSidebar";

const mockPlaces: Place[] = [
    { title: "경복궁", addr1: "서울 종로구 사직로 161", firstimage: "", mapy: "37.579617", mapx: "126.977041" },
    { title: "N서울타워", addr1: "서울 용산구 남산공원길 105", firstimage: "", mapy: "37.551169", mapx: "126.988227" },
    { title: "롯데월드", addr1: "서울 송파구 올림픽로 240", firstimage: "", mapy: "37.511115", mapx: "127.098163" },
];

// 백엔드 API 연동 실패 시 임시 데이터를 반환하는 함수
export const fetchMockRecommendations = (contentTypeId: number): Promise<Place[]> => {
    console.log(`Fetching mock recommendations for contentTypeId: ${contentTypeId}...`);
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockPlaces), 500);
    });
};
```

### 📄 파일: `src/app/api/odsay-directions/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { PathInfo } from "@/types/odsay";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sx = searchParams.get("sx");
  const sy = searchParams.get("sy");
  const ex = searchParams.get("ex");
  const ey = searchParams.get("ey");

  if (!sx || !sy || !ex || !ey) {
    return NextResponse.json({ error: "출발지와 목적지 좌표가 모두 필요합니다." }, { status: 400 });
  }

  const ODSAY_API_KEY = process.env.ODSAY_API_KEY;
  if (!ODSAY_API_KEY) {
    return NextResponse.json({ error: "서버에 ODsay API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  const encodedApiKey = encodeURIComponent(ODSAY_API_KEY);

  try {
    const pathSearchUrl = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=${encodedApiKey}`;
    const pathSearchResponse = await fetch(pathSearchUrl);
    if (!pathSearchResponse.ok) throw new Error('Failed to fetch from ODsay path search API');
    
    const pathData = await pathSearchResponse.json();
    if (pathData.error) throw new Error(pathData.error.message);

    const combinedResults = await Promise.all(
      pathData.result.path.map(async (path: PathInfo) => {
        const mapObj = path.info?.mapObj;
        if (!mapObj) return { pathInfo: path, geometry: null };

        const laneUrl = `https://api.odsay.com/v1/api/loadLane?mapObject=0:0@${mapObj}&apiKey=${encodedApiKey}`;
        const laneResponse = await fetch(laneUrl);
        if (!laneResponse.ok) return { pathInfo: path, geometry: null };

        const laneData = await laneResponse.json();
        return { pathInfo: path, geometry: laneData.error ? null : laneData.result };
      })
    );

    return NextResponse.json(combinedResults);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 서버 오류";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
```

### 📄 파일: `src/components/Sidebar.tsx`
```tsx
"use client";

import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormEvent, useState } from "react";

const categories = [
    { id: 12, name: "관광지" }, { id: 14, name: "문화시설" }, { id: 38, name: "쇼핑" }, { id: 39, name: "음식점" },
];

interface SidebarProps {
    query: string;
    setQuery: (query: string) => void;
    setSearchedLocation: (location: naver.maps.LatLng) => void;
    onCategorySelect: (contentTypeId: number) => void;
    selectedCategoryId: number | null;
}

export function Sidebar({ query, setQuery, setSearchedLocation, onCategorySelect, selectedCategoryId }: SidebarProps) {
    const handleSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!query) return;
        naver.maps.Service.geocode({ query }, (status, response) => {
            if (status === naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                const firstResult = response.v2.addresses[0];
                const location = new naver.maps.LatLng(parseFloat(firstResult.y), parseFloat(firstResult.x));
                setSearchedLocation(location);
            } else {
                alert(`'${query}'에 대한 검색 결과가 없습니다.`);
            }
        });
    };

    return (
        <aside className="w-[350px] h-full bg-white border-r border-gray-200 flex flex-col p-4 space-y-4 z-20">
            <h1 className="text-2xl font-bold text-gray-800">지도 검색</h1>
            <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    placeholder="지역, 장소 검색"
                    className="pl-10 h-11"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 h-9">검색</Button>
            </form>

            <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-2">추천 카테고리</h2>
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <Button
                            key={category.id}
                            variant={selectedCategoryId === category.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => onCategorySelect(category.id)}
                            className="rounded-full"
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>
            </div>
        </aside>
    );
}
```

### 📄 파일: `src/components/RightSidebar.tsx`
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Bus, TrainFront, PersonStanding } from "lucide-react";
import { OdsayRoute, SubPath } from "@/types/odsay";
import Image from "next/image";

export interface Place {
    title: string;
    addr1: string;
    firstimage: string;
    mapy: string;
    mapx: string;
}

interface RightSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    places: Place[];
    isLoading: boolean;
    onGetDirections: (place: Place) => void;
    directionsResult: OdsayRoute[];
    isDirectionsLoading: boolean;
    directionsDestination: Place | null;
    originName: string;
    onSelectRoute: (index: number) => void;
    selectedRouteIndex: number;
}

const renderSubPath = (subPath: SubPath, index: number) => {
    const Icon = subPath.trafficType === 1 ? TrainFront : subPath.trafficType === 2 ? Bus : PersonStanding;
    const title = subPath.trafficType === 1 ? `${subPath.lane?.[0]?.name}` : subPath.trafficType === 2 ? `${subPath.lane?.[0]?.busNo}번` : "도보";
    return (
        <div key={index} className="flex items-start space-x-3 p-2">
            <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
            <div className="flex-grow">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-gray-500">{subPath.startName} → {subPath.endName} ({subPath.sectionTime}분)</p>
            </div>
        </div>
    );
};

export function RightSidebar({ isOpen, onClose, places, isLoading, onGetDirections, directionsResult, isDirectionsLoading, directionsDestination, originName, onSelectRoute, selectedRouteIndex }: RightSidebarProps) {
    if (!isOpen) return null;

    const hasDirections = directionsResult.length > 0 && directionsDestination;

    return (
        <aside className="absolute top-0 right-0 w-[380px] h-full bg-white border-l flex flex-col p-4 z-20 shadow-lg">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold">{hasDirections ? "경로 결과" : "추천 장소"}</h1>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-6 h-6" /></Button>
            </div>

            {hasDirections && (
                <h2 className="text-lg font-semibold truncate pb-2 border-b mb-4">{originName} → {directionsDestination?.title}</h2>
            )}

            <div className="flex-grow overflow-y-auto">
                {isDirectionsLoading || isLoading ? <p>데이터를 불러오는 중...</p> :
                    hasDirections ? (
                        <div className="space-y-3">
                            {directionsResult.map((route, index) => (
                                <Card key={index} className="cursor-pointer" onClick={() => onSelectRoute(index)}>
                                    <div className="p-3 font-semibold flex justify-between">
                                        <span>경로 {index + 1}</span>
                                        <span className="text-blue-600">{route.pathInfo.info.totalTime}분 소요</span>
                                    </div>
                                    {selectedRouteIndex === index && (
                                        <div className="border-t p-3 bg-gray-50 space-y-1">
                                            {route.pathInfo.subPath.map(renderSubPath)}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {places.map((place, index) => (
                                <Card key={index} className="p-3 hover:bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        {place.firstimage && <Image src={place.firstimage} alt={place.title} width={64} height={64} className="w-16 h-16 rounded-md bg-gray-100" />}
                                        <div>
                                            <p className="font-semibold">{place.title}</p>
                                            <p className="text-xs text-gray-500">{place.addr1}</p>
                                            <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => onGetDirections(place)}>대중교통 길찾기</Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )
                }
            </div>
        </aside>
    );
}
```

### 📄 파일: `src/components/MapContainer.tsx`
```tsx
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
    const markersRef = useRef<naver.maps.Marker[]>([]);
    const polylinesRef = useRef<naver.maps.Polyline[]>([]);

    // 지도 초기화
    useEffect(() => {
        if (!mapElement.current || !window.naver) return;
        mapRef.current = new naver.maps.Map(mapElement.current, { center: new naver.maps.LatLng(37.5665, 126.9780), zoom: 12 });
    }, []);

    // 모든 마커와 폴리라인을 지우는 함수
    const clearMapObjects = () => {
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];
    };

    // 지도 업데이트 로직
    useEffect(() => {
        if (!mapRef.current) return;
        clearMapObjects();

        const map = mapRef.current;
        const newMarkers: naver.maps.Marker[] = [];
        const bounds = new naver.maps.LatLngBounds();

        if (selectedRoute && searchedLocation && directionsDestination) {
            // 경로 결과 표시
            const startLatLng = searchedLocation;
            const endLatLng = new naver.maps.LatLng(parseFloat(directionsDestination.mapy), parseFloat(directionsDestination.mapx));

            newMarkers.push(new naver.maps.Marker({ position: startLatLng, map, icon: { content: createMarkerHtml('S', '#1B75D9') } }));
            newMarkers.push(new naver.maps.Marker({ position: endLatLng, map, icon: { content: createMarkerHtml('D', '#D92D2D') } }));
            bounds.extend(startLatLng);
            bounds.extend(endLatLng);

            selectedRoute.geometry?.lane.forEach(lane => {
                const path = lane.section.flatMap(sec => sec.graphPos.map(p => new naver.maps.LatLng(p.y, p.x)));
                const polyline = new naver.maps.Polyline({ map, path, strokeColor: '#2E64FE', strokeWeight: 8 });
                polylinesRef.current.push(polyline);
            });
            map.fitBounds(bounds, { top: 100, right: 400, bottom: 100, left: 400 });

        } else if (recommendedPlaces.length > 0 && searchedLocation) {
            // 추천 장소 표시
            newMarkers.push(new naver.maps.Marker({ position: searchedLocation, map, icon: { content: createMarkerHtml('', 'red') } }));
            bounds.extend(searchedLocation);

            recommendedPlaces.forEach(place => {
                const location = new naver.maps.LatLng(parseFloat(place.mapy), parseFloat(place.mapx));
                newMarkers.push(new naver.maps.Marker({ position: location, map }));
                bounds.extend(location);
            });
            map.fitBounds(bounds, { top: 100, right: 400, bottom: 100, left: 400 });

        } else if (searchedLocation) {
            // 검색 위치만 표시
            newMarkers.push(new naver.maps.Marker({ position: searchedLocation, map, icon: { content: createMarkerHtml('', 'red') } }));
            map.setCenter(searchedLocation);
            map.setZoom(12);
        }
        markersRef.current = newMarkers;

    }, [searchedLocation, recommendedPlaces, selectedRoute, directionsDestination]);

    const createMarkerHtml = (text: string, color: string) => 
        `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${text}</div>`;

    return <section ref={mapElement} className="flex-1 h-full" />;
}
```

### 📄 파일: `src/app/page.tsx` (최종 조립)
```tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";
import { RightSidebar, Place } from "@/components/RightSidebar";
import { fetchMockRecommendations } from "@/lib/mockApi";
import { OdsayRoute } from "@/types/odsay";

export default function Home() {
  const [searchedLocation, setSearchedLocation] = useState<naver.maps.LatLng | null>(null);
  const [query, setQuery] = useState("서울역");
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [directionsDestination, setDirectionsDestination] = useState<Place | null>(null);
  const [isDirectionsLoading, setIsDirectionsLoading] = useState(false);
  const [directionsResult, setDirectionsResult] = useState<OdsayRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const resetState = () => {
    setRecommendedPlaces([]);
    setDirectionsDestination(null);
    setDirectionsResult([]);
    setSelectedRouteIndex(0);
  };

  const handleCategorySelect = async (contentTypeId: number) => {
    if (!searchedLocation) {
      alert("먼저 지역을 검색해주세요.");
      return;
    }
    if (selectedCategoryId === contentTypeId && isRightSidebarOpen) {
      setIsRightSidebarOpen(false);
      setSelectedCategoryId(null);
      resetState();
      return;
    }
    
    resetState();
    setIsLoading(true);
    setIsRightSidebarOpen(true);
    setSelectedCategoryId(contentTypeId);

    try {
      // 실제 API 호출 로직. /api/recommendations?lat=...&lon=...&type=...
      // 여기서는 목업 API를 사용합니다.
      const places = await fetchMockRecommendations(contentTypeId);
      setRecommendedPlaces(places);
    } catch (e) {
      alert("추천 장소를 가져오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetDirections = async (place: Place) => {
    if (!searchedLocation) return;
    
    resetState();
    setDirectionsDestination(place);
    setIsDirectionsLoading(true);
    setIsRightSidebarOpen(true);

    try {
      const url = `/api/odsay-directions?sx=${searchedLocation.x}&sy=${searchedLocation.y}&ex=${place.mapx}&ey=${place.mapy}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("경로 데이터를 가져오는 데 실패했습니다.");
      
      const data: OdsayRoute[] = await response.json();
      data.sort((a, b) => a.pathInfo.info.totalTime - b.pathInfo.info.totalTime);
      setDirectionsResult(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
      resetState();
    } finally {
      setIsDirectionsLoading(false);
    }
  };

  return (
      <main className="relative flex h-screen w-screen">
        <Sidebar
            query={query}
            setQuery={setQuery}
            setSearchedLocation={setSearchedLocation}
            onCategorySelect={handleCategorySelect}
            selectedCategoryId={selectedCategoryId}
        />
        <MapContainer
            searchedLocation={searchedLocation}
            recommendedPlaces={recommendedPlaces}
            selectedRoute={directionsResult?.[selectedRouteIndex]}
            directionsDestination={directionsDestination}
        />
        <RightSidebar
            isOpen={isRightSidebarOpen}
            onClose={() => { setIsRightSidebarOpen(false); setSelectedCategoryId(null); resetState(); }}
            places={recommendedPlaces}
            isLoading={isLoading}
            onGetDirections={handleGetDirections}
            directionsResult={directionsResult}
            isDirectionsLoading={isDirectionsLoading}
            originName={query}
            directionsDestination={directionsDestination}
            onSelectRoute={setSelectedRouteIndex}
            selectedRouteIndex={selectedRouteIndex}
        />
      </main>
  );
}
```

---

## 3단계: 실행

모든 파일을 올바르게 생성하고 코드를 붙여넣었다면, 개발 서버를 실행하여 결과를 확인하세요.

```bash
npm run dev
```
