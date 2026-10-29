const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const BASE=process.env.BASE_URL||"https://nippon-map.vercel.app";
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const api=await browser.newPage();
  const response=await api.request.get(BASE+"/api/places?category=airport&prefecture="+encodeURIComponent("東京都"));
  assert(response.ok(),"Tokyo airports API");
  const payload=await response.json();
  const place=payload.places.find(p=>p.name&&p.id&&p.municipality_name&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude));
  assert(place,"Tokyo airport sample");
  await api.close();
  for(const [name,viewport] of [["desktop",{width:1440,height:900}],["mobile",{width:375,height:812}]]){
   const page=await browser.newPage({viewport});
      await page.addInitScript(()=>localStorage.setItem("nippon-map-developer-mode","1"));
    await page.route("**/api/usage",route=>route.fulfill({status:204}));
   try{
    const url=new URL("/map",BASE);
    url.searchParams.set("category","airport");
    url.searchParams.set("categories","airport,railway");
    url.searchParams.set("prefecture","東京都");
    url.searchParams.set("q",place.name);
    url.searchParams.set("city",place.municipality_name);
    url.searchParams.set("place",String(place.id));
    const res=await page.goto(url.toString(),{waitUntil:"domcontentloaded",timeout:45000});
    assert(res?.ok(),name+": shared map unavailable");
    await page.locator('input[aria-label="施設名・地域を検索"]').waitFor({timeout:30000});
    await page.waitForFunction(()=>document.querySelector('select[aria-label="都道府県で絞り込む"]')?.value==="東京都",{},{timeout:30000});
    assert.equal(await page.locator('input[aria-label="施設名・地域を検索"]').inputValue(),place.name,name+": query not restored");
    assert.equal(await page.locator('select[aria-label="都道府県で絞り込む"]').inputValue(),"東京都",name+": prefecture not restored");
    await page.waitForFunction(expected=>document.querySelector('select[aria-label="市区町村で絞り込む"]')?.value===expected,place.municipality_name,{timeout:45000});
    const detail=page.locator('aside.detail[aria-label="選択した施設の詳細"]');
    await page.waitForFunction((expected)=>document.querySelector('aside.detail[aria-label="選択した施設の詳細"]')?.textContent?.includes(expected),place.name,{timeout:45000});
    assert((await detail.innerText()).includes(place.name),name+": selected place not restored");
    const multi=page.locator('.multiCategoryControls button[aria-pressed="true"]').first();
    assert(await multi.count(),name+": multi category not restored");
    console.log(name+": shared multi-category, prefecture, city, query and place PASS");
   }finally{await page.close()}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});