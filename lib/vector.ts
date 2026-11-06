import { Index } from "@upstash/vector";

export function getVectorClient(): Index | null {
  const url = process.env.UPSTASH_VECTOR_REST_URL?.trim();
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN?.trim();

  if (!url || !token) return null;

  return new Index({ url, token });
}
