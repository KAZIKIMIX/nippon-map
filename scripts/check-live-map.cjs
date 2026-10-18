const fs = require("node:fs");
const { chromium, devices } = require("playwright");
const assert = require("node:assert/strict");
fs.mkdirSync("test-results", { recursive: true });
const BASE = process.env.BASE_URL || "https://nippon-map.vercel.app";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const [name, options] of [
      ["desktop", { viewport: { width: 1440, height: 900 } }],
      ["mobile", { ...devices["iPhone 13"], defaultBrowserType: undefined }],
      ["mobile-375", { ...devices["iPhone 13"], viewport: { width: 375, height: 812 }, defaultBrowserType: undefined }],
      ["mobile-430", { ...devices["iPhone 13"], viewport: { width: 430, height: 932 }, defaultBrowserType: undefined }],
      ["tablet-768", { ...devices["iPhone 13"], viewport: { width: 768, height: 1024 }, defaultBrowserType: undefined }],
    ].filter(([name]) => process.env.DESKTOP_ONLY !== "1" || name === "desktop")) {
      const page = await browser.newPage(options);
      try {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const landingResponse = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 45000 });
      assert.ok(landingResponse?.ok(), name + ": landing page unavailable");
      assert.ok(await page.locator('a[href^="/map"]').count() > 0, name + ": landing map entry missing");
      const target = new URL(BASE); target.pathname = "/map"; target.searchParams.set("e2e", "1");
      const response = await page.goto(target.toString(), { waitUntil: "domcontentloaded", timeout: 45000 });
      assert.ok(response && response.ok(), name + ": homepage unavailable");
      await page.locator('input[aria-label="施設名・地域を検索"]').waitFor({ timeout: 30000 });
      const search = page.locator('input[aria-label="施設名・地域を検索"]');
      await page.waitForFunction(() => { const input = document.querySelector('input[aria-label="施設名・地域を検索"]'); return input && !input.disabled && window.__nipponMapE2E; }, undefined, { timeout: 30000 });
      await search.fill("羽田");
      await page.waitForTimeout(1800);
      assert.equal(await search.inputValue(), "羽田", name + ": search failed");
      const results = page.locator('.facilityResults button[aria-label*="の詳細を地図で表示"]');
      await results.first().waitFor({ timeout: 20000 });
      await results.first().click();
      assert.equal(await results.first().getAttribute("aria-pressed"), "true", name + ": selecting search result failed");
      await page.waitForFunction(() => window.__nipponMapE2E?.getZoom() >= 12, undefined, { timeout: 15000 });
      console.log(name + ": search selection and facility zoom PASS");
      const selectedMapCenter = await page.evaluate(() => { const m = window.__nipponMapE2E; return m ? { lng: m.getCenter().lng, lat: m.getCenter().lat, zoom: m.getZoom() } : null; });
      assert.ok(selectedMapCenter, name + ": map instance unavailable after search selection");
      const detail = page.locator('aside.detail[aria-label="選択した施設の詳細"]');
      assert.ok(await detail.isVisible(), name + ": selected facility detail panel is hidden");
      assert.ok((await detail.innerText()).trim().length > 10, name + ": selected facility details are empty");
      const googleHref = await detail.locator('a[href^="https://www.google.com/maps/search/"]').getAttribute("href");
      const [latitude, longitude] = new URL(googleHref).searchParams.get("query").split(",").map(Number);
      const visibleSelectedPoint = await page.evaluate(({ latitude, longitude }) => {
        const m = window.__nipponMapE2E;
        const point = m.project([longitude, latitude]);
        const canvas = m.getCanvas();
        return point.x >= 0 && point.y >= 0 && point.x <= canvas.clientWidth && point.y <= canvas.clientHeight;
      }, { latitude, longitude });
      assert.ok(visibleSelectedPoint, name + ": selected facility is outside the map viewport");

      // Verify a real facility official link opens the expected external URL in a browser tab.
      let officialLink = detail.getByRole("link", { name: "公式サイトを見る ↗" });
      if (await officialLink.count() === 0) {
        const candidates = await results.count();
        for (let index = 1; index < Math.min(candidates, 12); index++) {
          await results.nth(index).click();
          if (await officialLink.count() > 0) break;
        }
      }
      assert.ok(await officialLink.count() > 0, name + ": no official URL found among Haneda search results");
      const officialHref = await officialLink.getAttribute("href");
      const officialParsed = new URL(officialHref);
      assert.ok(["https:", "http:"].includes(officialParsed.protocol) && officialParsed.hostname.includes("."), name + ": invalid official URL");
      assert.equal(await officialLink.getAttribute("target"), "_blank", name + ": official link should open in new tab");
      const [officialPopup] = await Promise.all([
        page.waitForEvent("popup", { timeout: 15000 }),
        officialLink.click(),
      ]);
      await officialPopup.waitForLoadState("domcontentloaded", { timeout: 20000 }).catch(() => {});
      assert.equal(new URL(officialPopup.url()).origin, officialParsed.origin, name + ": official link opened unexpected origin");
      await officialPopup.close();
      console.log(name + ": official URL and browser popup navigation PASS");
      await page.getByRole("button", { name: "施設の詳細を閉じる", exact: true }).click();
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
      const categoryChoices = name === "desktop"
        ? ["airport", "aquarium", "railway", "park", "toilet", "library", "airport", "railway", "aquarium", "airport", "railway"]
        : ["airport", "aquarium", "railway"];
      const categoryLabels = { airport: "空港", aquarium: "水族館", railway: "鉄道駅", park: "公園", toilet: "公衆トイレ", library: "図書館" };
      if (await category.isVisible()) {
        for (const slug of categoryChoices) await category.selectOption(slug);
        assert.equal(await category.inputValue(), "railway", name + ": rapid category switching selected the wrong category");
      } else {
        for (const slug of categoryChoices) {
          const chip = page.locator('.chips button').filter({ hasText: categoryLabels[slug] }).first();
          await chip.click();
        }
        assert.equal(await page.locator('.chips button').filter({ hasText: "鉄道駅" }).first().getAttribute("aria-pressed"), "true", name + ": rapid category switching selected the wrong category");
      }
      await page.waitForFunction(() => { const loading = [...document.querySelectorAll(".mapbox [role=status]")].some(el => el.textContent?.includes("施設データを読み込み中")); const selected = document.querySelector('select[aria-label="カテゴリを選ぶ"]'); const railwayChip = [...document.querySelectorAll(".chips button")].find(button => button.textContent?.includes("鉄道駅")); return !loading && (selected && getComputedStyle(selected).display !== "none" ? selected.value === "railway" : railwayChip?.getAttribute("aria-pressed") === "true"); }, undefined, { timeout: 45000 });
      assert.equal(await page.locator(".mapbox [role=alert]").count(), 0, name + ": map displays an error after rapid category switching");
      const mapErrorText = await page.locator(".error").allInnerTexts();
      assert.ok(!mapErrorText.some(text => /地図の読み込みに失敗|施設データを取得できません/.test(text)), name + ": map or facility data load error");
      // Regression: changing category at a high zoom must refresh the actual MapLibre source.
      await page.evaluate(() => window.__nipponMapE2E.jumpTo({center:[139.7798,35.5494],zoom:13}));
      if (await category.isVisible()) {
        await category.selectOption("airport");
      } else {
        await page.locator('.chips button').filter({hasText:"空港"}).first().click();
      }
      try {
      await page.waitForFunction(() => {
        const map=window.__nipponMapE2E;
        const selected=document.querySelector('select[aria-label="カテゴリを選ぶ"]');
        const chip=[...document.querySelectorAll('.chips button')].find(b=>b.textContent?.includes("空港"));
        const active=selected&&getComputedStyle(selected).display!=="none"?selected.value==="airport":chip?.getAttribute("aria-pressed")==="true";
        const loading=[...document.querySelectorAll(".mapbox [role=status]")].some(e=>e.textContent?.includes("施設データを読み込み中"));
        return map&&map.getZoom()>=12&&active&&!loading&&map.getSource("places")&&map.querySourceFeatures("places").some(f=>!f.properties?.cluster&&f.properties?.category==="airport");
      },undefined,{timeout:45000});
      } catch (error) {
        const snapshot=await page.evaluate(()=>{const m=window.__nipponMapE2E;const f=m?.querySourceFeatures("places")||[];return {zoom:m?.getZoom(),select:document.querySelector('select[aria-label="カテゴリを選ぶ"]')?.value,pressed:[...document.querySelectorAll(".chips button[aria-pressed=true]")].map(e=>e.textContent?.trim()),categories:[...new Set(f.map(x=>x.properties?.category))],features:f.length,alerts:[...document.querySelectorAll(".mapbox [role=alert]")].map(e=>e.textContent),loading:[...document.querySelectorAll(".mapbox [role=status]")].map(e=>e.textContent)}});
        throw new Error(name+": high-zoom category timeout "+JSON.stringify(snapshot),{cause:error});
      }
      const categoryDebug=await page.evaluate(()=>{const m=window.__nipponMapE2E;const features=m?.querySourceFeatures("places")||[];return {zoom:m?.getZoom(),selected:document.querySelector('select[aria-label="カテゴリを選ぶ"]')?.value,pressed:[...document.querySelectorAll(".chips button[aria-pressed=true]")].map(x=>x.textContent?.trim()),featureCount:features.length,categoryCounts:features.reduce((a,f)=>{const k=f.properties?.cluster?"cluster":f.properties?.category||"unknown";a[k]=(a[k]||0)+1;return a},{}),alerts:[...document.querySelectorAll(".mapbox [role=alert]")].map(x=>x.textContent),loading:[...document.querySelectorAll(".mapbox [role=status]")].map(x=>x.textContent)}});
      console.log(name+": high-zoom category diagnostic "+JSON.stringify(categoryDebug));
      assert.equal(await page.locator(".mapbox [role=alert]").count(),0,name+": category switch after zoom raised error");
      const afterZoom=await page.evaluate(()=>({zoom:window.__nipponMapE2E.getZoom(),features:window.__nipponMapE2E.querySourceFeatures("places").filter(f=>!f.properties?.cluster&&f.properties?.category==="airport").length,stale:window.__nipponMapE2E.querySourceFeatures("places").filter(f=>!f.properties?.cluster&&f.properties?.category!=="airport").length}));
      assert.ok(afterZoom.zoom>=12&&afterZoom.features>0,name+": category switch after zoom lost pins");
      assert.equal(afterZoom.stale,0,name+": stale pins from another category remain after zoom switch");
      console.log(name+": high-zoom category change and MapLibre pins PASS");
      if (await category.isVisible()) await category.selectOption("railway");
      else await page.locator('.chips button').filter({hasText:"鉄道駅"}).first().click();
      await page.waitForFunction(() => [...document.querySelectorAll(".mapbox [role=status]")].every(e=>!e.textContent?.includes("施設データを読み込み中")),undefined,{timeout:45000});
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
        const previousZoom = await page.evaluate(() => window.__nipponMapE2E.getZoom());
        await zoomIn.click();
        await page.waitForFunction(previous => window.__nipponMapE2E.getZoom() > previous + 0.2, previousZoom, { timeout: 15000 });
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
      }, undefined, { timeout: 45000 });
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
        const canvas = m.getCanvas();
        const rect = canvas.getBoundingClientRect();
        const f = clusters.find(feature => {
          const point = m.project(feature.geometry.coordinates);
          return document.elementFromPoint(rect.left + point.x, rect.top + point.y) === canvas;
        });
        if (!f) return null;
        const coordinates = f.geometry.coordinates;
        const point = m.project(coordinates);
        return { x: point.x, y: point.y, zoom: m.getZoom() };
      });
      assert.ok(cluster, name + ": no visible cluster to expand");
      const canvasLocator = page.locator(".maplibregl-canvas").first();
      if (options.isMobile) await canvasLocator.tap({ position: { x: cluster.x, y: cluster.y } });
      else await canvasLocator.click({ position: { x: cluster.x, y: cluster.y } });
      await page.waitForFunction(previousZoom => window.__nipponMapE2E.getZoom() > previousZoom + 0.2, cluster.zoom, { timeout: 15000 });
      // Center an actual station and zoom beyond clusterMaxZoom, including on narrow screens.
      const pinTarget = railwayPayload.places.reduce((nearest, place) => {
        const distance = p => (p.longitude - 139.7798) ** 2 + (p.latitude - 35.5494) ** 2;
        return !nearest || distance(place) < distance(nearest) ? place : nearest;
      }, null);
      assert.ok(pinTarget, name + ": railway pin target missing");
      await page.evaluate(async target => {
        const m = window.__nipponMapE2E;
        m.stop();
        m.jumpTo({ center: [target.longitude, target.latitude], zoom: 16 });
        await new Promise(resolve => m.once("idle", resolve));
      }, pinTarget);
      const pin = await page.evaluate(() => {
        const m = window.__nipponMapE2E;
        const features = m.queryRenderedFeatures({ layers: ["unclustered"] });
        if (!features.length) return null;
        const point = m.project(features[0].geometry.coordinates);
        const y = point.y - 8;
        const ids = m.queryRenderedFeatures([point.x, y], { layers: ["unclustered"] }).map(f => Number(f.properties.id));
        return { x: point.x, y, ids };
      });
      assert.ok(pin, name + ": no visible pin to select");
      const pinNames = railwayPayload.places.filter(p => pin.ids.includes(p.id)).map(p => p.name);
      assert.ok(pinNames.length > 0, name + ": rendered pin does not match railway API data");
      if (options.isMobile) await canvasLocator.tap({ position: { x: pin.x, y: pin.y } });
      else await canvasLocator.click({ position: { x: pin.x, y: pin.y } });
      await page.waitForFunction(names => names.includes(document.querySelector("aside.detail h2")?.textContent), pinNames, { timeout: 15000 });
      console.log(name + ": rendered pin selection and cluster expansion PASS");
      await page.getByRole("button", { name: "施設の詳細を閉じる", exact: true }).click();
      // Exercise region selection using visible controls, then pan the actual canvas.
      await page.getByRole("combobox", { name: "都道府県で絞り込む" }).selectOption("東京都");
      await page.waitForFunction(() => { const m = window.__nipponMapE2E; return m.getZoom() > 6 && m.getZoom() <= 11.1 && !m.isMoving(); }, undefined, { timeout: 30000 });
      await page.getByRole("combobox", { name: "市区町村で絞り込む" }).waitFor();
      const canvasBox = await canvasLocator.boundingBox();
      const centerBeforePan = await page.evaluate(() => window.__nipponMapE2E.getCenter().lng);
      await page.mouse.move(canvasBox.x + canvasBox.width * .5, canvasBox.y + canvasBox.height * .6);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + canvasBox.width * .65, canvasBox.y + canvasBox.height * .6, { steps: 12 });
      await page.mouse.up();
      await page.waitForFunction(previous => Math.abs(window.__nipponMapE2E.getCenter().lng - previous) > .0001, centerBeforePan, { timeout: 10000 });
      // Simulate one failed search request in this browser only, then retry against production.
      await page.route("**/api/search?*", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "検証用の一時的な検索エラー" }) }));
      await search.fill("東京駅");
      await page.getByRole("button", { name: "再検索する", exact: true }).waitFor({ timeout: 20000 });
      await page.unroute("**/api/search?*");
      await page.getByRole("button", { name: "再検索する", exact: true }).click();
      await results.first().waitFor({ timeout: 20000 });
      assert.ok((await results.first().getAttribute("aria-label")).includes("東京駅"), name + ": search did not recover after retry");
      await search.fill("");
      console.log(name + ": prefecture, map drag, API error and retry PASS");
      {
        await page.getByRole("button", { name: "＋ 複数カテゴリを選択", exact: true }).click();
        await page.locator(".chips button").filter({ hasText: "空港" }).first().click();
        await page.waitForFunction(() => {
          const data = window.__nipponMapE2E.getSource("places").serialize().data;
          return typeof data === "object" && data.features?.some(f => f.properties.category === "airport") && data.features?.some(f => f.properties.category === "railway");
        }, undefined, { timeout: 45000 });
        assert.equal(await page.locator(".chips button").filter({ hasText: "空港" }).first().getAttribute("aria-pressed"), "true");
        assert.equal(await page.locator(".chips button").filter({ hasText: "鉄道駅" }).first().getAttribute("aria-pressed"), "true");
        console.log(name + ": multiple category pins PASS");
      }

      await page.screenshot({ path: `test-results/${name}-map.png`, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 5);
      assert.equal(overflow, false, name + ": horizontal overflow");
      assert.deepEqual(errors, [], name + ": JavaScript errors");
      fs.writeFileSync(`test-results/${name}-success.txt`, `${new Date().toISOString()} ${BASE} navigation/search/result/category/map/zoom/layout passed\n`);
      console.log(name + ": navigation, search result selection, category, zoom control click, layout PASS");
      } catch (error) {
        await page.screenshot({ path: `test-results/${name}-failure.png`, fullPage: true }).catch(() => {});
        fs.writeFileSync(`test-results/${name}-error.txt`, String(error?.stack || error));
        failures.push({ name, error: String(error?.stack || error) });
      } finally {
        await page.close();
      }
    }
    assert.deepEqual(failures, [], "Desktop/mobile browser verification failures");
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });

