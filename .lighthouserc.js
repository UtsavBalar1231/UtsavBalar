export default {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/index.html',
        'http://localhost/about/index.html',
        'http://localhost/projects/index.html',
        'http://localhost/tutorials/index.html',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // WebGL and Canvas effects shouldn't block rendering
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Font optimization (DepartureMono)
        'font-display': 'off', // We use font-display: swap in CSS

        // Resource optimization
        'unused-javascript': 'off', // Astro optimizes this
        'unused-css-rules': 'off', // Tailwind purges unused CSS

        // Modern browser requirements (Chrome 90+, Firefox 88+, Safari 16+)
        'uses-webp-images': 'off', // We use webp already
        'modern-image-formats': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
