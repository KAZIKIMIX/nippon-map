const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');
const exported={};new Function('exports',ts.transpileModule(fs.readFileSync('lib/guide-categories.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(exported);
test('map prefectures use all 47 north-to-south prefectures without a network dependency',()=>{
 const expected='北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県'.split(' ');
 assert.deepEqual(exported.prefectureOrder,expected);assert.equal(new Set(expected).size,47);
 const source=ts.createSourceFile('MapApp.tsx',fs.readFileSync('components/MapApp.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let initializer;
 function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(source)==='prefectureOptions')initializer=n.initializer.getText(source);ts.forEachChild(n,visit);}visit(source);assert.equal(initializer,'prefectureOrder');
 assert.ok(!source.text.includes('setPrefectureOptions('),'the selector must not depend on a category summary response');
});
