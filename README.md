# Puppeteer Authentication & Cookie Saver

A standalone, configurable Node.js tool using Puppeteer to log in to websites and save session cookies to a local text file. Created for building web scrapers, automated testing, or bypass scripts that reuse active login sessions.

---

## Features

- **Interactive Login Mode (Default)**: Opens a visible browser window so you can input credentials, complete Multi-Factor Authentication (MFA), and solve CAPTCHAs manually. Once logged in, the script captures your session cookies and writes them to a file.
- **Automated Login Mode**: Performs a hands-off, automated login by typing credentials and submitting forms using CSS selectors you define.
- **Cookie Reuse Test Script**: A companion script that reads the saved cookies, injects them into a new browser page, and tests if it can successfully access a protected page without redirecting to login.

---

## Project Structure

- `package.json` — Specifies dependencies and script shortcuts.
- `auth.js` — The main authentication and cookie extraction script.
- `test-cookies.js` — The cookie verification and session recovery script.
- `cookies.json` — (Generated) The text file where Puppeteer cookies are saved.
- `proof.png` — (Generated) A screenshot captured by the test script showing successful authenticated navigation.

---

## Installation

Make sure you have Node.js installed, then install the dependencies:

```bash
npm install
```

---

## How to Use

### 1. Configure the Target Website

Open [auth.js](script_directory/puppeteer-auth/auth.js) and locate the `CONFIG` object at the top of the file:

```javascript
const CONFIG = {
  // 1. Set the URL of the login page
  loginUrl: 'https://example.com/login',

  // 2. Set the cookie storage path
  cookiePath: path.join(__dirname, 'cookies.json'),

  // 3. Select your mode: 'interactive' or 'automated'
  mode: 'interactive',
  
  // ...
```

#### Configuring Automated Mode
If using `"automated"` mode, also configure the `automated` block:
- `username` / `password`: Your login credentials.
- `usernameSelector` / `passwordSelector`: CSS selectors for the login form inputs.
- `submitSelector`: CSS selector for the submit button.
- `successSelector` / `successUrlKeyword`: Elements or URL patterns that identify when login succeeded.

---

### 2. Run the Authentication Script

Execute the script to start the login process:

```bash
npm start
```

Depending on the `mode` configured:
- **Interactive Mode**: A Chromium browser window will open. Complete the login flow manually. Once done, return to the terminal and press **[Enter]**.
- **Automated Mode**: The browser will launch, autofill the credentials, submit, and verify success automatically.

The session cookies will be saved in JSON format inside `cookies.json`.

---

### 3. Verify and Test Cookie Injection

To verify that the saved session cookies successfully restore your session without having to log in again:

1. Open [test-cookies.js](script_directory/puppeteer-auth/test-cookies.js).
2. Set the `CONFIG.protectedUrl` to a URL that requires authentication (e.g., your dashboard, user profile page, etc.).
3. Run the tester:

```bash
node test-cookies.js
```

The script will launch a headless browser, load the cookies from `cookies.json`, navigate to the protected URL, and save a screenshot (`dashboard-proof.png`) demonstrating the successful login bypass.

---

## Loading Cookies in Your Own Scripts

To load the cookies in another Puppeteer script, read the JSON file and use `page.setCookie()` before navigation:

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load and inject saved cookies
  const cookiesJson = fs.readFileSync('cookies.json', 'utf8');
  const cookies = JSON.parse(cookiesJson);
  await page.setCookie(...cookies);

  // Navigate to your protected page
  await page.goto('https://example.com/dashboard');

  // Your automation/scraping logic...
  await browser.close();
}
```
