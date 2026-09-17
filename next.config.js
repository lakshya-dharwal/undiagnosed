/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Source uses explicit .js specifiers so tsx and vitest resolve them as ESM.
    // Webpack needs to be told those map back to the .ts files on disk.
    config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'] };
    return config;
  },
};

export default nextConfig;
