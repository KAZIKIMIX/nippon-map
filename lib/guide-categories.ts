export const guideCategories={
 aquarium:{name:"水族館",title:"水族館を地域から探す",intro:"近くの水族館も、旅先で立ち寄りたい水族館も。掲載中の施設を都道府県ごとに確認し、気になる場所を地図で探せます。",tips:["営業日・営業時間・最終入館時刻を公式サイトで確認しましょう。","入館料や事前予約の要否を確認すると、予定を立てやすくなります。","駐車場や公共交通の案内も、施設の公式情報で確認してください。"]},
 zoo:{name:"動物園",title:"動物園を地域から探す",intro:"週末のお出かけや旅行の候補に。掲載中の動物園・サファリ施設を地域から探し、住所や公式サイトを確認できます。",tips:["休園日・営業時間・入園料は施設の公式サイトで確認しましょう。","サファリ施設などは、移動方法や利用条件も確認してください。","見たい動物やイベントの公開状況は、各施設の最新案内をご確認ください。"]},
 "roadside-station":{name:"道の駅",title:"道の駅を地域から探す",intro:"ドライブの途中に立ち寄る場所を探したいときに。掲載中の道の駅を都道府県から選び、周辺の位置関係を地図で確認できます。",tips:["売店・飲食店などの営業時間や定休日は、施設ごとに確認しましょう。","駐車場や各設備の利用条件は、公式案内をご確認ください。","休憩・食事・買い物など、立ち寄る目的に合う設備があるか確認すると便利です。"]}
};
export type GuideCategory=keyof typeof guideCategories;
export function isGuideCategory(value:string):value is GuideCategory{return Object.prototype.hasOwnProperty.call(guideCategories,value);}
export type GuidePlace={id:number;name:string;category_slug:string;prefecture_name:string;municipality_name:string;address:string;official_url:string|null;};
export const prefectureOrder="北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県".split(" ");
export function groupGuidePlaces(places:GuidePlace[]){
 const groups=new Map<string,GuidePlace[]>();
 for(const p of places){const pref=p.prefecture_name||"地域未設定";const rows=groups.get(pref)||[];rows.push(p);groups.set(pref,rows);}
 return [...groups].sort(([a],[b])=>{const ia=prefectureOrder.indexOf(a),ib=prefectureOrder.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib);}).map(([prefecture,rows])=>({prefecture,places:rows}));
}
export function safeOfficialUrl(value:string|null):string|null{if(!value)return null;try{const url=new URL(value);return ["http:","https:"].includes(url.protocol)?url.href:null;}catch{return null;}}
