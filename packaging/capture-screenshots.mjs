import { chromium } from 'playwright';

const OUT = '/Users/ashranhelmi/Documents/myfiles/KOCINESS/MOBILE-APP/gvapp-web/bmc/assets/screenshots';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto('http://localhost:8000/');

// Not-started screen -> Start Session
await page.getByRole('button', { name: /start session/i }).click();

// Share screen (PIN/QR) - tight crop on just the QR/PIN card itself, not
// the full mostly-empty viewport, so it's actually legible at landing-page
// thumbnail size.
await page.waitForTimeout(800);
await page.locator('[data-testid="session-pin"]').locator('xpath=ancestor::div[contains(@class,"gap-4") and contains(@class,"pt-6")]/..').screenshot({ path: `${OUT}/share-session.png` });

// Continue into the board
await page.getByRole('button', { name: /continue/i }).click();
await page.waitForSelector('[data-testid="board-page"]');
await page.waitForTimeout(500);

// Empty board — capture before "See an example" adds any notes
await page.screenshot({ path: `${OUT}/board-empty.png`, fullPage: true });

// See an example -> populated canvas
await page.getByRole('button', { name: /see an example/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/board-canvas.png`, fullPage: true });

// BMC framework guide dialog - tight crop on just the dialog box, not the
// full dimmed viewport behind it, so the diagram is actually readable.
await page.locator('[data-testid="bmc-guide-open"]').click();
await page.waitForTimeout(500);
await page.locator('.max-w-5xl').screenshot({ path: `${OUT}/guide-diagram.png` });
await page.keyboard.press('Escape');

await browser.close();
console.log('Screenshots saved to', OUT);
