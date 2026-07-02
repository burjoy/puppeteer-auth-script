/**
 * Puppeteer Authentication Script
 *
 * This script automates logging into a website and saves the resulting session cookies
 * to a text file (JSON format) so they can be reused in future scrapers or automations.
 *
 * It supports:
 * 1. Interactive Login (opens browser, waits for user to log in manually - best for CAPTCHA/MFA)
 * 2. Automated Login (uses credentials and CSS selectors)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Config Setup
const CONFIG = {
  // The URL of the login page
  loginUrl: 'https://example.com',

  // Path to save the cookies file
  cookiePath: path.join(__dirname, 'cookies.json'),

  // Login Mode: 'interactive' or 'automated'
  mode: 'interactive',

  // Automated Mode Settings, use  with 'automated' in mode
  automated: {
    username: 'your-username-or-email',
    password: 'your-password',
    usernameSelector: '#username', // CSS selector for username/email input
    passwordSelector: '#password', // CSS selector for password input
    submitSelector: 'button[type="submit"]', // CSS selector for the login button
    successSelector: '#dashboard', // CSS selector that appears only after a successful login
    successUrlKeyword: 'dashboard', // Keyword in the URL that indicates successful login
  },

  // Puppeteer launch configurations
  puppeteer: {
    headless: false, // Must be false for interactive mode
    defaultViewport: null,
    args: [
      '--disable-blink-features=AutomationControlled', // Hides the navigator.webdriver property
      '--start-maximized'
    ]
  }
};

/**
 * Prompt the user in the terminal and wait for a response
 */
function promptUser(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

/**
 * Main execution
 */
async function main() {
  console.log('====================================================');
  console.log('      PUPPETEER AUTHENTICATION & COOKIE SAVER      ');
  console.log('====================================================\n');

  console.log(`[Config] Target URL: ${CONFIG.loginUrl}`);
  console.log(`[Config] Mode: ${CONFIG.mode.toUpperCase()}`);
  console.log(`[Config] Saving cookies to: ${CONFIG.cookiePath}\n`);

  if (CONFIG.mode === 'interactive' && CONFIG.puppeteer.headless) {
    console.warn('[Warning] Interactive mode requires headless: false. Forcing headless: false.');
    CONFIG.puppeteer.headless = false;
  }

  console.log('[Status] Launching browser...');
  const browser = await puppeteer.launch(CONFIG.puppeteer);
  const page = await browser.newPage();

  try {
    // Set a User-Agent for F5 WAF blocks (HeadlessChrome)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // Remove the navigator.webdriver property
    await page.evaluateOnNewDocument(() => {
      delete navigator.__proto__.webdriver;
    });

    console.log(`[Status] Navigating to ${CONFIG.loginUrl}...`);
    await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle2' });

    if (CONFIG.mode === 'interactive') {
      console.log('\n------------------ ACTION REQUIRED ------------------');
      console.log('1. A browser window has opened.');
      console.log('2. Please perform the login process manually (credentials, MFA, CAPTCHAs).');
      console.log('3. Once you are successfully logged in and the page loads, return here.');
      console.log('-----------------------------------------------------\n');

      await promptUser('Press [Enter] in this terminal once you have successfully logged in to save the cookies...');

    } else if (CONFIG.mode === 'automated') {
      console.log('[Status] Starting automated login flow...');
      
      // Wait for the inputs to render
      await page.waitForSelector(CONFIG.automated.usernameSelector, { timeout: 15000 });
      await page.waitForSelector(CONFIG.automated.passwordSelector, { timeout: 15000 });

      // Fill in credentials (if needed)
      console.log('[Status] Typing credentials...');
      await page.type(CONFIG.automated.usernameSelector, CONFIG.automated.username, { delay: 50 });
      await page.type(CONFIG.automated.passwordSelector, CONFIG.automated.password, { delay: 50 });

      // Click submit
      console.log('[Status] Clicking submit...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
          console.log('[Status] Navigation wait timed out, proceeding to check selector/URL...');
        }),
        page.click(CONFIG.automated.submitSelector)
      ]);

      // Wait for success indicator (either selector or URL keyword)
      console.log('[Status] Verifying login success...');
      
      const successSelectorPromise = page.waitForSelector(CONFIG.automated.successSelector, { timeout: 20000 })
        .then(() => true)
        .catch(() => false);
        
      const successUrlPromise = page.waitForFunction(
        (keyword) => window.location.href.includes(keyword),
        { timeout: 20000 },
        CONFIG.automated.successUrlKeyword
      ).then(() => true).catch(() => false);

      const [selectorMatched, urlMatched] = await Promise.all([successSelectorPromise, successUrlPromise]);

      if (!selectorMatched && !urlMatched) {
        throw new Error('Failed to verify successful login. Success selector or URL keyword was not detected.');
      }

      console.log('[Status] Login verified successfully!');
    } else {
      throw new Error(`Unsupported mode: ${CONFIG.mode}`);
    }

    // Retrieve cookies
    console.log('[Status] Extracting cookies...');
    const cookies = await page.cookies();
    
    if (cookies.length === 0) {
      console.warn('[Warning] No cookies were found! Check if you logged in successfully.');
    } else {
      console.log(`[Status] Retrieved ${cookies.length} cookies.`);
    }

    // Format cookies as formatted JSON
    const cookieData = JSON.stringify(cookies, null, 2);

    // Save to file
    fs.writeFileSync(CONFIG.cookiePath, cookieData, 'utf-8');
    console.log(`\n[Success] Cookies saved successfully to:\n--> ${CONFIG.cookiePath}\n`);

  } catch (error) {
    console.error('\n[Error] Authentication process failed:');
    console.error(error.message);
  } finally {
    console.log('[Status] Closing browser...');
    await browser.close();
    console.log('[Status] Done.');
  }
}

// Run the script
main();
