/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'i.scdn.co' }],
  },
  // The Day Capsule route can write to a local folder during development, which
  // makes Next's file tracer conservatively include the entire public art
  // library in the production function. Public assets are served separately by
  // Vercel and are never read by this API route in production.
  outputFileTracingExcludes: {
    '/api/day-capsule-render': ['./public/**/*'],
  },
  outputFileTracingIncludes: {
    '/api/thicc-school/workbook/page/[page]': ['./private/issa/cpt11-workbook/pages/**/*'],
    '/api/thicc-school/workbook/assess': ['./private/issa/cpt11-textbook/**/*', './private/issa/nutrition-textbook/**/*'],
  },
};

module.exports = nextConfig;
