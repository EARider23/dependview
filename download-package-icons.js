/**
 * Package Logo Downloader
 * Downloads package logos from reliable sources at 128x128px
 * 
 * Usage: node download-package-icons.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const assetsFolder = path.join(__dirname, 'src', 'assets');

// Curated list of package logos from reliable sources
const PACKAGE_ICONS = {
    // Popular UI/Component Libraries
    'shadcn-ui': 'https://ui.shadcn.com/apple-touch-icon.png',
    'radix-ui': 'https://www.radix-ui.com/logo.png',
    'chakra-ui': 'https://avatars.githubusercontent.com/u/54212428?s=200&v=4',
    'mantine': 'https://avatars.githubusercontent.com/u/79146003?s=200&v=4',
    'ant-design': 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
    'material-ui': 'https://mui.com/static/logo.png',
    
    // State Management
    'zustand': 'https://avatars.githubusercontent.com/u/45790596?s=200&v=4',
    'redux': 'https://raw.githubusercontent.com/reduxjs/redux/master/logo/logo.png',
    'jotai': 'https://avatars.githubusercontent.com/u/67408765?s=200&v=4',
    'recoil': 'https://recoiljs.org/img/logo.svg',
    
    // Data Fetching
    'tanstack-query': 'https://avatars.githubusercontent.com/u/72518640?s=200&v=4',
    'swr': 'https://avatars.githubusercontent.com/u/14985020?s=200&v=4',
    'axios': 'https://avatars.githubusercontent.com/u/32372333?s=200&v=4',
    
    // Forms & Validation
    'react-hook-form': 'https://react-hook-form.com/images/logo/react-hook-form-logo-only.png',
    'zod': 'https://zod.dev/logo.svg',
    'yup': 'https://avatars.githubusercontent.com/u/6078720?s=200&v=4',
    
    // Testing
    'jest': 'https://jestjs.io/img/jest.png',
    'vitest': 'https://vitest.dev/logo.svg',
    'testing-library': 'https://testing-library.com/img/octopus-128x128.png',
    'cypress': 'https://avatars.githubusercontent.com/u/8908513?s=200&v=4',
    'playwright': 'https://playwright.dev/img/playwright-logo.svg',
    
    // Build Tools (already have some)
    'esbuild': 'https://esbuild.github.io/favicon.svg',
    'swc': 'https://swc.rs/logo.png',
    'turbopack': 'https://turbo.build/images/docs/pack/turbo-benchmark-graph.svg',
    
    // Animation
    'framer-motion': 'https://user-images.githubusercontent.com/7850794/164965523-6ff59c21-d3a3-48ff-a2c1-58a8e994fc25.png',
    'anime-js': 'https://animejs.com/documentation/assets/img/favicon.png',
    
    // Charts & Visualization  
    'recharts': 'https://avatars.githubusercontent.com/u/17753912?s=200&v=4',
    'chart-js': 'https://www.chartjs.org/img/chartjs-logo.svg',
    'd3': 'https://raw.githubusercontent.com/d3/d3-logo/master/d3.png',
    'plotly': 'https://avatars.githubusercontent.com/u/5997976?s=200&v=4',
    
    // Date & Time
    'date-fns': 'https://avatars.githubusercontent.com/u/12692856?s=200&v=4',
    'dayjs': 'https://avatars.githubusercontent.com/u/34018120?s=200&v=4',
    'moment': 'https://momentjs.com/static/img/moment-favicon.png',
    
    // Utilities
    'lodash': 'https://avatars.githubusercontent.com/u/2565403?s=200&v=4',
    'ramda': 'https://avatars.githubusercontent.com/u/6846673?s=200&v=4',
    'uuid': 'https://avatars.githubusercontent.com/u/34641009?s=200&v=4',
    'nanoid': 'https://avatars.githubusercontent.com/u/19343?s=200&v=4',
    
    // CSS-in-JS
    'styled-components': 'https://avatars.githubusercontent.com/u/20658825?s=200&v=4',
    'emotion': 'https://emotion.sh/static/emotion.png',
    
    // Icons
    'lucide': 'https://lucide.dev/logo.dark.svg',
    'react-icons': 'https://avatars.githubusercontent.com/u/79299647?s=200&v=4',
    'heroicons': 'https://avatars.githubusercontent.com/u/67109815?s=200&v=4',
    
    // Database & ORM
    'prisma': 'https://avatars.githubusercontent.com/u/17219288?s=200&v=4',
    'drizzle': 'https://avatars.githubusercontent.com/u/108468352?s=200&v=4',
    'mongoose': 'https://avatars.githubusercontent.com/u/7552965?s=200&v=4',
    
    // API & GraphQL
    'graphql': 'https://graphql.org/img/logo.svg',
    'apollo': 'https://avatars.githubusercontent.com/u/17189275?s=200&v=4',
    'trpc': 'https://avatars.githubusercontent.com/u/78011399?s=200&v=4',
};

function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const filepath = path.join(assetsFolder, filename);

        protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(true);
                });
                fileStream.on('error', reject);
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                downloadImage(response.headers.location, filename)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error(`HTTP ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

async function downloadAllIcons() {
    console.log('📦 Starting package icon downloads...\n');
    
    let success = 0;
    let failed = 0;
    
    for (const [name, url] of Object.entries(PACKAGE_ICONS)) {
        try {
            const ext = url.endsWith('.svg') ? '.svg' : '.png';
            const filename = `${name}${ext}`;
            
            await downloadImage(url, filename);
            console.log(`✅ ${name}`);
            success++;
            
            // Rate limiting
            await new Promise(r => setTimeout(r, 300));
        } catch (error) {
            console.error(`❌ ${name}: ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\n✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📁 Location: ${assetsFolder}`);
    console.log(`\n💡 Next: Import these in iconLinks.js and add to getPackageIcon()`);
}

// Ensure assets folder exists
if (!fs.existsSync(assetsFolder)) {
    fs.mkdirSync(assetsFolder, { recursive: true });
}

downloadAllIcons();
