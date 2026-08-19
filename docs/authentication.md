# Authentication

Production: Supabase Auth (email, phone OTP, Google, Apple).  
This web slice: Better Auth federated to Google and X, plus local email/password.

Sessions are multi-device. Password reset, email verify, and device history belong on the API. Never accept a client-supplied user id; only the verified session.

Onboarding roles: Fan, Artist/Creator, Producer, Event Organizer. There is no DJ account, DJ role, or DJ onboarding flow.

