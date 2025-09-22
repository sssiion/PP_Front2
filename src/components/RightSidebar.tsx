"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

// API 응답으로 받을 장소 데이터의 타입을 정의합니다.
export interface Place {
    title: string;
    addr1: string;
    firstimage: string;
    mapy: string; // 위도
    mapx: string; // 경도
    // 필요한 다른 데이터 필드들을 여기에 추가할 수 있습니다.
}

interface RightSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    places: Place[];
    isLoading: boolean;
}

export function RightSidebar({ isOpen, onClose, places, isLoading }: RightSidebarProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <aside className="absolute top-0 right-0 w-[380px] h-full bg-white border-l border-gray-200 flex flex-col p-4 space-y-4 z-10 shadow-lg">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">추천 장소</h1>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {isLoading ? (
                <div className="flex-grow flex items-center justify-center">
                    <p>데이터를 불러오는 중입니다...</p>
                </div>
            ) : (
                <div className="border-t border-gray-200 flex-grow pt-4 overflow-y-auto">
                    {places.length === 0 ? (
                        <p>추천 장소가 없습니다.</p>
                    ) : (
                        <div className="space-y-3">
                            {places.map((place, index) => (
                                <Card key={index} className="p-3 hover:bg-gray-50 cursor-pointer">
                                    <div className="flex items-center space-x-3">
                                        {place.firstimage && (
                                            <img src={place.firstimage} alt={place.title} className="w-16 h-16 rounded-md object-cover bg-gray-100" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-800">{place.title}</p>
                                            <p className="text-xs text-gray-500">{place.addr1}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
}
