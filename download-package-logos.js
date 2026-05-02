const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Assets folder
const assetsFolder = path.join(__dirname, 'src', 'assets');

// Package logos to download with their official sources
const packageLogos = {
    // Libraries you're likely using
    'clsx': 'https://raw.githubusercontent.com/lukeed/clsx/master/clsx.png',
    'lucide-react': 'https://lucide.dev/logo.svg',
    'class-variance-authority': 'https://cva.style/favicon.png',
    'postcss': 'https://postcss.org/logo.svg',
    'autoprefixer': 'https://avatars.githubusercontent.com/u/2988867',
    'eslint': 'https://eslint.org/icon-512.png',
    'prettier': 'https://prettier.io/icon.png',
    'webpack': 'https://webpack.js.org/icon-square-small.png',
    'rollup': 'https://rollupjs.org/logo.svg',
    'lodash': 'https://lodash.com/icon.svg',
    'axios': 'https://axios-http.com/assets/logo.svg',
    'date-fns': 'https://date-fns.org/img/logo.png',
    'zustand': 'https://raw.githubusercontent.com/pmndrs/zustand/main/docs/bear.jpg',
    'framer-motion': 'https://www.framer.com/images/favicons/favicon.png',
    'recharts': 'https://recharts.org/favicon.ico',
    'styled-components': 'https://styled-components.com/logo.png',
    'emotion': 'https://emotion.sh/logo.png',
    'redux': 'https://redux.js.org/img/redux.svg',
    'mobx': 'https://mobx.js.org/img/mobx.png',
    'jest': 'https://jestjs.io/img/jest.png',
    'vitest': 'https://vitest.dev/logo.svg',
    'cypress': 'https://www.cypress.io/images/layouts/navbar-brand.svg',
    'playwright': 'https://playwright.dev/img/playwright-logo.svg',
    'prisma': 'https://www.prisma.io/images/favicon-32x32.png',
    'graphql': 'https://graphql.org/img/logo.svg',
    'apollo': 'https://www.apollographql.com/apollo-home.jpg',
    'storybook': 'https://storybook.js.org/images/logos/icon-storybook.png',
    'turbo': 'https://turbo.build/images/docs/repo/repo-hero-logo-light.svg',
    'zod': 'https://zod.dev/logo.svg',
    'react-query': 'https://react-query.tanstack.com/_next/static/images/logo-7a7896631260eebffcb031765854375b.svg',
    'swr': 'https://swr.vercel.app/favicon/favicon.svg',
    'socket.io': 'https://socket.io/images/logo.svg',
    'three': 'https://threejs.org/files/favicon.ico',
    'chart.js': 'https://www.chartjs.org/img/chartjs-logo.svg',
    'd3': 'https://d3js.org/logo.svg',
};

// Function to download and save image
function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const filepath = path.join(assetsFolder, filename);

        protocol.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`✅ Downloaded: ${filename}`);
                    resolve(filepath);
                });
                fileStream.on('error', (err) => {
                    fs.unlink(filepath, () => {});
                    reject(err);
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirects
                downloadImage(response.headers.location, filename)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

// Main function
async function downloadLogos() {
    console.log('Starting logo downloads...\n');
    
    for (const [packageName, url] of Object.entries(packageLogos)) {
        try {
            const ext = url.endsWith('.svg') ? '.svg' : '.png';
            const filename = `${packageName}${ext}`;
            await downloadImage(url, filename);
            // Small delay to avoid overwhelming servers
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`❌ Failed to download ${packageName}:`, error.message);
        }
    }
    
    console.log('\n✅ Download process completed!');
    console.log(`📁 Files saved to: ${assetsFolder}`);
    console.log('\n📝 Next steps:');
    console.log('1. Import the downloaded images in iconLinks.js');
    console.log('2. Add them to the techIcons or getPackageIcon mapping');
    console.log('3. For SVG files, you may want to convert them to PNG using an online tool');
}

downloadLogos();
