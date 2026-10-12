# Coordinate range, precision and anomaly audit — 2026-10-12

Live scope: 11,059 active facilities. These checks identify candidates; bounding-box compliance is not proof of correct placement.

- NULL latitude or longitude: 0.
- Zero latitude or longitude: 0.
- Outside coarse Japan bounding box (20–46 N, 122–154 E): 0.
- Both coordinates rounded to one decimal place: 9, all broad-area assets: world heritage ID 2657; national parks IDs 2684, 2686, 2687, 2692, 2694, 2699, 2700, 2711.
- These nine should be modeled with representative points or polygons, not given fabricated facility-level coordinates.

## Anomaly handling
- Do not change a coordinate solely because of low precision; distinguish large-area representative points from individual station/airport coordinates.
- For precise facilities, compare coordinate to authoritative source and flag material displacement.
- For national parks/world heritage, prefer official polygon/constituent-location data and label point as representative when applicable.
- Retain original coordinates and source before verified updates; audit produced no coordinate writes.

Status: cross-category range/precision/anomaly candidate audit complete. Authoritative positional accuracy verification remains a separate task.
