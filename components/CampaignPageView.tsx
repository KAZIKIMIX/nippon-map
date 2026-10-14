"use client";
import {useEffect} from "react";
import {trackUsage} from "../lib/usage-client";
export default function CampaignPageView(){
 useEffect(()=>{trackUsage("page_view");},[]);
 return null;
}
