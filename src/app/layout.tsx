import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Script from "next/script";
import {cn} from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "지도 애플리케이션",
    description: "Next.js로 만든 지도 검색 애플리케이션",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
        <body className={cn(
            "min-h-screen bg-background font-sans antialiased",
            GeistSans.variable, // Sans-serif 폰트 변수
            GeistMono.variable  // Monospace 폰트 변수
        )}>
            {children}
            <Script
                strategy="beforeInteractive"
                type="text/javascript"
                src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=gbw3otoupx&language=en&submodules=geocoding`}
            />
        </body>
        </html>
    );
}