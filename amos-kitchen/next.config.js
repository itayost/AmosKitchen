// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Remove the experimental.serverActions as it's no longer needed in Next.js 14
    images: {
        domains: ['localhost'],
    },
    // Add any other config options you need here
}

module.exports = nextConfig
