import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
        <body className={inter.variable}>
            {children}
            <Script
                strategy="beforeInteractive"
                type="text/javascript"
                src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=gbw3otoupx&submodules=geocoder,places&language=en`}
            />
        </body>
        </html>
    );
}