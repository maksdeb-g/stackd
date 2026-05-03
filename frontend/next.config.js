/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "http", hostname: "books.google.com" },
    ],
  },
};

module.exports = nextConfig;
