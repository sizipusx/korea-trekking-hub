import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GPX/CSV 데이터 파일을 Vercel 서버리스 번들에서 제외
  // (좌표 데이터는 Supabase DB에서 직접 조회)
  outputFileTracingExcludes: {
    '*': ['./csv_data/**', './**/*.gpx', './**/*.shp', './**/*.shp.xml'],
  },
};

export default nextConfig;
