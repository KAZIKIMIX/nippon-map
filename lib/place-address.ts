type PlaceAddress={address?:string|null;prefecture_name?:string|null;municipality_name?:string|null};
export function presentPlaceAddress(place:PlaceAddress):{text:string;note:string}{
 const address=place.address?.trim()||"";
 if(!address)return {text:"詳細住所は未登録です",note:"所在地は公式情報でご確認ください。"};
 const compact=(value:string)=>value.replace(/\s/g,"");
 const city=place.municipality_name?.trim()||"";
 const prefecture=place.prefecture_name?.trim()||"";
 const municipalityOnly=Boolean(city)&&(compact(address)===compact(city)||compact(address)===compact(prefecture+city));
 return {text:address,note:municipalityOnly?"市区町村までの所在地です。詳しい住所は公式情報でご確認ください。":""};
}
