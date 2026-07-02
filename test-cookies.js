/**
 * Puppeteer Cookie Tester Script
 *
 * This script reads the saved cookies from cookies.json,
 * injects them into a new Puppeteer browser instance, and attempts
 * to access a protected page to verify that session reuse works.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Config Setup
const CONFIG = {
  // The URL of the protected page (e.g. dashboard, profile, or the main app page)
  protectedUrl: 'https://example.com',

  // Path to load the cookies from
  cookiePath: path.join(__dirname, 'cookies.json'),

  // Screenshot to save as proof of successful authentication bypass
  screenshotPath: path.join(__dirname, 'page-proof.png'),

  // Puppeteer launch configurations
  puppeteer: {
    headless: false, // Run headfully to match the auth context and bypass WAF detection
    defaultViewport: null,
    args: [
      '--disable-blink-features=AutomationControlled', // Hides the navigator.webdriver property
      '--start-maximized'
    ]
  }
};

async function main() {
  console.log('====================================================');
  console.log('            PUPPETEER COOKIE REUSE TESTER            ');
  console.log('====================================================\n');

  // Check if cookies file exists
  if (!fs.existsSync(CONFIG.cookiePath)) {
    console.error(`[Error] Cookies file not found at: ${CONFIG.cookiePath}`);
    console.error('Please run the authentication script (auth.js) first to generate it.');
    process.exit(1);
  }

  console.log(`[Status] Reading cookies from: ${CONFIG.cookiePath}`);
  let cookies;
  try {
    const rawData = fs.readFileSync(CONFIG.cookiePath, 'utf-8');
    cookies = JSON.parse(rawData);
    console.log(`[Status] Loaded ${cookies.length} cookies.`);
  } catch (error) {
    console.error('[Error] Failed to read or parse cookies file:');
    console.error(error.message);
    process.exit(1);
  }

  console.log('[Status] Launching browser...');
  const browser = await puppeteer.launch(CONFIG.puppeteer);
  const page = await browser.newPage();

  try {
    // WAF Evasions
    // Set a User-Agent to evade F5 WAF blocks (HeadlessChrome)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // Remove the navigator.webdriver property
    await page.evaluateOnNewDocument(() => {
      delete navigator.__proto__.webdriver;
    });

    // Set cookies into the browser page context
    console.log('[Status] Injecting cookies into browser session...');
    await page.setCookie(...cookies);

    console.log(`[Status] Navigating to protected page: ${CONFIG.protectedUrl}...`);
    // Navigate to the protected page
    await page.goto(CONFIG.protectedUrl, { waitUntil: 'networkidle2' });

    console.log('[Status] Page loaded. Extracting status...');
    const currentUrl = page.url();
    const pageTitle = await page.title();

    console.log(`[Result] Current URL: ${currentUrl}`);
    console.log(`[Result] Page Title: ${pageTitle}`);

    // If it redirected back to a login/auth page, it means the cookies were invalid/expired
    if (currentUrl.includes('login') || currentUrl.includes('signin')) {
      console.warn('\n[Warning] Redirect detected. The cookies might have expired or are invalid for this page.');
    } else {
      console.log('\n[Success] Session successfully restored! You bypassed the login screen.');
      
      // Capture a screenshot as visual proof
      console.log(`[Status] Capturing screenshot as proof to: ${CONFIG.screenshotPath}`);
      await page.screenshot({ path: CONFIG.screenshotPath, fullPage: false });
    }

  } catch (error) {
    console.error('\n[Error] Test execution failed:');
    console.error(error.message);
  } finally {
    console.log('[Status] Closing browser...');
    await browser.close();
    console.log('[Status] Done.');
  }
}

// Run the script
main();
