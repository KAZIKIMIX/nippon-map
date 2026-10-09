const fs=require("node:fs");const assert=require("node:assert/strict");
const text=fs.readFileSync("components/PrefectureMap.tsx","utf8");
const order=fs.readFileSync("lib/guide-categories.ts","utf8");
const match=order.match(/prefectureOrder="([^"]+)"\.split\(" "\)/);
assert.ok(match,"prefecture order missing");const prefectures=match[1].split(" ");
assert.equal(prefectures.length,47);assert.equal(prefectures[39],"福岡県");assert.equal(prefectures[40],"佐賀県");
assert.ok(text.includes("south:prefectureOrder.slice(39)"),"Kyushu region must include Fukuoka");
assert.ok(text.includes("normalizedQuery?prefectureOrder:regionNames"),"Prefecture search must not be limited to zoom region");
console.log("Region boundaries and cross-region search verified");
