# PR26 isolated fixture review
Before: main abb3a3c02b46c56425ce86814e88a87655e8acc9. After: a4aa3954c357c6d40805c18c040bf29503aae550.
Review-only branch. Never merge to main or promote to production.
/review.html embeds actual components at 1440/390/320px. 3 fixed records with review-only IDs. Coordinates and fields are visual fixtures, not verified production data.
API routes replaced locally for this branch; usage client no-op, usage endpoint 204, submissions disabled. No Supabase configuration added.
WebGL, real API, real phones/Safari are outside this review.
