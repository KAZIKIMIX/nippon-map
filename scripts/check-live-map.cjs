const fs = require("node:fs");
const { chromium, devices } = require("playwright");
const assert = require("node:assert/strict");
fs.mkdirSync("test-results", { recursive: true });
const BASE = process.env.BASE_URL || "https://nippon-map.vercel.app";
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [name, options] of [
      ["desktop", { viewport: { width: 1440, height: 900 } }],
      ["mobile", { ...devices["iPhone 13"], defaultBrowserType: undefined }],
    ]) {
      const page = await browser.newPage(options);
      try {
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
        await category.selectOption("railway");
        assert.equal(await category.inputValue(), "railway", name + ": category switch failed");
      } else {
        const chip = page.locator('.chips button').filter({ hasText: "鉄道駅" }).first();
        await chip.waitFor({ timeout: 10000 });
        await chip.click();
        assert.equal(await chip.getAttribute("aria-pressed"), "true", name + ": desktop category switch failed");
      }
      // Rapid category changes must settle on the final selection without stale errors.
      const categoryChoices = ["airport", "aquarium", "railway"];
      if (await category.isVisible()) {
        for (const slug of categoryChoices) await category.selectOption(slug);
        assert.equal(await category.inputValue(), "railway", name + ": rapid category switching selected the wrong category");
      } else {
        for (const slug of ["空港", "水族館", "鉄道駅"]) {
          const chip = page.locator('.chips button').filter({ hasText: slug }).first();
          await chip.click();
        }
        assert.equal(await page.locator('.chips button').filter({ hasText: "鉄道駅" }).first().getAttribute("aria-pressed"), "true", name + ": rapid category switching selected the wrong category");
      }
      const railwayResponse = await page.request.get(BASE + "/api/places?category=railway");
      assert.equal(railwayResponse.ok(), true, name + ": railway category API failed");
      const railwayPayload = await railwayResponse.json();
      assert.ok(Array.isArray(railwayPayload.places) && railwayPayload.places.length > 0, name + ": railway category returned no pins");
      assert.ok(railwayPayload.places.every(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)), name + ": railway category returned invalid pin coordinates");
      const nearbyResponse = await page.request.get(BASE + "/api/nearby?lat=35.5494&lon=139.7798&radius=5&categories=airport,railway");
      assert.equal(nearbyResponse.ok(), true, name + ": multi-category nearby API failed");
      const nearbyPayload = await nearbyResponse.json();
      assert.ok(Array.isArray(nearbyPayload.places), name + ": multi-category nearby API returned invalid data");
      assert.ok(nearbyPayload.places.every(p => ["airport", "railway"].includes(p.category_slug)), name + ": multi-category nearby API returned an unselected category");
      const invalidNearbyResponse = await page.request.get(BASE + "/api/nearby?lat=35.5494&lon=139.7798&radius=5&categories=airport,airport");
      assert.equal(invalidNearbyResponse.status(), 400, name + ": nearby API accepted duplicate categories");
      const map = page.locator(".maplibregl-map").first();
      await map.waitFor({ timeout: 15000 });
      {
        const box = await map.boundingBox();
        assert.ok(box && box.width > 100 && box.height > 100, name + ": map dimensions invalid");
        const zoomIn = page.locator(".maplibregl-ctrl-zoom-in").first();
        await zoomIn.waitFor({ timeout: 10000 });
        assert.equal(await zoomIn.isEnabled(), true, name + ": zoom control disabled");
        await zoomIn.click();
        await page.waitForTimeout(700);
        assert.equal(await zoomIn.isEnabled(), true, name + ": zoom control stopped responding");
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 5);
      assert.equal(overflow, false, name + ": horizontal overflow");
      assert.deepEqual(errors, [], name + ": JavaScript errors");
      fs.writeFileSync(`test-results/${name}-success.txt`, `${new Date().toISOString()} ${BASE} navigation/search/result/category/map/zoom/layout passed\n`);
      console.log(name + ": navigation, search result selection, category, zoom control click, layout PASS");
      } catch (error) {
        await page.screenshot({ path: `test-results/${name}-failure.png`, fullPage: true }).catch(() => {});
        fs.writeFileSync(`test-results/${name}-error.txt`, String(error?.stack || error));
        throw error;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
