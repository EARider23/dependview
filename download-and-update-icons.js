/**
 * Automated Icon Downloader & iconLinks.js Updater
 * Downloads package logos and automatically updates iconLinks.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const assetsFolder = path.join(__dirname, 'src', 'assets');
const iconLinksPath = path.join(__dirname, 'src', 'assets', 'iconLinks.js');

// Package logos to download
const NEW_PACKAGES = {
    'clsx': { url: 'https://avatars.githubusercontent.com/u/19343?s=200', color: 'bg-gray-600', icon: '🔧' },
    'lucide': { url: 'https://avatars.githubusercontent.com/u/101605264?s=200', color: 'bg-orange-500', icon: '🎨' },
    'eslint': { url: 'https://avatars.githubusercontent.com/u/6019716?s=200', color: 'bg-purple-600', icon: '📋' },
    'prettier': { url: 'https://avatars.githubusercontent.com/u/25822731?s=200', color: 'bg-pink-500', icon: '💅' },
    'rollup': { url: 'https://avatars.githubusercontent.com/u/16200699?s=200', color: 'bg-red-600', icon: '📦' },
    'lodash': { url: 'https://avatars.githubusercontent.com/u/2565403?s=200', color: 'bg-blue-600', icon: '🔧' },
    'axios': { url: 'https://avatars.githubusercontent.com/u/32372333?s=200', color: 'bg-purple-500', icon: '🌐' },
    'zustand': { url: 'https://avatars.githubusercontent.com/u/45790596?s=200', color: 'bg-gray-800', icon: '🐻' },
    'framer-motion': { url: 'https://avatars.githubusercontent.com/u/14985020?s=200', color: 'bg-pink-600', icon: '✨' },
    'recharts': { url: 'https://avatars.githubusercontent.com/u/17753912?s=200', color: 'bg-blue-500', icon: '📊' },
    'redux': { url: 'https://avatars.githubusercontent.com/u/13142323?s=200', color: 'bg-purple-700', icon: '🔄' },
    'jest': { url: 'https://avatars.githubusercontent.com/u/103283236?s=200', color: 'bg-red-700', icon: '🃏' },
    'vitest': { url: 'https://avatars.githubusercontent.com/u/95747107?s=200', color: 'bg-green-500', icon: '⚡' },
    'cypress': { url: 'https://avatars.githubusercontent.com/u/8908513?s=200', color: 'bg-gray-700', icon: '🌲' },
    'prisma': { url: 'https://avatars.githubusercontent.com/u/17219288?s=200', color: 'bg-blue-700', icon: '💎' },
    'graphql': { url: 'https://avatars.githubusercontent.com/u/12972006?s=200', color: 'bg-pink-500', icon: 'GQL' },
    'storybook': { url: 'https://avatars.githubusercontent.com/u/22632046?s=200', color: 'bg-pink-600', icon: '📖' },
    'zod': { url: 'https://avatars.githubusercontent.com/u/90275217?s=200', color: 'bg-blue-600', icon: 'Z' },
    'socket-io': { url: 'https://avatars.githubusercontent.com/u/10566080?s=200', color: 'bg-black', icon: '🔌' },
    'chart-js': { url: 'https://avatars.githubusercontent.com/u/10342521?s=200', color: 'bg-orange-500', icon: '📈' },
    'd3': { url: 'https://avatars.githubusercontent.com/u/1562726?s=200', color: 'bg-orange-600', icon: 'D3' },
    'three': { url: 'https://avatars.githubusercontent.com/u/4979966?s=200', color: 'bg-black', icon: '3D' },
};

function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filepath = path.join(assetsFolder, filename);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(true);
                });
                fileStream.on('error', reject);
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                downloadImage(response.headers.location, filename).then(resolve).catch(reject);
            } else {
                reject(new Error(`HTTP ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

async function downloadAllLogos() {
    console.log('📦 Downloading package logos...\n');
    const downloaded = [];
    
    for (const [name, data] of Object.entries(NEW_PACKAGES)) {
        try {
            const filename = `${name}.png`;
            await downloadImage(data.url, filename);
            console.log(`✅ ${name}`);
            downloaded.push({ name, filename, ...data });
            await new Promise(r => setTimeout(r, 300));
        } catch (error) {
            console.error(`❌ ${name}: ${error.message}`);
        }
    }
    
    return downloaded;
}

function updateIconLinks(downloaded) {
    console.log('\n📝 Updating iconLinks.js...');
    
    let content = fs.readFileSync(iconLinksPath, 'utf8');
    
    // Generate import statements
    const imports = downloaded.map(pkg => {
        const varName = pkg.name.replace(/-/g, '') + 'Icon';
        return `import ${varName} from './${pkg.filename}'`;
    }).join('\n');
    
    // Find the placeholder comment and add imports after cvaIcon import
    const cvaImportLine = "import cvaIcon from './cva.png'";
    if (content.includes(cvaImportLine)) {
        content = content.replace(cvaImportLine, `${cvaImportLine}\n${imports}`);
    }
    
    // Generate techIcons entries
    const entries = downloaded.map(pkg => {
        const varName = pkg.name.replace(/-/g, '') + 'Icon';
        return `    '${pkg.name}': {
        name: '${pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1)}',
        color: '${pkg.color}',
        icon: '${pkg.icon}',
        textColor: 'text-${pkg.color.split('-')[1] || 'gray'}-${pkg.color.split('-')[2] || '500'}',
        image: ${varName}
    },`;
    }).join('\n');
    
    // Find the cva entry and add new entries after it
    const cvaEntry = `    'cva': {
        name: 'Class Variance Authority',
        color: 'bg-purple-500',
        icon: '🎛️',
        textColor: 'text-purple-500',
        image: cvaIcon
    },`;
    
    if (content.includes(cvaEntry)) {
        content = content.replace(cvaEntry, `${cvaEntry}\n${entries}`);
    }
    
    // Update getPackageIcon function with new patterns
    const newPatterns = `
    // Additional package patterns
    if (lowerName.includes('clsx')) return techIcons['clsx']
    if (lowerName.includes('lucide')) return techIcons['lucide']
    if (lowerName.includes('eslint')) return techIcons['eslint']
    if (lowerName.includes('prettier')) return techIcons['prettier']
    if (lowerName.includes('rollup')) return techIcons['rollup']
    if (lowerName.includes('lodash')) return techIcons['lodash']
    if (lowerName.includes('axios')) return techIcons['axios']
    if (lowerName.includes('zustand')) return techIcons['zustand']
    if (lowerName.includes('framer')) return techIcons['framer-motion']
    if (lowerName.includes('recharts')) return techIcons['recharts']
    if (lowerName.includes('redux')) return techIcons['redux']
    if (lowerName.includes('jest')) return techIcons['jest']
    if (lowerName.includes('vitest')) return techIcons['vitest']
    if (lowerName.includes('cypress')) return techIcons['cypress']
    if (lowerName.includes('prisma')) return techIcons['prisma']
    if (lowerName.includes('graphql')) return techIcons['graphql']
    if (lowerName.includes('storybook')) return techIcons['storybook']
    if (lowerName.includes('zod')) return techIcons['zod']
    if (lowerName.includes('socket')) return techIcons['socket-io']
    if (lowerName.includes('chart')) return techIcons['chart-js']
    if (lowerName.includes('d3')) return techIcons['d3']
    if (lowerName.includes('three')) return techIcons['three']
`;
    
    // Add before "return null"
    content = content.replace('    return null\n}', `${newPatterns}\n    return null\n}`);
    
    fs.writeFileSync(iconLinksPath, content, 'utf8');
    console.log('✅ iconLinks.js updated!\n');
}

async function main() {
    console.log('🚀 Starting automated icon update...\n');
    
    const downloaded = await downloadAllLogos();
    
    if (downloaded.length > 0) {
        updateIconLinks(downloaded);
        console.log(`✅ Successfully added ${downloaded.length} new package icons!`);
        console.log(`📁 Location: ${assetsFolder}`);
    } else {
        console.log('⚠️  No icons were downloaded');
    }
}

main();
