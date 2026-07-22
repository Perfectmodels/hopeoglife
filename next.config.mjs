/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/carte-du-bar", destination: "/menu?tab=bar", permanent: true },
      { source: "/galerie", destination: "/evenements#galerie", permanent: true },
      { source: "/privatisation", destination: "/a-propos#privatisation", permanent: true },
    ];
  },
};

export default nextConfig;
