"use client";

import { Search, MapPin } from "lucide-react";
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
    { id: 12, name: "관광지" },
    { id: 14, name: "문화시설" },
    { id: 15, name: "행사/공연/축제" },
    { id: 25, name: "여행코스" },
    { id: 28, name: "레포츠" },
    { id: 32, name: "숙박" },
    { id: 38, name: "쇼핑" },
    { id: 39, name: "음식점" },
];

interface SidebarProps {
    setSearchedLocation: (location: naver.maps.LatLng) => void;
    onCategorySelect: (contentTypeId: number) => void;
    selectedCategoryId: number | null;
}

export function Sidebar({ setSearchedLocation, onCategorySelect, selectedCategoryId }: SidebarProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<NaverAddressItem[]>([]);
    const [recentLocationSearches, setRecentLocationSearches] = useState<string[]>([]);
    const [recentCategorySearches, setRecentCategorySearches] = useState<string[]>([]);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const performSearch = (searchQuery: string, callback?: () => void) => {
        if (!searchQuery || !window.naver || !window.naver.maps || !window.naver.maps.Service) return;

        setQuery(searchQuery); // 검색창의 텍스트도 업데이트

        naver.maps.Service.geocode({ query: searchQuery }, (status: naver.maps.Service.Status, response: naver.maps.Service.GeocodeResponse) => {
            if (status === naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                const firstResult = response.v2.addresses[0];
                const location = new naver.maps.LatLng(parseFloat(firstResult.y), parseFloat(firstResult.x));
                setSearchedLocation(location);
                setRecentLocationSearches(prev => [searchQuery, ...prev.filter(item => item !== searchQuery)].slice(0, 5));
                setSuggestions([]);
                callback?.(); // 콜백 함수가 있으면 실행
            } else {
                alert(`'${searchQuery}'에 대한 검색 결과가 없습니다.`);
            }
        });
    };

    const handleSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        performSearch(query);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (newQuery) {
            debounceTimer.current = setTimeout(() => {
                if (!window.naver || !window.naver.maps || !window.naver.maps.Service) return;
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
        
        // 추천 항목 클릭 시에는 이미 좌표가 있으므로 바로 지도 이동
        const location = new naver.maps.LatLng(parseFloat(suggestion.y), parseFloat(suggestion.x));
        setSearchedLocation(location);
        setRecentLocationSearches(prev => [address, ...prev.filter(item => item !== address)].slice(0, 5));
    };

    const handleCategoryClick = (category: { id: number, name: string }) => {
        if (query) {
            const combinedSearch = `${query} ${category.name}`;
            setRecentCategorySearches(prev => [combinedSearch, ...prev.filter(item => item !== combinedSearch)].slice(0, 5));
        }
        onCategorySelect(category.id);
    };

    const handleRecentCategorySearchClick = (item: string) => {
        // 1. 문자열에서 카테고리 이름과 지역 검색어 분리
        const foundCategory = categories.find(cat => item.endsWith(cat.name));

        if (!foundCategory) {
            // 혹시 카테고리를 못찾으면, 전체를 지역 검색어로 취급
            performSearch(item);
            return;
        }

        const locationQuery = item.substring(0, item.length - foundCategory.name.length).trim();

        if (!locationQuery) {
            alert("검색할 지역명이 없습니다.");
            return;
        }

        // 2. 지역 검색을 먼저 실행하고, 성공 콜백에서 카테고리 선택 실행
        performSearch(locationQuery, () => {
            onCategorySelect(foundCategory.id);
        });
    };

    return (
        <aside className="w-[350px] h-full bg-white border-r border-gray-200 flex flex-col p-4 space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">지도 검색</h1>

            <div className="relative">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <Input
                        placeholder="먼저 지역을 검색하세요"
                        className="pl-10 h-11"
                        value={query}
                        onChange={handleInputChange}
                        autoComplete="off"
                    />
                    <Button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 h-9">검색</Button>
                </form>
                {suggestions.length > 0 && (
                    <Card className="absolute top-full mt-1 w-full p-2 z-20 max-h-60 overflow-y-auto">
                        <ul>
                            {suggestions.map((item, index) => (
                                <li
                                    key={index}
                                    className="p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                                    onClick={() => handleSuggestionClick(item)}
                                >
                                    <p className="font-semibold text-sm">{item.roadAddress}</p>
                                    <p className="text-xs text-gray-500">{item.jibunAddress}</p>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>

            {/* 카테고리 선택 */}
            <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-2">추천 카테고리</h2>
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <Button
                            key={category.id}
                            variant={selectedCategoryId === category.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCategoryClick(category)}
                            className="rounded-full"
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* 최근 검색 */}
            <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-2">최근 검색</h2>
                <div className="space-y-2">
                    {recentLocationSearches.length > 0 ? (
                        recentLocationSearches.map((item) => (
                            <div key={item} className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:font-semibold" onClick={() => performSearch(item)}>
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{item}</span>
                            </div>
                        )) ) : (
                        <p className="text-xs text-gray-500">지역 검색 기록이 없습니다.</p>
                    )}
                </div>
            </div>

            {/* 카테고리 조합 검색 */}
            <div className="border-t border-gray-200 flex-grow pt-4 overflow-y-auto">
                <h2 className="text-sm font-semibold text-gray-600 mb-2">카테고리 조합 검색</h2>
                <div className="space-y-3">
                    {recentCategorySearches.length > 0 ? (
                        recentCategorySearches.map((item) => (
                            <Card key={item} className="p-3 hover:bg-gray-50 cursor-pointer" onClick={() => handleRecentCategorySearchClick(item)}>
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{item}</p>
                                    </div>
                                </div>
                            </Card>
                        )) ) : (
                        <p className="text-xs text-gray-500">카테고리 조합 검색 기록이 없습니다.</p>
                    )}
                </div>
            </div>
        </aside>
    );
}