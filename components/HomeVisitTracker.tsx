"use client";
import {useEffect} from "react";
import {trackUsage} from "../lib/usage-client";
export default function HomeVisitTracker(){
 useEffect(()=>{trackUsage("page_view");},[]);
 return null;
}
