/** Shape Supabase SSR passes into `cookies.setAll`. Shared across server/middleware. */
export type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};
