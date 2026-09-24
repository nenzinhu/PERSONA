import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envFiles = [".env.local", ".env"];
const env = { ...process.env };

for (const file of envFiles) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) continue;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const providers = {
  groq: ["GROQ_API_KEY"],
  nous: ["NOUS_API_KEY"],
  nvidia: ["NVIDIA_API_KEY"],
  mistral: ["MISTRAL_API_KEY"],
  anyapi: ["ANYAPI_API_KEY"],
  orcarouter: ["ORCAROUTER_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  together: ["TOGETHER_API_KEY"],
  cloudflare: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
  cohere: ["COHERE_API_KEY"],
  huggingface: ["HUGGINGFACE_API_KEY"],
  modelscope: ["MODELSCOPE_API_KEY"],
  aihubmix: ["AIHUBMIX_API_KEY"],
  custom: ["CUSTOM_API_KEY", "CUSTOM_BASE_URL", "CUSTOM_MODELS"],
};

const missing = Object.entries(providers).flatMap(([name, keys]) =>
  keys.filter((key) => !String(env[key ?? ""] ?? "").trim()).map((key) => `${name}:${key}`),
);

console.log(
  `Provedores configurados: ${Object.keys(providers).length - new Set(missing.map((item) => item.split(":")[0])).size}/${Object.keys(providers).length}`,
);
if (missing.length) {
  console.log("Variáveis ausentes (somente nomes, sem valores):");
  for (const item of missing) console.log(`- ${item}`);
} else {
  console.log("Todas as variáveis de provedor estão presentes.");
}

if (process.env.REQUIRE_API_KEYS === "1" && missing.length) process.exit(1);
