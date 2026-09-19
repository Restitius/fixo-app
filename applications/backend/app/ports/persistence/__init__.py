"""Persistence ports — repository protocols exposed to application/domain code.

Each repository port describes *what the business needs* (e.g. `find_by_id`,
`list_customer_bookings`) with no SQL, no query IDs, no database hints.
Concrete SQL adapters living under `app/adapters/persistence/` implement these.
"""



