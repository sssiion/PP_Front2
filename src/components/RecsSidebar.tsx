"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { X, ImageOff, MapPin } from "lucide-react"; // 닫기 아이콘

interface RecsSidebarProps {
    onClose: () => void;
    places: any[];// 닫기 함수를 props로 받음
}

// 서버에서 받아오는 데이터의 타입(모양)을 정의합니다.

export function RecsSidebar({ onClose, places }: RecsSidebarProps) {
    return (
        <aside className="absolute top-0 right-0 w-[400px] h-full bg-white shadow-2xl z-20 p-6 flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">추천 관광지 목록</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto -mr-6 pr-6">
                {places.length === 0 ? (
                    <p>추천 장소가 없습니다.</p>
                ) : (
                    <div className="space-y-3">
                        {places.map((spot) => (
                            <Card key={spot.contentId} className="flex p-3 gap-4 hover:shadow-md hover:border-blue-300 transition-all border-2 border-transparent cursor-pointer">
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
                                    <p className="text-sm text-blue-600 font-semibold mt-2">
                                        {`약 ${(spot.distanceMeters / 1000).toFixed(1)}km`}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}