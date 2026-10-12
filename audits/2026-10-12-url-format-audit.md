# Official URL format audit — 2026-10-12

Live Supabase, 11,059 active facilities.
- URL missing/blank: 9,301 (railway 9,046; public toilet 255).
- Nonblank URLs: 1,758, of which HTTPS 1,477 and HTTP 281.
- Nonblank malformed HTTP(S) URL format: 0.
- **Not performed:** external HTTP reachability, redirects, certificate validity, canonical-domain and facility ownership verification. Therefore task 062 is still in progress, not complete.
- Next: perform rate-limited HTTP HEAD/GET checks with retry and source evidence; never rewrite HTTP URLs to HTTPS without checking.
