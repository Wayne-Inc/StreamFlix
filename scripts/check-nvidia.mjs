import { readFileSync } from "node:fs";

const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const key = [...text.matchAll(/^NVIDIA_API_KEY=(.*)$/gm)].at(-1)?.[1]?.trim().replace(/^["']|["']$/g, "");
const model =
  [...text.matchAll(/^NVIDIA_MODEL=(.*)$/gm)].at(-1)?.[1]?.trim().replace(/^["']|["']$/g, "") ||
  "nvidia/nemotron-3-ultra-550b-a55b";

if (!key) {
  console.log("missing-key");
  process.exit(1);
}

const list = await fetch("https://integrate.api.nvidia.com/v1/models", {
  headers: { Authorization: `Bearer ${key}` },
});
const listed = await list.text();
console.log("models-status", list.status);
const nemotron = listed.match(/nvidia\/[a-z0-9._-]*nemotron[a-z0-9._-]*/gi) ?? [];
console.log("nemotron-ids", [...new Set(nemotron)].slice(0, 30).join("\n"));

for (const candidate of [
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "nvidia/llama-3.1-nemotron-51b-instruct",
  "nvidia/nemotron-nano-3-30b-a3b",
  "nvidia/nemotron-3.5-lightning-30b-a3b",
  "nvidia/nemotron-4-340b-instruct",
]) {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: candidate,
      temperature: 0.2,
      max_tokens: 40,
      messages: [{ role: "user", content: "Say ok" }],
    }),
  });
  const body = await res.text();
  let hasContent = false;
  try {
    const parsed = JSON.parse(body);
    hasContent = typeof parsed.choices?.[0]?.message?.content === "string" && parsed.choices[0].message.content.trim().length > 0;
  } catch {}
  console.log("try", candidate, res.status, "hasContent", hasContent, body.slice(0, 160).replaceAll("\n", " "));
  if (res.ok && hasContent) break;
}
