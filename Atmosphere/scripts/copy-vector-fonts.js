const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'node_modules', 'react-native-vector-icons', 'Fonts');
const dst = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'fonts');

function copyFonts() {
    if (!fs.existsSync(src)) {
        console.error('Source fonts folder not found:', src);
        process.exit(1);
    }
    fs.mkdirSync(dst, { recursive: true });
    const files = fs.readdirSync(src).filter(f => f.toLowerCase().endsWith('.ttf'));
    files.forEach((f) => {
        const srcFile = path.join(src, f);
        const dstFile = path.join(dst, f);
        try {
            fs.copyFileSync(srcFile, dstFile);
            // console.log('Copied', f);
        } catch (err) {
            console.error('Failed to copy', f, err.message || err);
        }
    });
    // console.log('Done. Please rebuild the Android app to include the fonts.');
}

copyFonts();
