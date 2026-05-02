const fs = require('fs');
const path = require('path');
const https = require('https');

// Assets folder
const assetsFolder = path.join(__dirname, 'src', 'assets');

// Common npm packages with known logo locations
const packages = [
    'clsx',
    'class-variance-authority',
    'tailwind-merge',
    'lucide-react',
    'react-hook-form',
    'zod',
    'axios',
    'lodash',
    'date-fns',
    'nanoid',
    'uuid',
    'dotenv',
    'cors',
    'express',
    'mongoose',
    'prisma',
    'socket.io',
    'jsonwebtoken',
    'bcrypt',
    'multer',
    'sharp',
    'formidable',
    'nodemailer',
    'jest',
    'vitest',
    'cypress',
    'playwright',
    'eslint',
    'prettier',
    'webpack',
    'rollup',
    'vite',
    'turbo',
    'lerna',
    'nx',
    'redux',
    'zustand',
    'mobx',
    'recoil',
    'jotai',
    'react-query',
    'swr',
    'apollo-client',
    'graphql',
    'styled-components',
    'emotion',
    'framer-motion',
    'recharts',
    'chart.js',
    'd3',
    'three',
    'pixi.js',
    'matter-js',
    'storybook',
    'chromatic',
];

// Try multiple sources for each package
async function findAndDownloadLogo(packageName) {
    // Possible logo locations
    const sources = [
        `https://unpkg.com/${packageName}/logo.png`,
        `https://unpkg.com/${packageName}/logo.svg`,
        `https://unpkg.com/${packageName}/icon.png`,
        `https://unpkg.com/${packageName}/icon.svg`,
        `https://raw.githubusercontent.com/${packageName}/${packageName}/master/logo.png`,
        `https://raw.githubusercontent.com/${packageName}/${packageName}/main/logo.svg`,
    ];

    for (const url of sources) {
        try {
            const ext = url.endsWith('.svg') ? '.svg' : '.png';
            const filename = `${packageName.replace('/', '-')}${ext}`;
            const success = await downloadImage(url, filename);
            if (success) {
                console.log(`✅ Downloaded ${packageName} from ${url}`);
                return true;
            }
        } catch (error) {
            // Try next source
        }
    }
    
    console.log(`⚠️  No logo found for ${packageName}`);
    return false;
}

function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filepath = path.join(assetsFolder, filename);

        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(true);
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
                resolve(false);
            }
        }).on('error', () => resolve(false));
    });
}

async function downloadAllLogos() {
    console.log('🔍 Searching for package logos...\n');
    
    let successCount = 0;
    for (const pkg of packages) {
        const success = await findAndDownloadLogo(pkg);
        if (success) successCount++;
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\n✅ Downloaded ${successCount}/${packages.length} logos`);
    console.log(`📁 Saved to: ${assetsFolder}`);
}

downloadAllLogos();
