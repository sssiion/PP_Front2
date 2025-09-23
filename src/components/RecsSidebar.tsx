"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image"; // 닫기 아이콘
import { X, ImageOff, MapPin } from "lucide-react";
import { Spot } from "@/app/page";
import {OdsayRoute} from "@/types/odsay";

interface RecsSidebarProps {
    onClose: () => void;
    places: Spot[]; // 2. any[] 대신 정확한 Spot[] 타입 사용
    isLoading: boolean; // 3. 로딩 상태를 받을 prop 추가
    onRouteSearch: (destination: Spot) => void; // ✨ 1. 부모로부터 받을 함수 타입 추가
    routeInfo: OdsayRoute | null; // ✨ 2. 경로 결과 데이터 타입 추가
    destinationInfo: Spot | null; // ✨ 3. 목적지 정보 타입 추가
}

// 서버에서 받아오는 데이터의 타입(모양)을 정의합니다.

export function RecsSidebar({ onClose, places, isLoading, onRouteSearch, routeInfo, destinationInfo }: RecsSidebarProps)
{
    if (routeInfo && destinationInfo) {
        return (
            <aside className="absolute top-0 right-0 w-[400px] h-full bg-white shadow-lg z-20 p-4 flex flex-col">
                <h2 className="text-xl font-bold mb-2">&#34;{destinationInfo.title}&#34; 경로 안내</h2>
                <p className="text-gray-600 mb-4">
                    {/*예상 소요 시간: {routeInfo.pathInfo.info.totalTime}분*/}
                </p>
                {/* 여기에 routeInfo를 사용하여 상세 경로 렌더링 */}
                {/* 예: {routeInfo.subPath.map(...)} */}
                <div className="border p-2 mt-auto">
                    상세 경로 정보가 여기에 표시됩니다.
                </div>
                <button onClick={() => window.location.reload()} className="mt-4 bg-gray-200 p-2 rounded">
                    새로운 검색
                </button>
            </aside>
        );
    }

    return (
        <aside className="absolute top-0 right-0 w-[400px] h-full bg-white shadow-2xl z-20 p-6 flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">추천 관광지 목록</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* 4. 로딩 및 결과 표시에 대한 UI 로직 수정 */}
            <div className="flex-1 overflow-y-auto -mr-6 pr-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 animate-pulse">목록을 불러오는 중...</p>
                    </div>
                ) : places.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">추천 장소가 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {places.map((spot) => (
                            <Card key={spot.contentId} className="flex p-3 gap-4 hover:shadow-md hover:border-blue-300 transition-all border-2 border-transparent">
                                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                                    {spot.firstImage ? (
                                        <Image
                                            src={spot.firstImage}
                                            alt={spot.title}
                                            width={96}
                                            height={96}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <ImageOff className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <p className="font-bold text-md text-gray-800 truncate">{spot.title}</p>
                                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                                        <MapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                        <span className="truncate">{spot.addr1}</span>
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-sm text-blue-600 font-semibold">
                                            {`약 ${(spot.distanceMeters / 1000).toFixed(1)}km`}
                                        </p>
                                        {/* 👇👇👇 [추가] 바로 이 '출발' 버튼입니다! 👇👇👇 */}
                                        <Button
                                            size="sm"
                                            className="h-8"
                                            onClick={() => onRouteSearch(spot)}
                                        >
                                            출발
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}