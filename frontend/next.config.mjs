/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  compiler: {
    styledComponents: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/casper/:path*",
        destination: `${process.env.NEXT_PUBLIC_CASPER_API_URL || "https://api.testnet.cspr.live"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
