/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // ESLint 설정 없이도 배포 빌드가 막히지 않도록 (타입체크는 그대로 수행)
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
