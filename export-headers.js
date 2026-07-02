/**
 * Katana Headers Exporter
 *
 * This script reads the saved cookies from cookies.json and generates a
 * standard HTTP headers text file (headers.txt) compatible with ProjectDiscovery's Katana.
 *
 * It combines the cookies into a single "Cookie" header and injects a
 * realistic "User-Agent" header to bypass Web Application Firewalls (WAF).
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  cookiePath: path.join(__dirname, 'cookies.json'),
  headersPath: path.join(__dirname, 'headers.txt'),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

function main() {
  console.log('====================================================');
  console.log('            KATANA HEADERS EXPORTER                 ');
  console.log('====================================================\n');

  if (!fs.existsSync(CONFIG.cookiePath)) {
    console.error(`[Error] Cookies file not found at: ${CONFIG.cookiePath}`);
    console.error('Please run the authentication script (auth.js) first to generate it.');
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(CONFIG.cookiePath, 'utf-8');
    const cookies = JSON.parse(rawData);

    if (cookies.length === 0) {
      console.warn('[Warning] The cookies.json file is empty.');
      process.exit(1);
    }

    // Combine cookies into format: name1=value1; name2=value2
    const cookieString = cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');

    // Construct the headers file contents
    const headerLines = [
      `Cookie: ${cookieString}`,
      `User-Agent: ${CONFIG.userAgent}`
    ];

    // Write to headers.txt
    fs.writeFileSync(CONFIG.headersPath, headerLines.join('\n'), 'utf-8');

    console.log(`[Success] Successfully exported headers to:\n--> ${CONFIG.headersPath}\n`);
    console.log('----------------------------------------------------');
    console.log('To run Katana with these credentials, use:');
    console.log(`katana -u https://depok.go.id -H "${CONFIG.headersPath}"`);
    console.log('----------------------------------------------------');

  } catch (error) {
    console.error('[Error] Failed to export headers:');
    console.error(error.message);
  }
}

main();
