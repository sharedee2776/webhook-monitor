export const STRIPE_PRICE_TO_PLAN: Record<string, string> = {
  [process.env.PRO_PRICE_ID!]: "pro",
  [process.env.TEAM_PRICE_ID!]: "team",
  "price_1Sl7KZBUVIvwDHnfLrK9bjCH": "pro",
  "price_1Sl7NRBUVIvwDHnf9d3MYV9c": "pro"
};
