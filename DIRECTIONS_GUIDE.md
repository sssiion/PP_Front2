# 지도 및 경로 탐색 기능 컴포넌트 사용 설명서

이 문서는 현재 프로젝트에 구현된 지도, 장소 검색, 경로 탐색 기능을 다른 Next.js 프로젝트에서 쉽게 재사용할 수 있도록 각 컴포넌트의 코드와 사용 방법을 상세히 설명합니다.

## 목차
1. [기능 개요](#1-기능-개요)
2. [사전 준비사항](#2-사전-준비사항)
3. [설치 및 설정](#3-설치-및-설정)
4. [컴포넌트 및 API 코드](#4-컴포넌트-및-api-코드)
    - [4.1 타입 정의: `types/odsay.d.ts` & `types/naver.d.ts`](#41-타입-정의-typesodsaydts--typesnaverdts)
    - [4.2 백엔드 API: `app/api/odsay-directions/route.ts`](#42-백엔드-api-appapiodsay-directionsroutets)
    - [4.3 장소 검색 사이드바: `components/Sidebar.tsx`](#43-장소-검색-사이드바-componentssidebartsx)
    - [4.4 경로 결과 사이드바: `components/RightSidebar.tsx`](#44-경로-결과-사이드바-componentsrightsidebartsx)
    - [4.5 지도 컨테이너: `components/MapContainer.tsx`](#45-지도-컨테이너-componentsmapcontainertsx)
    - [4.6 전체 통합 페이지: `app/page.tsx`](#46-전체-통합-페이지-apppagetsx)
5. [사용 방법 요약](#5-사용-방법-요약)

---

## 1. 기능 개요
이 기능 모음은 다음과 같은 사용자 경험을 제공합니다.
- **장소 검색**: 좌측 사이드바에서 특정 지역이나 장소를 검색합니다.
- **추천 장소**: 검색된 위치 주변의 카테고리별(예: 관광지, 음식점) 장소를 우측 사이드바에 표시합니다.
- **대중교통 길찾기**: 추천 장소 목록에서 길찾기 버튼을 누르면, 검색된 출발지로부터 해당 장소까지의 대중교통 경로를 ODSay API를 통해 탐색합니다.
- **경로 시각화**: 탐색된 경로의 결과를 우측 사이드바에 목록으로 표시하고, 선택된 경로를 지도 위에 폴리라인과 출발(S)/도착(D) 마커로 시각화합니다.

## 2. 사전 준비사항
- **Node.js**: 최신 LTS 버전 사용을 권장합니다.
- **Next.js 프로젝트**: 이 컴포넌트들은 Next.js 13+ (App Router) 환경에 최적화되어 있습니다.
- **네이버 지도 API 키**: [NAVER Cloud Platform](https://www.ncloud.com/)에서 애플리케이션을 등록하고 **Client ID**를 발급받아야 합니다.
- **ODSay API 키**: [ODSay](https://www.odsay.com/)에서 대중교통 길찾기 API 사용을 위한 키를 발급받아야 합니다.

## 3. 설치 및 설정

### 3.1. 의존성 설치
프로젝트에 필요한 라이브러리를 설치합니다. 이 가이드에서는 `lucide-react` (아이콘)와 `tailwindcss` (스타일링)를 사용했습니다.
```bash
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
# shadcn/ui를 사용했다면 관련 의존성도 추가로 설치해야 합니다.
```

### 3.2. 네이버 지도 스크립트 추가
네이버 지도를 사용하기 위해 `app/layout.tsx` 파일의 `<head>` 안에 스크립트 태그를 추가해야 합니다.

`YOUR_NAVER_MAPS_CLIENT_ID` 부분을 발급받은 네이버 지도 Client ID로 교체하세요.
```tsx
// app/layout.tsx
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

### 3.3. ODSay API 키 설정
프로젝트 루트 디렉터리에 `.env.local` 파일을 생성하고, 발급받은 ODSay API 키를 다음과 같이 추가합니다.
```
# .env.local
ODSAY_API_KEY=YOUR_ODSAY_API_KEY
```
Next.js는 이 파일을 자동으로 인식하여 서버 사이드 환경 변수로 키를 주입합니다.

---

## 4. 컴포넌트 및 API 코드

### 4.1. 타입 정의: `types/odsay.d.ts` & `types/naver.d.ts`
API 응답과 네이버 지도 객체의 타입을 정의하여 코드 안정성을 높입니다.

#### `types/odsay.d.ts`
```typescript
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
    startID?: number;
    endID?: number;
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
        startID?: number;
        endID?: number;
    }[];
}
```

#### `types/naver.d.ts`
```typescript
// 이 파일은 @types/navermaps에 누락된 타입을 보강합니다.
declare namespace naver.maps {
    namespace Service {
        function search(
            options: {
                query: string;
                count?: number;
            },
            callback: (status: naver.maps.Service.Status, response: any) => void
        ): void;
    }
}
```

### 4.2. 백엔드 API: `app/api/odsay-directions/route.ts`
ODSay API를 호출하여 경로 정보를 가져오는 서버리스 함수입니다.

```typescript
// app/api/odsay-directions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PathInfo } from "@/types/odsay";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sx = searchParams.get("sx"); // Start X (Longitude)
  const sy = searchParams.get("sy"); // Start Y (Latitude)
  const ex = searchParams.get("ex"); // End X (Longitude)
  const ey = searchParams.get("ey"); // End Y (Latitude)

  if (!sx || !sy || !ex || !ey) {
    return NextResponse.json(
      { error: "출발지와 목적지 좌표(sx, sy, ex, ey)가 모두 필요합니다." },
      { status: 400 }
    );
  }

  const ODSAY_API_KEY = process.env.ODSAY_API_KEY;

  if (!ODSAY_API_KEY) {
    console.error("ODsay API 키가 설정되지 않았습니다.");
    return NextResponse.json(
        { error: "서버 설정 오류: API 키가 없습니다." },
        { status: 500 }
    );
  }

  const encodedApiKey = encodeURIComponent(ODSAY_API_KEY);

  try {
    const pathSearchUrl = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&apiKey=${encodedApiKey}`;
    const pathSearchResponse = await fetch(pathSearchUrl);

    if (!pathSearchResponse.ok) {
      const errorText = await pathSearchResponse.text();
      return NextResponse.json(
        { error: "ODsay 경로 검색 API 호출에 실패했습니다.", details: errorText },
        { status: pathSearchResponse.status }
      );
    }

    const pathData = await pathSearchResponse.json();

    if (pathData.error) {
      return NextResponse.json(
        { error: `ODsay 경로 검색 API 오류: ${pathData.error.message}` },
        { status: 400 }
      );
    }

    const combinedResults = await Promise.all(
      pathData.result.path.map(async (path: PathInfo) => {
        const mapObj = path.info?.mapObj;
        if (!mapObj) {
          return { pathInfo: path, geometry: null };
        }

        const laneUrl = `https://api.odsay.com/v1/api/loadLane?mapObject=0:0@${mapObj}&apiKey=${encodedApiKey}`;
        const laneResponse = await fetch(laneUrl);
        if (!laneResponse.ok) {
          return { pathInfo: path, geometry: null };
        }
        const laneData = await laneResponse.json();
        if (laneData.error) {
          return { pathInfo: path, geometry: null };
        }
        return { pathInfo: path, geometry: laneData.result };
      })
    );

    return NextResponse.json(combinedResults);

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
```

### 4.3. 장소 검색 사이드바: `components/Sidebar.tsx`
- **역할**: 장소 검색창, 카테고리 선택, 최근 검색 기록을 관리합니다.
- **주요 로직**:
    - `performSearch`: 네이버 지도 `geocode` 서비스를 호출하여 검색어에 해당하는 좌표를 찾습니다.
    - `onCategorySelect`: 부모 컴포넌트(`page.tsx`)에 선택된 카테고리 ID를 전달합니다.

```typescript
// components/Sidebar.tsx
"use client";

import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormEvent, useRef, useState } from "react";

// ... (NaverAddressItem, categories 등 인터페이스 및 상수 정의) ...

interface SidebarProps {
    query: string;
    setQuery: (query: string) => void;
    setSearchedLocation: (location: naver.maps.LatLng) => void;
    onCategorySelect: (contentTypeId: number, locationOverride?: naver.maps.LatLng) => void;
    selectedCategoryId: number | null;
}

export function Sidebar({ query, setQuery, setSearchedLocation, onCategorySelect, selectedCategoryId }: SidebarProps) {
    // ... (내부 상태 및 핸들러 함수들) ...
    // 전체 코드는 프로젝트의 실제 파일을 참고하세요.
    return (
        <aside className="w-[350px] h-full bg-white border-r border-gray-200 flex flex-col p-4 space-y-4">
            {/* ... JSX ... */}
        </aside>
    );
}
```
*전체 코드는 프로젝트의 `src/components/Sidebar.tsx` 파일을 참고하세요.*

### 4.4. 경로 결과 사이드바: `components/RightSidebar.tsx`
- **역할**: 추천 장소 목록 또는 대중교통 경로 검색 결과를 표시합니다.
- **주요 로직**:
    - `onGetDirections`: "길찾기" 버튼 클릭 시 부모(`page.tsx`)에 길찾기 요청을 보냅니다.
    - `onSelectRoute`: 여러 경로 결과 중 하나를 선택했을 때, 해당 경로의 인덱스를 부모에게 알립니다.

```typescript
// components/RightSidebar.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Bus, TrainFront, PersonStanding } from "lucide-react";
import { OdsayRoute, SubPath } from "@/types/odsay";
import Image from "next/image";

export interface Place {
    title: string;
    addr1: string;
    firstimage: string;
    mapy: string; // 위도
    mapx: string; // 경도
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

export function RightSidebar({ ...props }: RightSidebarProps) {
    // ... (내부 렌더링 로직) ...
    // 전체 코드는 프로젝트의 실제 파일을 참고하세요.
    return (
        <aside className="absolute top-0 right-0 w-[380px] h-full bg-white ...">
            {/* ... JSX ... */}
        </aside>
    );
}
```
*전체 코드는 프로젝트의 `src/components/RightSidebar.tsx` 파일을 참고하세요.*

### 4.5. 지도 컨테이너: `components/MapContainer.tsx`
- **역할**: 네이버 지도를 렌더링하고, 검색 위치, 추천 장소, 경로 폴리라인 등을 시각화합니다.
- **주요 로직**:
    - `useEffect` 훅을 사용하여 `searchedLocation`, `recommendedPlaces`, `selectedRoute` 등 부모로부터 받은 `prop`의 변화에 따라 마커와 폴리라인을 동적으로 업데이트합니다.
    - `isValidLatLng`: ODSay API가 간혹 유효하지 않은 좌표를 반환하는 경우를 대비하여, 경로를 그리기 전에 좌표를 검증하는 방어 로직을 포함합니다.

```typescript
// components/MapContainer.tsx
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

export function MapContainer({ ...props }: MapContainerProps) {
    // ... (지도 초기화, 마커/폴리라인 렌더링 로직) ...
    // 전체 코드는 프로젝트의 실제 파일을 참고하세요.
    return (
        <section className="flex-1 h-full relative">
            <div ref={mapElement} className="w-full h-full" />
            {/* ... JSX ... */}
        </section>
    );
}
```
*전체 코드는 프로젝트의 `src/components/MapContainer.tsx` 파일을 참고하세요.*

### 4.6. 전체 통합 페이지: `app/page.tsx`
- **역할**: 모든 컴포넌트를 조합하고, 애플리케이션의 핵심 상태(검색 위치, 경로 결과 등)를 관리하는 최상위 컨트롤러 역할을 합니다.
- **주요 로직**:
    - `useState`를 사용하여 모든 상태를 관리합니다.
    - `handleGetDirections`, `handleCategorySelect` 등의 핸들러 함수를 통해 자식 컴포넌트(사이드바)로부터 이벤트를 받아 상태를 업데이트하고, 다른 자식 컴포넌트(지도)에 `prop`으로 전달합니다.

```typescript
// app/page.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";
import { RightSidebar, Place } from "@/components/RightSidebar";
import { OdsayRoute } from "@/types/odsay";

export default function Home() {
  const [searchedLocation, setSearchedLocation] = useState<naver.maps.LatLng | null>(null);
  const [query, setQuery] = useState("");
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [directionsDestination, setDirectionsDestination] = useState<Place | null>(null);
  const [isDirectionsLoading, setIsDirectionsLoading] = useState(false);
  const [directionsResult, setDirectionsResult] = useState<OdsayRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // ... (핸들러 함수들: handleGetDirections, handleSelectRoute, handleCategorySelect) ...

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
            onClose={() => { /* ... */ }}
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

## 5. 사용 방법 요약
1.  새로운 Next.js 프로젝트를 생성하고, 위의 [사전 준비사항](#2-사전-준비사항)과 [설치 및 설정](#3-설치-및-설정)을 완료합니다.
2.  `types`, `components`, `app/api` 디렉터리 구조를 생성하고, 위에 제공된 코드 파일들을 각각의 위치에 복사하여 붙여넣습니다.
3.  `app/page.tsx` 파일을 위 코드처럼 구성하여 각 컴포넌트를 불러오고 상태와 핸들러 함수를 연결합니다.
4.  `npm run dev`로 개발 서버를 실행하여 기능이 올바르게 동작하는지 확인합니다.

이 가이드를 통해 다른 프로젝트에서도 지도 및 경로 탐색 기능을 성공적으로 적용할 수 있기를 바랍니다.
