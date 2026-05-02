/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/backgrounds/thicc-fitt/thicc-fitt-bg.jpg',
        destination: '/backgrounds/THICC-FITT/thicc-fitt-bg.jpeg'
      }
    ];
  }
};

module.exports = nextConfig;
