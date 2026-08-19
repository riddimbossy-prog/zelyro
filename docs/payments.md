# Payments

`PaymentService` is an adapter interface (MoMo, cards, Apple Pay, Google Pay). Availability is country-based. Never store PAN. Webhooks must verify signatures.

Flow: client sends **item id only** → server loads price → computes processor fee + platform bps from `commission_rules` → writes `purchases` + `purchase_items` + `licenses` + `ledger_entries`.
