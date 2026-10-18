"use client";
import {useEffect,useState} from "react";
import {usageIsDisabled,setUsageDisabled,developerModeEnabled,setDeveloperMode} from "../lib/usage-client";
export default function UsagePreference(){
 const [developer,setDeveloper]=useState(false),[disabled,setDisabled]=useState(false),[message,setMessage]=useState(""),[ready,setReady]=useState(false);
 useEffect(()=>{setDisabled(usageIsDisabled());setDeveloper(developerModeEnabled());setReady(true);},[]);
 return <section aria-label="利用計測の設定">
 <label style={{display:"flex",gap:12,alignItems:"center",margin:"16px 0"}}>
 <input type="checkbox" checked={disabled} disabled={!ready} style={{width:20,height:20}} onChange={e=>{
  const value=e.target.checked;const saved=setUsageDisabled(value);setDisabled(usageIsDisabled());
  setMessage(saved?"設定を保存しました。ブラウザの追跡拒否設定が有効な場合は、そちらを優先します。":"このブラウザでは設定を保存できません。今回のページ内では設定を反映しました。");
 }}/>このブラウザで利用計測を停止する</label>
 <p>ブラウザの「Do Not Track」または「Global Privacy Control」が有効な場合も、利用計測を停止します。</p>
 <p role="status" aria-live="polite">{message}</p>
 <div style={{marginTop:28,paddingTop:20,borderTop:"1px solid #ddd"}}><h2 style={{fontSize:20}}>開発・検証モード</h2><p>開発中の操作を一般利用の集計から区別するための設定です。このブラウザにのみ適用され、本人確認ではありません。</p><label style={{display:"flex",gap:12,alignItems:"center"}}><input type="checkbox" checked={developer} disabled={!ready} onChange={e=>{const next=e.target.checked;if(setDeveloperMode(next)){setDeveloper(next);setMessage(next?"開発・検証モードを有効にしました。":"開発・検証モードを無効にしました。");}else setMessage("このブラウザに設定を保存できませんでした。");}}/>このブラウザの操作を開発・検証として記録する</label></div></section>;
}
