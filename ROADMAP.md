# Roadmap

## Next
- [ ] Add an automated test suite for ingestion, request signing and plan limits, and run it in CI
- [ ] Merge the duplicate plan definitions (`plans.ts`, `src/config`, `src/plans`, `src/shared`) into one module
- [ ] Remove the leftover compiled `src/lib/auth.js` and keep the TypeScript source only

## Later
- [ ] Replay a stored event against a chosen endpoint
- [ ] Retry policies and a dead-letter view for failed deliveries
- [ ] Payload retention settings per tenant, plus redaction of sensitive fields
- [ ] Slack alerts alongside email and Discord
