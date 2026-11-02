# Landing acquisition and measurement fixes

Confirmed against main c0b5300b97dd2b7f706028bb3c84533eec2a3fdd.

- Homepage mounted both HomeVisitTracker and CategoryDirectory page_view effects. Keep the tracker at page level; directory is presentation/search only. This is a duplicated event fix, not deduplication of real visits.
- Empty category search recovery said "show all" but reset to the eight featured categories. Clear the query and expand all using the existing design.
- Legacy /?category=...&prefecture=...&city=... redirects omitted city. Preserve it alongside the existing allowlist; no open redirects added.

Regression evidence: all three new tests failed on old code and passed after changes. Existing map-share and attribution/opt-out/DNT/GPC tests and landing contract passed. Tests mock hooks and tracking without production DB writes; browser verification remains separate.

Measurement caveat: historical events are immutable. Homepage page_view counts before this fix can include two emissions per mount, and cannot be corrected reliably from existing aggregate fields. Record the actual production rollout day/time. Treat that day as a measurement transition for page_view analysis; do not silently compare raw counts across the definition change or invent corrected users/sessions. Keep the user-requested November 2 onward window, but label the rollout day separately and compare complete days after rollout when assessing page_view trends.

No logos, icons, color, typography, layout or external analytics changes. No additional X posts or accumulation-period queries. No DB connection/config changes.
