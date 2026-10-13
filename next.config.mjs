/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Takes effect only when the apex host reaches this app (see DNS note); GoDaddy forwarding bypasses it.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "flowsstateagents.com" }],
        destination: "https://www.flowsstateagents.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
