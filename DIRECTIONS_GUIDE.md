# 프로젝트 아키텍처 및 컴포넌트 재사용 가이드

이 문서는 현재 프로젝트의 아키텍처를 설명하고, 구현된 지도 및 경로 탐색 관련 컴포넌트를 다른 Next.js 프로젝트에서 쉽게 재사용할 수 있도록 상세한 가이드를 제공합니다.

## 목차
1. [프로젝트 아키텍처](#1-프로젝트-아키텍처)
    - [1.1. 기본 설계 사상](#11-기본-설계-사상)
    - [1.2. 데이터 흐름](#12-데이터-흐름)
2. [사전 준비사항](#2-사전-준비사항)
3. [설치 및 설정](#3-설치-및-설정)
4. [핵심 파일 역할](#4-핵심-파일-역할)
5. [컴포넌트 재사용 가이드](#5-컴포넌트-재사용-가이드)
    - [5.1. `Sidebar`](#51-sidebar)
    - [5.2. `MapContainer`](#52-mapcontainer)
    - [5.3. `RightSidebar`](#53-rightsidebar)
    - [5.4. `page.tsx` (통합 예시)](#54-pagetsx-통합-예시)
6. [API 라우트](#6-api-라우트)
    - [6.1. ODSay 경로 탐색](#61-odsay-경로-탐색)

---

## 1. 프로젝트 아키텍처

### 1.1. 기본 설계 사상
이 프로젝트는 **컨테이너/프레젠테이션(Container/Presentational) 패턴**을 따릅니다.

- **컨테이너 컴포넌트 (`app/page.tsx`)**:
    - 모든 애플리케이션의 상태(State)와 비즈니스 로직을 관리합니다.
    - API 호출, 상태 변경과 같은 "어떻게 동작하는가"에 집중합니다.
    - 다른 하위 컴포넌트들에게 필요한 데이터와 콜백 함수를 `props`로 전달합니다.

- **프레젠테이셔널 컴포넌트 (`components/*`)**:
    - 데이터를 `props`로 받아 화면에 어떻게 보일지에만 집중합니다.
    - `Sidebar`, `MapContainer`, `RightSidebar` 등이 여기에 해당합니다.
    - 독립적으로 존재하며, 상태를 직접 소유하지 않아 재사용이 용이합니다.

이 구조 덕분에 각 컴포넌트의 책임이 명확해지고, UI와 로직이 분리되어 유지보수와 테스트가 쉬워집니다.

### 1.2. 데이터 흐름
사용자 인터랙션에 따른 데이터 흐름은 다음과 같습니다.

```
1. 사용자: (in Sidebar) "서울역" 검색
   -> Sidebar: 검색어(query) 상태 변경
   -> naver.maps.Service.geocode 호출
   -> page.tsx: setSearchedLocation(좌표) 호출

2. page.tsx: `searchedLocation` 상태 변경
   -> MapContainer: 변경된 `searchedLocation` prop을 받아 지도 이동 및 마커 표시

3. 사용자: (in Sidebar) "관광지" 카테고리 버튼 클릭
   -> Sidebar: onCategorySelect(12) 호출
   -> page.tsx: handleCategorySelect(12) 실행
      - API 호출하여 추천 장소 목록 가져오기
      - setRecommendedPlaces(장소_배열) 호출
      - setIsRightSidebarOpen(true) 호출

4. page.tsx: `recommendedPlaces`와 `isRightSidebarOpen` 상태 변경
   -> RightSidebar: 장소 목록을 받아 화면에 렌더링
   -> MapContainer: 추천 장소 마커들을 지도에 표시

5. 사용자: (in RightSidebar) 특정 장소의 "길찾기" 버튼 클릭
   -> RightSidebar: onGetDirections(장소_정보) 호출
   -> page.tsx: handleGetDirections(장소_정보) 실행
      - /api/odsay-directions API 호출
      - setDirectionsResult(경로_배열) 호출

6. page.tsx: `directionsResult` 상태 변경
   -> MapContainer: `selectedRoute` prop을 받아 경로 폴리라인과 S/D 마커 표시
   -> RightSidebar: 경로 목록을 받아 화면에 렌더링
```

## 2. 사전 준비사항
- **Node.js**: 최신 LTS 버전
- **Next.js 프로젝트**: App Router 기반
- **API 키**:
    - **네이버 지도 Client ID**: [NAVER Cloud Platform](https://www.ncloud.com/)에서 발급
    - **ODSay API 키**: [ODSay](https://www.odsay.com/)에서 발급

## 3. 설치 및 설정

### 3.1. 의존성 설치
```bash
# 아이콘 및 UI 컴포넌트 (프로젝트에 맞게 수정)
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
```

### 3.2. 네이버 지도 스크립트 추가
`app/layout.tsx`의 `<head>` 안에 스크립트를 추가합니다. `YOUR_NAVER_MAPS_CLIENT_ID`를 실제 키로 교체하세요.
```tsx
// app/layout.tsx
import Script from 'next/script';

<head>
  <Script
    strategy="beforeInteractive"
    src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_NAVER_MAPS_CLIENT_ID&submodules=geocoder,drawing`}
  />
</head>
```

### 3.3. ODSay API 키 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 키를 추가합니다.
```
# .env.local
ODSAY_API_KEY=YOUR_ODSAY_API_KEY
```

## 4. 핵심 파일 역할

- **`app/page.tsx`**: **컨테이너**. 모든 상태와 로직의 총괄자.
- **`components/Sidebar.tsx`**: **프레젠테이셔널**. 장소 검색, 카테고리 선택 UI 및 사용자 입력 처리.
- **`components/RightSidebar.tsx`**: **프레젠테이셔널**. 추천 장소 및 경로 결과 목록 표시.
- **`components/MapContainer.tsx`**: **프레젠테이셔널**. 지도, 마커, 폴리라인 등 모든 시각적 요소를 렌더링.
- **`app/api/odsay-directions/route.ts`**: **백엔드 API**. ODSay API를 호출하여 경로 정보를 가공 후 반환. (클라이언트 측 키 노출 방지)
- **`types/*.d.ts`**: API 응답 등 프로젝트 전반에서 사용되는 타입 정의.
- **`lib/mockApi.ts`**: 백엔드 API 개발 전 또는 장애 시 사용할 임시 데이터 제공 함수.
- **`lib/utils.ts`**: `cn` 함수 등 프로젝트 전반에서 사용되는 유틸리티 함수 모음.

## 5. 컴포넌트 재사용 가이드

다른 프로젝트에서 이 기능들을 사용하려면, `components`, `types`, `lib` 폴더와 `app/api`를 복사한 후, 아래와 같이 `page.tsx`에서 조합하여 사용하면 됩니다.

### 5.1. `Sidebar`
**역할**: 장소 검색 및 카테고리 선택 UI.
**필수 Props**:
- `query`: `string` - 검색창의 현재 입력값.
- `setQuery`: `(q: string) => void` - 검색창 입력값이 변경될 때 호출될 함수.
- `setSearchedLocation`: `(loc: naver.maps.LatLng) => void` - 장소 검색 성공 시 호출될 함수.
- `onCategorySelect`: `(id: number) => void` - 카테고리 버튼 클릭 시 호출될 함수.
- `selectedCategoryId`: `number | null` - 현재 선택된 카테고리 ID (UI 강조 표시용).

### 5.2. `MapContainer`
**역할**: 지도 및 시각 요소 렌더링.
**필수 Props**:
- `searchedLocation`: `naver.maps.LatLng | null` - 검색된 출발지 좌표.
- `recommendedPlaces`: `Place[]` - 지도에 표시할 추천 장소 목록.
- `selectedRoute`: `OdsayRoute | null` - 지도에 그릴 단일 경로 데이터.
- `directionsDestination`: `Place | null` - 경로의 최종 목적지 정보 (S/D 마커 표시용).

### 5.3. `RightSidebar`
**역할**: 추천 장소 목록 또는 경로 결과 표시.
**필수 Props**:
- `isOpen`: `boolean` - 사이드바 표시 여부.
- `onClose`: `() => void` - 닫기 버튼 클릭 시 호출될 함수.
- `places`: `Place[]` - 표시할 추천 장소 목록.
- `isLoading`: `boolean` - 추천 장소 로딩 상태.
- `onGetDirections`: `(place: Place) => void` - "길찾기" 버튼 클릭 시 호출될 함수.
- `directionsResult`: `OdsayRoute[]` - 표시할 경로 결과 목록.
- `isDirectionsLoading`: `boolean` - 경로 검색 로딩 상태.
- `directionsDestination`: `Place | null` - 경로 목적지 정보 (UI 표시용).
- `originName`: `string` - 출발지 이름 (UI 표시용).
- `onSelectRoute`: `(index: number) => void` - 여러 경로 중 하나를 선택했을 때 호출될 함수.
- `selectedRouteIndex`: `number` - 현재 선택된 경로의 인덱스.

### 5.4. `page.tsx` (통합 예시)
아래와 같이 `useState`로 상태를 정의하고, 각 컴포넌트에 `props`로 내려주면 됩니다.

```tsx
// app/page.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";
import { RightSidebar, Place } from "@/components/RightSidebar";
import { OdsayRoute } from "@/types/odsay";

export default function Home() {
  // 1. 모든 상태를 이곳에서 관리
  const [searchedLocation, setSearchedLocation] = useState<naver.maps.LatLng | null>(null);
  const [query, setQuery] = useState("");
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [directionsResult, setDirectionsResult] = useState<OdsayRoute[]>([]);
  // ... 기타 상태들

  // 2. 자식 컴포넌트에서 호출할 핸들러 함수들 정의
  const handleCategorySelect = async (categoryId: number) => { /* ... API 호출 및 상태 업데이트 ... */ };
  const handleGetDirections = async (place: Place) => { /* ... API 호출 및 상태 업데이트 ... */ };

  // 3. 상태와 핸들러를 props로 전달
  return (
      <main className="relative flex h-screen w-screen">
        <Sidebar
            query={query}
            setQuery={setQuery}
            setSearchedLocation={setSearchedLocation}
            onCategorySelect={handleCategorySelect}
            // ...
        />
        <MapContainer
            searchedLocation={searchedLocation}
            recommendedPlaces={recommendedPlaces}
            selectedRoute={directionsResult?.[selectedRouteIndex]}
            // ...
        />
        <RightSidebar
            // ...
        />
      </main>
  );
}
```

## 6. API 라우트

### 6.1. ODSay 경로 탐색
- **경로**: `/api/odsay-directions`
- **메서드**: `GET`
- **쿼리 파라미터**:
    - `sx`: 출발지 경도 (Longitude)
    - `sy`: 출발지 위도 (Latitude)
    - `ex`: 도착지 경도
    - `ey`: 도착지 위도
- **설명**: 서버 측에서 ODSay API를 안전하게 호출하고, 경로 기본 정보(`searchPubTransPathT`)와 상세 그래픽 정보(`loadLane`)를 조합하여 클라이언트에 반환합니다.