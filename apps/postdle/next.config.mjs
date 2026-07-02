import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // 모노레포에서 standalone 이 워크스페이스 의존성(@repo/post-editor 등)을 추적하도록 루트 지정
  outputFileTracingRoot: path.resolve(import.meta.dirname, '../../'),
  // 공유 워크스페이스 패키지(소스 TSX)를 Next 가 트랜스파일하도록
  transpilePackages: ['@repo/post-editor'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // ESLint 설정 없이도 배포 빌드가 막히지 않도록 (타입체크는 그대로 수행)
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
