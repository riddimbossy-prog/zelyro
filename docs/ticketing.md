# Ticketing

Organizers create events and ticket types with capacity and price. Purchase mints a **random** `code` (not the table id). QR encodes that code. Scanner hits the API; used tickets cannot be reused. Scan log is append-only.
