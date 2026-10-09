"use client";
import {useEffect,useState} from "react";
import {usageIsDisabled,setUsageDisabled} from "../lib/usage-client";
export default function UsagePreference(){
 const [disabled,setDisabled]=useState(false),[message,setMessage]=useState(""),[ready,setReady]=useState(false);
 useEffect(()=>{setDisabled(usageIsDisabled());setReady(true);},[]);
 return <section aria-label="利用計測の設定">
 <label style={{display:"flex",gap:12,alignItems:"center",margin:"16px 0"}}>
 <input type="checkbox" checked={disabled} disabled={!ready} style={{width:20,height:20}} onChange={e=>{
  const value=e.target.checked;const saved=setUsageDisabled(value);setDisabled(usageIsDisabled());
  setMessage(saved?"設定を保存しました。ブラウザの追跡拒否設定が有効な場合は、そちらを優先します。":"このブラウザでは設定を保存できません。今回のページ内では設定を反映しました。");
 }}/>このブラウザで利用計測を停止する</label>
 <p>ブラウザの「Do Not Track」または「Global Privacy Control」が有効な場合も、利用計測を停止します。</p>
 <p role="status" aria-live="polite">{message}</p>
 </section>;
}
