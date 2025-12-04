const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const outDir = path.resolve(__dirname, '..', 'assets', 'fonts');
const outFile = path.join(outDir, 'Pacifico-Regular.ttf');
const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf';

function download(url, dest, redirects = 5) {
    return new Promise((resolve, reject) => {
        if (redirects < 0) return reject(new Error('Too many redirects'));
        const parsed = new URL(url);
        const client = parsed.protocol === 'http:' ? http : https;
        const req = client.get(parsed, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const next = new URL(res.headers.location, parsed).toString();
                res.resume(); // discard
                return resolve(download(next, dest, redirects - 1));
            }

            if (res.statusCode !== 200) {
                reject(new Error('Failed to get ' + url + ' (status ' + res.statusCode + ')'));
                return;
            }

            fs.mkdirSync(path.dirname(dest), { recursive: true });
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', (err) => reject(err));
        });

        req.on('error', (err) => reject(err));
    });
}

(async () => {
    try {
        if (fs.existsSync(outFile)) {
            console.log('Font already exists:', outFile);
            process.exit(0);
        }
        console.log('Downloading Pacifico font to', outFile);
        await download(fontUrl, outFile);
        console.log('Downloaded Pacifico font successfully');
        process.exit(0);
    } catch (err) {
        console.error('Failed to download font:', err);
        console.log('You can retry with: npm run fetch-fonts');
        // Do not fail the npm install on Windows shells — exit 0 so postinstall won't break installs.
        process.exit(0);
    }
})();
