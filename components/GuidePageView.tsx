"use client";
import {useEffect,useRef} from "react";
import {trackUsage} from "../lib/usage-client";
export default function GuidePageView({category}:{category:string}){
 const recorded=useRef(false);
 useEffect(()=>{if(!recorded.current){recorded.current=true;trackUsage("page_view",category);}},[category]);
 return null;
}
