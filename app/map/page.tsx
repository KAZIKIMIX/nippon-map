import type {Metadata} from "next";
import MapApp from "../../components/MapApp";
export const metadata:Metadata={title:"PR35 固定データ検証｜にっぽんマップ",alternates:{canonical:"/map"},robots:{index:false,follow:true}};
export default function MapPage(){return <MapApp/>;}
