const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
function compile(path,req=require){const m={exports:{}};new Function('exports','module','require',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(m.exports,m,req);return m.exports;}
const events=compile('lib/usage-events.ts');
const local=new Map(),session=new Map(),sent=[];
const storage=m=>({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
global.window={location:{origin:'https://nippon-map.vercel.app',search:'?utm_source=x&q=private'}};
global.document={referrer:''};global.localStorage=storage(local);global.sessionStorage=storage(session);
Object.defineProperty(global,'navigator',{value:{doNotTrack:'0',webdriver:false},configurable:true,writable:true});
global.fetch=async(url,options)=>{sent.push({url,payload:JSON.parse(options.body)});};
const load=()=>compile('lib/usage-client.ts',name=>name==='./usage-events'?events:require(name));
let client=load();client.trackUsage('page_view');assert.equal(sent.at(-1).payload.source,'x');
window.location.search='';document.referrer='https://nippon-map.vercel.app/';client.trackUsage('place_open','railway');assert.equal(sent.at(-1).payload.source,'x','X attribution must survive internal navigation');
client=load();client.trackUsage('page_view');assert.equal(sent.at(-1).payload.source,'x','X attribution must survive full reload in the same tab');
window.location.search='?utm_source=instagram';client.trackUsage('page_view');assert.equal(sent.at(-1).payload.source,'instagram');
window.location.search='';document.referrer='https://nippon-map.vercel.app/guides/zoo';client=load();client.trackUsage('page_view');assert.equal(sent.at(-1).payload.source,'instagram');
// A new external arrival replaces the old tab source; private referrer text is never stored.
document.referrer='https://www.google.co.jp/search?q=secret';client=load();client.trackUsage('page_view');assert.equal(sent.at(-1).payload.source,'search');
assert.deepEqual([...session.values()],['search']);assert(!JSON.stringify([...session]).includes('secret'));
client.setUsageDisabled(true);const count=sent.length;client.trackUsage('page_view');assert.equal(sent.length,count);assert.equal(session.size,0,'Opt-out clears retained attribution');
client.setUsageDisabled(false);document.referrer='';window.location.search='';client.trackUsage('page_view');assert.equal(sent.at(-1).payload.source,'direct');
for(const flag of ['doNotTrack','globalPrivacyControl']){navigator[flag]=flag==='doNotTrack'?'1':true;const before=sent.length;window.location.search='?utm_source=x';client.trackUsage('page_view');assert.equal(sent.length,before);assert.equal(session.size,0);navigator[flag]=flag==='doNotTrack'?'0':false;}
navigator.webdriver=true;client.trackUsage('page_view');assert.equal(sent.at(-1).payload.developer,true);navigator.webdriver=false;
client.setDeveloperMode(true);client.trackUsage('page_view');assert.equal(sent.at(-1).payload.developer,true);client.setDeveloperMode(false);
// Missing / blocked session storage must not break service or lose SPA attribution.
global.sessionStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
client=load();client.trackUsage('page_view');window.location.search='';client.trackUsage('page_view');assert.equal(sent.at(-1).payload.source,'x');
for(const row of sent){assert.deepEqual(Object.keys(row.payload).sort(),['category','developer','event','source']);assert.equal(row.url,'/api/usage');}
console.log('Usage attribution tests passed: internal navigation, reload, campaign change, new external visit, enum-only storage, blocked storage, opt-out/DNT/GPC, developer and automation flags.');
