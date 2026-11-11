import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // next dev가 앱 폴더마다 AGENTS.md를 만들지 않게 한다 (루트의 AGENTS.md 하나만 쓴다)
  agentRules: false,
  // 공용 패키지는 빌드하지 않은 TS 소스 그대로 쓰므로 Next가 함께 컴파일하게 한다.
  transpilePackages: ['@me/core', '@me/ui'],
};

export default nextConfig;
