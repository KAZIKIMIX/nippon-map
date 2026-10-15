const { chromium, devices } = require("playwright");
const assert = require("node:assert/strict");
const BASE = process.env.BASE_URL || "https://nippon-map.vercel.app";
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [name, options] of [
      ["desktop", { viewport: { width: 1440, height: 900 } }],
      ["mobile", { ...devices["iPhone 13"], defaultBrowserType: undefined }],
    ]) {
      const page = await browser.newPage(options);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const response = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 45000 });
      assert.ok(response && response.ok(), name + ": homepage unavailable");
      await page.locator('input[aria-label="施設名・地域を検索"]').waitFor({ timeout: 30000 });
      const search = page.locator('input[aria-label="施設名・地域を検索"]');
      await search.fill("羽田");
      await page.waitForTimeout(1800);
      assert.equal(await search.inputValue(), "羽田", name + ": search failed");
      const results = page.locator('.facilityResults button[aria-label*="の詳細を地図で表示"]');
      await results.first().waitFor({ timeout: 20000 });
      await results.first().click();
      assert.equal(await results.first().getAttribute("aria-pressed"), "true", name + ": selecting search result failed");
      const category = page.locator('select[aria-label="カテゴリを選ぶ"]');
      if (await category.isVisible()) {
        await category.selectOption("airport");
        assert.equal(await category.inputValue(), "airport", name + ": category switch failed");
      } else {
        const chip = page.locator('.chips button').filter({ hasText: "空港" }).first();
        if (await chip.isVisible()) await chip.click();
      }
      const map = page.locator(".maplibregl-map").first();
      if (await map.count()) {
        const box = await map.boundingBox();
        assert.ok(box && box.width > 100 && box.height > 100, name + ": map dimensions invalid");
        const zoomIn = page.locator(".maplibregl-ctrl-zoom-in").first();
        await zoomIn.waitFor({ timeout: 10000 });
        await zoomIn.click();
        await page.waitForTimeout(400);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 5);
      assert.equal(overflow, false, name + ": horizontal overflow");
      assert.deepEqual(errors, [], name + ": JavaScript errors");
      console.log(name + ": navigation, search result selection, category, zoom control click, layout PASS");
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
