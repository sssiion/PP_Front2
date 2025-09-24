"use client";

import { Search, MapPin, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormEvent, useRef, useState } from "react";

// geocode 응답의 주소 아이템 타입 정의
interface NaverAddressItem {
    roadAddress: string;
    jibunAddress: string;
    x: string;
    y: string;
}

export const categories = [
    { id: "12", name: "관광지" },
    { id: "14", name: "문화시설" },
    { id: "15", name: "행사/공연/축제" },
    { id: "25", name: "여행코스" },
    { id: "28", name: "레포츠" },
    { id: "32", name: "숙박" },
    { id: "38", name: "쇼핑" },
    { id: "39", name: "음식점" },
];

interface SidebarProps {
    query: string;
    setQuery: (query: string) => void;
    setSearchedLocation: (location: naver.maps.LatLng) => void;
    onSearch: () => void;
    selectedCategory: string | null;
    onCategoryChange: (id: string | null) => void;
    time: string;
    onTimeChange: (time: string) => void;
}

export function Sidebar({ query, setQuery, setSearchedLocation, onSearch, selectedCategory, onCategoryChange, time, onTimeChange }: SidebarProps) {
    const [suggestions, setSuggestions] = useState<NaverAddressItem[]>([]);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const handleGeocodeSearch = (searchQuery: string) => {
        if (!searchQuery || !window.naver || !window.naver.maps || !window.naver.maps.Service) return;

        naver.maps.Service.geocode({ query: searchQuery }, (status, response) => {
            if (status === naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                const firstResult = response.v2.addresses[0];
                const location = new naver.maps.LatLng(parseFloat(firstResult.y), parseFloat(firstResult.x));
                setSearchedLocation(location);
                setSuggestions([]);
            } else {
                alert(`'${searchQuery}'에 대한 검색 결과가 없습니다.`);
            }
        });
    };

    const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleGeocodeSearch(query);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (newQuery) {
            debounceTimer.current = setTimeout(() => {
                naver.maps.Service.geocode({ query: newQuery }, (status, response) => {
                    if (status === naver.maps.Service.Status.OK) {
                        setSuggestions(response.v2.addresses || []);
                    }
                });
            }, 300);
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion: NaverAddressItem) => {
        const address = suggestion.roadAddress || suggestion.jibunAddress;
        setQuery(address);
        setSuggestions([]);
        const location = new naver.maps.LatLng(parseFloat(suggestion.y), parseFloat(suggestion.x));
        setSearchedLocation(location);
    };

    return (
        <aside className="w-[380px] h-full bg-white border-r border-gray-200 flex flex-col p-4 space-y-4 z-20 shadow-lg">
            <h1 className="text-2xl font-bold text-gray-800">여행지 추천 검색</h1>

            <form onSubmit={handleFormSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    placeholder="기준 장소를 입력하세요 (예: 강남역)"
                    className="pl-10 h-11"
                    value={query}
                    onChange={handleInputChange}
                    autoComplete="off"
                />
                {suggestions.length > 0 && (
                    <Card className="absolute top-full mt-1 w-full p-2 z-20 max-h-60 overflow-y-auto">
                        <ul>
                            {suggestions.map((item, index) => (
                                <li key={index} className="p-2 hover:bg-gray-100 rounded-md cursor-pointer" onClick={() => handleSuggestionClick(item)}>
                                    <p className="font-semibold text-sm">{item.roadAddress}</p>
                                    <p className="text-xs text-gray-500">{item.jibunAddress}</p>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </form>

            <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2"/> 희망 시간
                </h2>
                <Input
                    type="time"
                    value={time}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="h-11"
                />
            </div>

            <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-2">추천 카테고리</h2>
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => onCategoryChange(selectedCategory === category.id ? null : category.id)}
                            className="rounded-full"
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-end">
                <Button onClick={onSearch} className="w-full h-12 text-lg">
                    <Search className="w-5 h-5 mr-2"/> 추천 장소 검색
                </Button>
            </div>
        </aside>
    );
}