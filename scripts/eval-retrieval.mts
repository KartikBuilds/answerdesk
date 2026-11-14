// Retrieval quality check against a local Postgres loaded with the migration and seed.
// Each question must return the expected article in the top 3; off-topic questions must fall below the threshold.
import pg from "pg";
import { MIN_SIMILARITY } from "../src/lib/answer.ts";
import { embed } from "../src/lib/embed.ts";

const cases: [string, string | null][] = [
  ["How much does Pro cost per month?", "plans-and-pricing"],
  ["When will I receive money from card payments?", "payment-methods"],
  ["Can I give a client their money back?", "refunds-and-credit-notes"],
  ["How do I add GST to my invoices?", "taxes"],
  ["Can I invite my accountant to the account?", "team-and-permissions"],
  ["I lost my phone with the authenticator app", "security"],
  ["How do I delete my account?", "export-and-delete"],
  ["Does it connect to QuickBooks?", "integrations"],
  ["Send the same invoice every month automatically", "recurring-invoices"],
  ["Change the invoice number prefix", "create-an-invoice"],
  ["Remind clients who haven't paid", "late-payments"],
  ["Bill a client in euros", "currencies"],
  ["Upload a spreadsheet of my customers", "clients"],
  ["What's the weather in Paris tomorrow?", null],
  ["Write me a poem about cats", null],
];

const client = new pg.Client({ database: process.env.PGDATABASE ?? "answerdesk_eval" });
await client.connect();
const vectors = await embed(cases.map(([q]) => q));
let failures = 0;
for (const [i, [question, expected]] of cases.entries()) {
  const { rows } = await client.query("select slug, similarity from public.ad_match($1::extensions.vector, 3)", [`[${vectors[i].join(",")}]`]);
  const ok = expected === null ? rows[0].similarity < MIN_SIMILARITY : rows.some((r) => r.slug === expected) && rows[0].similarity >= MIN_SIMILARITY;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${question} -> ${rows[0].slug} (${rows[0].similarity.toFixed(2)})`);
}
await client.end();
console.log(`${cases.length - failures}/${cases.length} passed`);
process.exit(failures ? 1 : 0);
