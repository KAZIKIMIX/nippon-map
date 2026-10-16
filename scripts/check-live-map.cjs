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
      const response = await page.goto(BASE + (BASE.includes("?") ? "&" : "?") + "e2e=1", { waitUntil: "domcontentloaded", timeout: 45000 });
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
      await page.waitForFunction(() => window.__nipponMapE2E?.getZoom() >= 12, undefined, { timeout: 15000 });
      const selectedMapCenter = await page.evaluate(() => { const m = window.__nipponMapE2E; return m ? { lng: m.getCenter().lng, lat: m.getCenter().lat, zoom: m.getZoom() } : null; });
      assert.ok(selectedMapCenter, name + ": map instance unavailable after search selection");
      const detail = page.locator('aside.detail[aria-label="選択した施設の詳細"]');
      assert.ok(await detail.isVisible(), name + ": selected facility detail panel is hidden");
      assert.ok((await detail.innerText()).trim().length > 10, name + ": selected facility details are empty");

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
      await page.waitForFunction(() => { const loading = document.querySelector(".mapbox [role=status]"); const selected = document.querySelector('select[aria-label="カテゴリを選ぶ"]'); const railwayChip = [...document.querySelectorAll(".chips button")].find(button => button.textContent?.includes("鉄道駅")); return !loading && (selected && getComputedStyle(selected).display !== "none" ? selected.value === "railway" : railwayChip?.getAttribute("aria-pressed") === "true"); }, undefined, { timeout: 45000 });
      assert.equal(await page.locator(".mapbox [role=alert]").count(), 0, name + ": map displays an error after rapid category switching");
      const mapErrorText = await page.locator(".error").allInnerTexts();
      assert.ok(!mapErrorText.some(text => /地図の読み込みに失敗|施設データを取得できません/.test(text)), name + ": map or facility data load error");
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
      // Twelve independent negative API checks: malformed filters must not broaden pin results.
      const invalidNearbyCases = [
        [
                "missing latitude",
                "/api/nearby?lon=139.7798&radius=5"
        ],
        [
                "missing longitude",
                "/api/nearby?lat=35.5494&radius=5"
        ],
        [
                "empty latitude",
                "/api/nearby?lat=&lon=139.7798&radius=5"
        ],
        [
                "non-numeric latitude",
                "/api/nearby?lat=abc&lon=139.7798&radius=5"
        ],
        [
                "out-of-range latitude",
                "/api/nearby?lat=91&lon=139.7798&radius=5"
        ],
        [
                "out-of-range longitude",
                "/api/nearby?lat=35.5494&lon=181&radius=5"
        ],
        [
                "unsupported radius",
                "/api/nearby?lat=35.5494&lon=139.7798&radius=100"
        ],
        [
                "empty category",
                "/api/nearby?lat=35.5494&lon=139.7798&radius=5&category="
        ],
        [
                "unknown category",
                "/api/nearby?lat=35.5494&lon=139.7798&radius=5&category=not-real"
        ],
        [
                "mixed category parameters",
                "/api/nearby?lat=35.5494&lon=139.7798&radius=5&category=airport&categories=railway"
        ],
        [
                "duplicate latitude parameters",
                "/api/nearby?lat=35.5494&lat=35.6&lon=139.7798&radius=5"
        ],
        [
                "more than eight categories",
                "/api/nearby?lat=35.5494&lon=139.7798&radius=5&categories=airport,railway,aquarium,zoo,park,library,toilet,museum,castle"
        ]
];
      for (const [label, path] of invalidNearbyCases) {
        const res = await page.request.get(BASE + path);
        assert.equal(res.status(), 400, name + ": nearby API accepted " + label);
      }
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
      // Inspect the real MapLibre instance and verify pin/cluster rendering and expansion.
      await page.waitForFunction(() => {
        const m = window.__nipponMapE2E;
        return m && m.isStyleLoaded() && m.getSource("places") && m.getLayer("clusters") && m.getLayer("unclustered");
      }, undefined, { timeout: 30000 });
      await page.waitForFunction(() => {
        const m = window.__nipponMapE2E;
        return m && m.querySourceFeatures("places").length > 0;
      }, { timeout: 45000 });
      const mapState = await page.evaluate(() => {
        const m = window.__nipponMapE2E;
        const features = m.querySourceFeatures("places");
        return { zoom: m.getZoom(), sourceCount: features.length, clusterCount: features.filter(f => f.properties?.cluster).length, pinCount: features.filter(f => !f.properties?.cluster).length };
      });
      assert.ok(mapState.sourceCount > 0, name + ": map source has no pins or clusters");
      assert.ok(mapState.clusterCount + mapState.pinCount > 0, name + ": map source contains no renderable features");
      await page.evaluate(async () => {
        const m = window.__nipponMapE2E;
        m.stop();
        m.jumpTo({ center: [137.5, 37.2], zoom: 4.2 });
        await new Promise(resolve => m.once("idle", resolve));
      });
      const cluster = await page.evaluate(() => {
        const m = window.__nipponMapE2E;
        const clusters = m.queryRenderedFeatures({ layers: ["clusters"] });
        if (!clusters.length) return null;
        const f = clusters[0];
        const coordinates = f.geometry.coordinates;
        const point = m.project(coordinates);
        return { x: point.x, y: point.y, zoom: m.getZoom() };
      });
      assert.ok(cluster, name + ": no visible cluster to expand");
      await page.locator(".maplibregl-canvas").first().click({ position: { x: cluster.x, y: cluster.y }, force: true });
      await page.waitForFunction(previousZoom => window.__nipponMapE2E.getZoom() > previousZoom + 0.2, cluster.zoom, { timeout: 15000 });
      await page.evaluate(async () => {
        const m = window.__nipponMapE2E;
        m.stop();
        m.jumpTo({ center: [139.7798, 35.5494], zoom: 14.5 });
        await new Promise(resolve => m.once("idle", resolve));
      });
      const pin = await page.evaluate(() => {
        const m = window.__nipponMapE2E;
        const features = m.queryRenderedFeatures({ layers: ["unclustered"] });
        if (!features.length) return null;
        const point = m.project(features[0].geometry.coordinates);
        return { x: point.x, y: point.y, id: Number(features[0].properties.id) };
      });
      assert.ok(pin, name + ": no visible pin to select");
      await page.locator(".maplibregl-canvas").first().click({ position: { x: pin.x, y: pin.y - 8 }, force: true });
      await page.waitForFunction(id => { const detail = document.querySelector('aside.detail'); return detail?.textContent?.trim().length > 10 && document.querySelector('.maplibregl-map'); }, pin.id, { timeout: 15000 });
      await page.screenshot({ path: `test-results/${name}-map.png`, fullPage: true });
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
