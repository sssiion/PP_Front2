import { Sidebar } from "@/components/Sidebar";
import { MapContainer } from "@/components/MapContainer";

export default function Home() {
  return (
      <main className="flex h-screen w-screen">
        {/* 왼쪽 사이드바 */}
        <Sidebar />

        {/* 오른쪽 지도 영역 */}
        <MapContainer />

      </main>
  );
}