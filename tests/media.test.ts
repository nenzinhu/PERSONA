import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPrintMessages,
  isAudioFile,
  isImageDataUrl,
  parsePrintOutput,
  transcribeModel,
  visionTarget,
} from "../lib/media.ts";

const PNG = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

test("visionTarget usa o primeiro provedor com chave, ou o definido no env", () => {
  assert.equal(visionTarget({}), null);
  assert.deepEqual(visionTarget({ GROQ_API_KEY: "x" }), {
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
  });
  assert.deepEqual(visionTarget({ GROQ_API_KEY: "x", MISTRAL_API_KEY: "y" }), {
    provider: "mistral",
    model: "mistral-small-latest",
  });
  assert.deepEqual(
    visionTarget({ GROQ_API_KEY: "x", MISTRAL_API_KEY: "y", VISION_PROVIDER: "groq", VISION_MODEL: "outro/modelo" }),
    { provider: "groq", model: "outro/modelo" },
  );
  // Provedor do env sem chave ou sem modelo conhecido não serve.
  assert.equal(visionTarget({ VISION_PROVIDER: "groq" }), null);
  assert.equal(visionTarget({ NOUS_API_KEY: "x", VISION_PROVIDER: "nous" }), null);
  assert.deepEqual(visionTarget({ NOUS_API_KEY: "x", VISION_PROVIDER: "nous", VISION_MODEL: "v" }), {
    provider: "nous",
    model: "v",
  });
});

test("buildPrintMessages manda as imagens como partes image_url", () => {
  const { system, messages } = buildPrintMessages([PNG, PNG]);
  assert.match(system, /Nome: texto/);
  assert.match(system, /Eu/);
  const parts = messages[0].content;
  assert.ok(Array.isArray(parts));
  assert.equal(parts.filter((p) => p.type === "image_url").length, 2);
  assert.ok(parts.some((p) => p.type === "text"));
});

test("parsePrintOutput mantém linhas Nome: texto e junta continuações", () => {
  const raw = "```\n**Ana:** vc vem?\n- Eu: acho q sim\nmas confirmo\nAna: blz\n```";
  assert.equal(parsePrintOutput(raw), "Ana: vc vem?\nEu: acho q sim\nmas confirmo\nAna: blz");
  assert.equal(parsePrintOutput("Não consegui ler a imagem."), "");
});

test("isImageDataUrl aceita só JPEG/PNG/WebP em base64 dentro do limite", () => {
  assert.equal(isImageDataUrl(PNG), true);
  assert.equal(isImageDataUrl("data:image/gif;base64,R0lG"), false);
  assert.equal(isImageDataUrl("https://exemplo.com/a.png"), false);
  assert.equal(isImageDataUrl(`data:image/png;base64,${"A".repeat(3_000_000)}`), false);
});

test("isAudioFile reconhece áudio do WhatsApp mesmo sem tipo MIME", () => {
  assert.equal(isAudioFile({ name: "PTT-20260921.opus", type: "" }), true);
  assert.equal(isAudioFile({ name: "audio.m4a", type: "audio/mp4" }), true);
  assert.equal(isAudioFile({ name: "foto.jpg", type: "image/jpeg" }), false);
});

test("transcribeModel usa o env ou o Whisper turbo", () => {
  assert.equal(transcribeModel({}), "whisper-large-v3-turbo");
  assert.equal(transcribeModel({ TRANSCRIBE_MODEL: "whisper-large-v3" }), "whisper-large-v3");
});
