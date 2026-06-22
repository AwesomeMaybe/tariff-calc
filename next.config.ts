import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    // На Windows (Desktop/OneDrive/антивирус) атомарный rename .pack.gz_ → .pack.gz
    // периодически падает с EPERM → dev отдаёт CSS без токенов («голый» вид).
    // Память вместо файлового кэша в dev убирает проблему ценой чуть более долгой пересборки.
    if (dev) config.cache = { type: "memory" };
    return config;
  },
};

export default nextConfig;
