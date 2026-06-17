## 2024-05-24 - N+1 Query in Order Articles
**Learning:** Found a classic N+1 query problem in the backend. Fetching orders (`oxorder`) and then querying their articles (`oxorderarticles`) individually inside a loop causes a significant performance hit, scaling linearly with the number of orders fetched (e.g. 50 orders = 51 queries).
**Action:** Always batch related data fetching into a single query using an `IN (...)` clause when fetching lists of items, and map the results back to the parent objects in memory to reduce database round-trips.
