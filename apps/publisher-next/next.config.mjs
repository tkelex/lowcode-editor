/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@ant-design/icons',
    '@ant-design/cssinjs',
    '@ant-design/nextjs-registry',
  ],
};

export default nextConfig;
