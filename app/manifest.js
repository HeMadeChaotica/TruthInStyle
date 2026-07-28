export default function manifest() {
  return {
    name: 'TruthInStyle',
    short_name: 'TruthInStyle',
    description: 'Enter Chaotica through Mista.THICC.',
    start_url: '/',
    display: 'standalone',
    background_color: 'transparent',
    theme_color: '#7f294b',
    icons: [
      {
        src: '/icons/truthinstyle-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/truthinstyle-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
