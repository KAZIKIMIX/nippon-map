import type {Metadata} from "next";
import MapApp from "../../components/MapApp";
export const metadata:Metadata={title:"地図で探す｜にっぽんマップ",alternates:{canonical:"/map"},robots:{index:false,follow:true}};
export default function MapPage(){return <MapApp/>;}
