"use client";

import {useState, useEffect} from "react";
import {Search, MapPin} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";

interface SearchResult {
    id: string;
    place_name: string;
    road_address_name: string;
    distance: string; // 거리 정보
}

interface SidebarProps {
    onLocationSelect?: (value: any) => void
}

export function Sidebar({onLocationSelect}: SidebarProps) {

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 150); // 150ms 지연

        // 사용자가 계속 타이핑하면 이전 타이머는 취소하고 새로 시작합니다.
        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    useEffect(() => {
        const searchPlaces = async () => {
            if (debouncedQuery) {
                try {
                    const response = await fetch(`/api/search?query=${debouncedQuery}`);
                    const data = await response.json();
                    setResults(data.documents || []);
                } catch (error) {
                    console.error("검색 실패:", error);
                    setResults([]);
                }
            } else {
                setResults([]); // 검색어가 없으면 결과 목록을 비웁니다.
            }
        };
        searchPlaces();
    }, [debouncedQuery]); // debouncedQuery가 변경될 때만 API 호출

    return (
        <aside className="w-[350px] h-full bg-white border-r p-4 space-y-4 flex flex-col">
            <h1 className="text-2xl font-bold">지도 검색</h1>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                <Input
                    placeholder="장소, 주소 검색"
                    className="pl-10 h-11"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="border-t pt-4 flex-grow overflow-y-auto">
                <h2 className="text-sm font-semibold mb-2">검색 결과</h2>
                <div className="space-y-2">
                    {results.length > 0 ? (
                        results.map((result) => (
                            <div key={result.id} className="p-3 hover:bg-gray-100 rounded-md cursor-pointer border-b">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm">{result.place_name}</p>
                                    <p className="text-xs text-blue-600 font-semibold">
                                        {/* 거리를 미터(m) 또는 킬로미터(km)로 표시 */}
                                        {Number(result.distance) < 1000
                                            ? `${result.distance}m`
                                            : `${(Number(result.distance) / 1000).toFixed(1)}km`}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{result.road_address_name}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400">검색어를 입력하세요.</p>
                    )}
                </div>
            </div>
        </aside>
    );
}