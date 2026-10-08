# 2026-10-08 data update

## Public place data
- Railway: MLIT National Land Numerical Information N02-25, CC BY 4.0, reference date 2025-12-31. Group by N02_005g; represent each station group by the midpoint along its representative station line. Keep route names and operators in metadata. Coordinates identify station sections, not entrances. Prefectures classified with N03-21 prefecture polygons; coastline points checked using the GSI reverse geocoder. Source: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html
- Museums: 10 Tokyo facilities matched to official websites. Coordinate source is the Tokyo Education Board CSV published in 2021 (CC BY). Shinjuku museum address updated to the official address. No national coverage claim. Source: https://spec.api.metro.tokyo.lg.jp/spec/t000021d2000000004-1185de5e293357197b75aaceff889770-0
- Parks: 112 Bunkyo parks/playgrounds matched by name to the ward official list. Source CSV catalog published in 2026 (CC BY); 7 unmatched play areas omitted. No national coverage claim. Source: https://spec.api.metro.tokyo.lg.jp/spec/t131059d2025000003-af4abde4d80cebad65c44ce30dda684c-0

## Photographs
17 photographs added: 7 castles, 5 lighthouses and 5 hot spring districts. Wikimedia Commons source URLs, authors and licenses are explicitly registered in app/api/place-photo/route.ts and rendered below each photo. Only resize and WebP conversion applied; CC BY-SA images retain their respective licenses. Photographs show the actual landmark or district; they are not a promise of its current appearance or opening status.

## UI
- Railway details load only public, whitelisted route/operator metadata via /api/place-details.
- Data source credits remain available on mobile.
- Existing approved logo and icon assets unchanged.
