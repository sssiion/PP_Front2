import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Sidebar() {
    // 예시 데이터
    const recentSearches = ["서울역", "강남역", "홍대입구역", "명동"];
    const searchResults = [
        { name: "서울역", type: "지하철역" },
        { name: "강남역", type: "지하철역" },
        { name: "홍대입구역", type: "지하철역" },
        { name: "명동", type: "상업지구" },
    ];

    return (
        <aside className="w-[350px] h-full bg-white border-r border-gray-200 flex flex-col p-4 space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">지도 검색</h1>

            {/* 검색창 */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input placeholder="장소, 주소 검색" className="pl-10 h-11" />
            </div>

            {/* 최근 검색 */}
            <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-2">최근 검색</h2>
                <div className="space-y-2">
                    {recentSearches.map((item) => (
                        <div key={item} className="flex items-center space-x-3 text-gray-700 cursor-pointer hover:font-semibold">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-200 flex-grow pt-4 overflow-y-auto">
                <h2 className="text-sm font-semibold text-gray-600 mb-2">검색 결과</h2>
                <div className="space-y-3">
                    {searchResults.map((result) => (
                        <Card key={result.name} className="p-3 hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{result.name}</p>
                                    <p className="text-xs text-gray-500">{result.type}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </aside>
    );
}