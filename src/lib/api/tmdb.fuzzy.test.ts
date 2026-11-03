import { test } from "node:test";
import assert from "node:assert/strict";

import { fuzzySearchQueries } from "./tmdb.ts";

test("fuzzySearchQueries includes common misspellings and transpositions", () => {
  const variants = fuzzySearchQueries("avangers endgame");
  assert.ok(variants.includes("avengers endgame"), `Expected typo variants to include corrected query, got: ${variants.join(", ")}`);
  assert.ok(variants.some((variant) => variant.includes("endgam")), `Expected variants to include near matches, got: ${variants.join(", ")}`);
});
