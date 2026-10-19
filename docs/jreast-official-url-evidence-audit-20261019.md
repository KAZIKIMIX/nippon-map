# JR East official URL evidence audit (2026-10-19)

## Confirmed live CI outcome
- JR East timetable, facility listing, route map, Tohoku PDF, facility search and factbook: HTTP 403 from GitHub Actions.
- None of these attempts yielded station rows. Zero URLs are eligible for registration from the CI runs.
- Do not retry the same blocked hosts in scheduled jobs; disable these probes by default.

## Alternative reference
- MLIT National Land Numerical Information N02 railway dataset (2025 edition): https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html
- This government dataset contains station geometry, operator and route attributes and is useful for identity validation.
- **It is not a substitute for an individual JR East official station page.** Never set station official_url to the dataset's general landing page merely because a station matches.

## Web-indexed official evidence
- JR East timetable official route listing for Joban Line: https://www.jreast-timetable.jp/cgi-bin/st_search.cgi?50on=&rosen=34
- Publicly indexed rows show station names, prefectures and routes, but may be historical and not reachable live from GitHub Actions.
- A matching row is an audit candidate only; before registration verify current availability and the appropriateness of the URL as a station reference.

## Safety
- Preserve source URL, observation date, HTTP status and matched fields.
- No bulk registration until source pages are validated.
- PR #19 remains unmerged pending a reliable acquisition and verification path.
