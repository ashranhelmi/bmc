import { chromium } from 'playwright';

const OUT = '/Users/ashranhelmi/Documents/myfiles/KOCINESS/MOBILE-APP/gvapp-web/bmc/assets/screenshots';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto('http://localhost:8000/');

// Not-started screen -> Start Session
await page.getByRole('button', { name: /start session/i }).click();

// Share screen (PIN/QR)
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/share-session.png` });

// Continue into the board
await page.getByRole('button', { name: /continue/i }).click();
await page.waitForSelector('[data-testid="board-page"]');

// See an example -> populated canvas
await page.getByRole('button', { name: /see an example/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/board-canvas.png`, fullPage: true });

// BMC framework guide dialog
await page.locator('[data-testid="bmc-guide-open"]').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/guide-diagram.png` });
await page.keyboard.press('Escape');

await browser.close();
console.log('Screenshots saved to', OUT);
