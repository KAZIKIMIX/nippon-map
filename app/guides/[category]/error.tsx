"use client";
import {useEffect} from "react";
export default function GuideError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("Guide page failed",error.message)},[error]);
 return <main style={{maxWidth:640,margin:"72px auto",padding:"24px",fontFamily:"system-ui,sans-serif",lineHeight:1.8,color:"#253d50"}} role="alert">
 <h1>施設情報を表示できませんでした</h1>
 <p>一時的にデータを取得できない可能性があります。少し時間をおいて再度お試しください。</p>
 <button type="button" onClick={()=>reset()} style={{background:"#253d50",color:"#fff",padding:"12px 22px",border:0,borderRadius:8,cursor:"pointer"}}>再読み込み</button>
 <p><a href="/">トップページへ戻る</a></p>
 </main>;
}
