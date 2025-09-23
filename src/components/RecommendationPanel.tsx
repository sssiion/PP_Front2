"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { MapPin, ImageOff } from "lucide-react"; // 이미지가 없을 때를 위한 아이콘

// 서버에서 받아오는 데이터의 타입(모양)을 정의합니다.
interface Spot {
    contentId: string;
    title: string;
    addr1: string;
    firstImage: string;
    distanceMeters: number;
}

export function RecommendationPanel() {
    const [spots, setSpots] = useState<Spot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 서버에서 데이터를 가져오는 함수
        const fetchRecommendedSpots = async () => {
            try {
                setLoading(true);
                // 사용자님이 제공해주신 URL (실제로는 동적으로 위도, 경도 등을 받아와야 합니다)
                const apiUrl = "http://localhost:8080/api/recommend/list3?lat=37.5557&lon=126.9730&time=13:30:00";

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error('서버에서 데이터를 가져오는 데 실패했습니다.');
                }
                const data: Spot[] = await response.json();

                // 거리순으로 데이터를 정렬합니다.
                data.sort((a, b) => a.distanceMeters - b.distanceMeters);

                setSpots(data);
            } catch (err) {
                setError("데이터를 불러올 수 없습니다.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendedSpots();
    }, []); // 컴포넌트가 처음 로드될 때 한 번만 실행합니다.

    // 로딩 중일 때 보여줄 화면
    if (loading) {
        return <div className="p-4 text-center text-gray-500">추천 목록을 불러오는 중...</div>;
    }

    // 에러 발생 시 보여줄 화면
    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-4 border-t border-gray-200 h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex-shrink-0">추천 관광지 목록</h2>

            {/* 검색 결과가 없을 때 보여줄 화면 */}
            {spots.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
            ) : (
                // 스크롤 가능한 목록 영역
                <div className="flex-1 overflow-y-auto space-y-3">
                    {spots.map((spot) => (
                        <Card key={spot.contentId} className="flex p-3 gap-4 hover:shadow-md hover:border-blue-300 transition-all border-2 border-transparent cursor-pointer">
                            {/* 이미지 영역 */}
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

                            {/* 정보 영역 */}
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
    );
}