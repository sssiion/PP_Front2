"use client";

import {useState, useEffect, useRef} from "react";
import {format, getMonth, getYear, setMonth, setYear} from "date-fns";
import {Search, Calendar as CalendarIcon, Loader2, MapPin} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {ko} from "date-fns/locale";
import {useDayPicker} from "react-day-picker";

// 검색 결과 자동 완성 항목의 타입
interface AutoCompleteItem {
    id: string;
    place_name: string;
    road_address_name: string;
    x: string; // 경도 (longitude)
    y: string; // 위도 (latitude)
}

// 부모 컴포넌트(page.tsx)로부터 받아야 할 props들의 타입
interface SidebarProps {
    onSearch: () => void;
    setSearchedLocation: (location: naver.maps.LatLng) => void;
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    dateTime: Date | null;
    onDateTimeChange: (date: Date | null) => void; // Date 또는 null을 받을 수 있도록 변경
    onQueryChange: (query: string) => void;
    query: string;
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

export function Sidebar({
                            onSearch,
                            setSearchedLocation,
                            selectedCategory,
                            onCategoryChange,
                            dateTime,
                            onDateTimeChange,
                            onQueryChange,
                            query
                        }: SidebarProps) {

    const [suggestions, setSuggestions] = useState<AutoCompleteItem[]>([]);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // 1. 달력 팝업의 열림/닫힘 상태를 관리할 state 추가
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // 1. 달력이 현재 보여주는 월을 제어하기 위한 새로운 상태
    const [displayMonth, setDisplayMonth] = useState<Date>(dateTime || new Date());

    useEffect(() => {
        if (dateTime) {
            setDisplayMonth(dateTime);
        }
    }, [dateTime]);

    // 사용자가 날짜를 선택하면, displayMonth도 함께 업데이트
    const handleDateSelect = (selectedDate: Date | undefined) => {
        console.log("✅ 1. 날짜 클릭! handleDateSelect 함수 시작.");
        console.log("   - 전달받은 날짜:", selectedDate);

        try {
            console.log("▶️ 2. 부모의 onDateTimeChange 함수를 호출 시도...");
            onDateTimeChange(selectedDate || null);
            console.log("✅ 3. onDateTimeChange 호출 성공!");
        } catch (e) {
            console.error("❌ 3-ERROR: onDateTimeChange 함수에서 에러 발생!", e);
        }

        try {
            if (selectedDate) {
                console.log("▶️ 4. 달력의 displayMonth 상태 변경 시도...");
                setDisplayMonth(selectedDate);
                console.log("✅ 5. displayMonth 변경 성공!");
            }
        } catch (e) {
            console.error("❌ 5-ERROR: setDisplayMonth 함수에서 에러 발생!", e);
        }

        try {
            console.log("▶️ 6. 팝업 닫기(setIsCalendarOpen) 함수 호출 시도...");
            setIsCalendarOpen(false);
            console.log("✅ 7. 팝업 닫기 성공!");
        } catch (e) {
            console.error("❌ 7-ERROR: setIsCalendarOpen 함수에서 에러 발생!", e);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
    const months = Array.from({ length: 12 }, (_, i) => i);

    // 자동 완성 검색 로직 (디바운싱 적용)
    useEffect(() => {
        if (!query) {
            setSuggestions([]);
            return;
        }

        const handler = setTimeout(() => {
            const fetchSuggestions = async () => {
                try {
                    const response = await fetch(`/api/search?query=${query}`);
                    const data = await response.json();
                    setSuggestions(data.documents || []);
                } catch (error) {
                    console.error("자동 완성 검색 실패:", error);
                    setSuggestions([]);
                }
            };
            fetchSuggestions();
        }, 200); // 200ms 지연

        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // 클릭된 곳이 searchContainerRef의 바깥쪽일 때만 추천 목록을 닫음
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        }
        // 이벤트 리스너 등록
        document.addEventListener("mousedown", handleClickOutside);
        // 컴포넌트가 사라질 때 이벤트 리스너 제거 (메모리 누수 방지)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchContainerRef]);

    // 자동 완성 목록의 항목을 클릭했을 때 실행될 함수
    const handleSuggestionClick = (item: AutoCompleteItem) => {
        onQueryChange(item.place_name); // 부모의 query 상태 업데이트 (검색창 텍스트 변경)
        setSuggestions([]); // 추천 목록 닫기

        // 클릭된 장소의 좌표(x, y)로 naver.maps.LatLng 객체 생성
        if (window.naver) {
            const location = new window.naver.maps.LatLng(
                parseFloat(item.y),
                parseFloat(item.x)
            );
            // 부모의 searchedLocation 상태를 업데이트하여 지도 이동
            setSearchedLocation(location);
        }
    };

    // 4. Enter 키를 눌렀을 때 실행될 함수
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            // 자동 완성 목록에 항목이 있다면 첫 번째 항목을 선택한 것처럼 동작
            if (suggestions.length > 0) {
                handleSuggestionClick(suggestions[0]);
            }
            setSuggestions([]);
        }
    };

    // 현재 위치를 가져와 주소로 변환하고, 검색창에 입력하는 함수
    const handleGetCurrentLocation = () => {
        setIsGettingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLocation = new window.naver.maps.LatLng(latitude, longitude);

                    // 좌표를 주소로 변환
                    window.naver.maps.Service.reverseGeocode({
                        coords: newLocation,
                        orders: 'roadaddr,addr',
                    }, (status, response) => {
                        if (status === window.naver.maps.Service.Status.OK) {
                            const addresses = response.v2.results;
                            const roadAddress = addresses[0]?.name === 'roadaddr' ? addresses[0].region.area1.name + ' ' + addresses[0].region.area2.name + ' ' + addresses[0].land.name + ' ' + addresses[0].land.number1 : '';
                            const jibunAddress = addresses[1]?.name === 'addr' ? addresses[1].region.area1.name + ' ' + addresses[1].region.area2.name + ' ' + addresses[1].region.area3.name + ' ' + addresses[1].land.number1 : '';

                            // 부모의 query 상태를 업데이트하여 검색창 텍스트 변경
                            onQueryChange(roadAddress || jibunAddress || '주소를 찾을 수 없음');
                            // 부모의 searchedLocation 상태를 업데이트하여 지도 이동
                            setSearchedLocation(newLocation);
                        }
                        setIsGettingLocation(false);
                    });
                },
                (error) => {
                    alert("위치 정보를 가져오는 데 실패했습니다.");
                    setIsGettingLocation(false);
                }
            );
        } else {
            alert("이 브라우저에서는 위치 정보가 지원되지 않습니다.");
            setIsGettingLocation(false);
        }
    };


    return (
        <aside className="w-[350px] h-full bg-white border-r p-4 space-y-4 flex flex-col">
            <h1 className="text-2xl font-bold">지도 검색</h1>

            <div className="flex items-center gap-2">
                <div className="relative" ref={searchContainerRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                    <Input
                        placeholder="장소, 주소 검색"
                        className="pl-10 h-11"
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {suggestions.length > 0 && (
                        <Card className="absolute top-full mt-1 w-full p-2 z-20 max-h-80 overflow-y-auto">
                            <ul>
                                {suggestions.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                                        onClick={() => handleSuggestionClick(item)}
                                    >
                                        <Search className="w-4 h-4 mr-3 text-gray-400"/>
                                        <div>
                                            <p className="font-medium text-sm truncate">{item.place_name}</p>
                                            <p className="text-xs text-gray-500 truncate">{item.road_address_name}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="w-11 h-11 rounded-full flex-shrink-0"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                >
                    {isGettingLocation ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <MapPin className="w-5 h-5" />
                    )}
                </Button>
            </div>

            <div className="flex gap-2">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"}
                                className={`flex-1 justify-start text-left font-normal h-11 ${!dateTime && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4"/>
                            {/* dateTime이 있으면 그 값을, 없으면 현재 날짜를 표시 */}
                            {dateTime ? format(dateTime, "yyyy-MM-dd") : <span>날짜 선택</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        {/*/!* 2. 연도와 월 선택 Select 컴포넌트를 Popover 안에 직접 추가 *!/*/}
                        {/*<div className="flex justify-center gap-2 p-2 border-b">*/}
                        {/*    <Select*/}
                        {/*        value={String(getYear(displayMonth))}*/}
                        {/*        onValueChange={(value) => setDisplayMonth(setYear(displayMonth, Number(value)))}*/}
                        {/*    >*/}
                        {/*        <SelectTrigger className="w-[100px] h-8 focus:ring-0"><SelectValue /></SelectTrigger>*/}
                        {/*        <SelectContent>*/}
                        {/*            {years.map((year) => <SelectItem key={year} value={String(year)}>{year}년</SelectItem>)}*/}
                        {/*        </SelectContent>*/}
                        {/*    </Select>*/}
                        {/*    <Select*/}
                        {/*        value={String(getMonth(displayMonth))}*/}
                        {/*        onValueChange={(value) => setDisplayMonth(setMonth(displayMonth, Number(value)))}*/}
                        {/*    >*/}
                        {/*        <SelectTrigger className="w-[80px] h-8 focus:ring-0"><SelectValue /></SelectTrigger>*/}
                        {/*        <SelectContent>*/}
                        {/*            {months.map((month) => <SelectItem key={month} value={String(month)}>{month + 1}월</SelectItem>)}*/}
                        {/*        </SelectContent>*/}
                        {/*    </Select>*/}
                        {/*</div>*/}
                        <Calendar
                            mode="single"
                            required={false}
                            selected={dateTime || undefined}
                            onSelect={handleDateSelect}
                            locale={ko}
                            // 3. 외부 상태(displayMonth)로 달력이 보여주는 월을 제어
                            // month={displayMonth}
                            // onMonthChange={setDisplayMonth}
                            initialFocus

                            onDayClick={(day) => alert(`[테스트] ${day.toLocaleDateString()} 클릭됨`)}
                        />
                    </PopoverContent>
                </Popover>
                <Input
                    type="time"
                    className="flex-1 h-11"
                    value={dateTime ? format(dateTime, "HH:mm") : ""}
                    onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        // dateTime이 null이었을 경우를 대비해 new Date()로 초기화
                        const newDate = dateTime ? new Date(dateTime) : new Date();
                        newDate.setHours(Number(hours), Number(minutes));
                        onDateTimeChange(newDate);
                    }}
                />
            </div>

            <div>
                <Select onValueChange={(value) => onCategoryChange(value)} value={selectedCategory || ""}>
                    <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="카테고리 선택 (선택 사항)"/>
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button onClick={onSearch} className="w-full h-12 text-lg">
                추천 장소 검색
            </Button>

            <div className="border-t pt-4 flex-grow overflow-y-auto">
                {/* 이 공간은 최종 추천 결과를 보여주는 곳입니다. (RecsSidebar가 채울 공간) */}
            </div>
        </aside>
    );
}