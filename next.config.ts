import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'tong.visitkorea.or.kr',
                port: '',
                pathname: '/cms/resource/**',
            },
        ],
    },
  /* config options here */
};

export default nextConfig;
