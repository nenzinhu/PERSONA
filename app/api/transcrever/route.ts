import { NextResponse } from "next/server";
import { guard, publicProviderError } from "@/lib/generation";
import { isConfigured, ProviderError } from "@/lib/llm";
import { isAudioFile, MAX_AUDIO_BYTES, transcribeAudio } from "@/lib/media";
import { getProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Bloco C: transcreve um áudio (multipart, campo "audio") com o Whisper do Groq.
export async function POST(req: Request) {
  const guarded = guard(req);
  if (!guarded.ok) return guarded.response;
  const { headers } = guarded;

  const groq = getProvider("groq");
  if (!groq || !isConfigured(groq, process.env)) {
    return NextResponse.json({ error: "Transcrever áudio precisa da GROQ_API_KEY." }, { status: 400, headers });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("audio");
  } catch {
    return NextResponse.json({ error: "Envie o áudio como arquivo." }, { status: 400, headers });
  }
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: "Escolha um arquivo de áudio." }, { status: 400, headers });
  }
  if (!isAudioFile(file)) {
    return NextResponse.json({ error: "Esse arquivo não parece ser um áudio." }, { status: 400, headers });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Áudio grande demais (máximo 4 MB)." }, { status: 413, headers });
  }

  try {
    const texto = await transcribeAudio(process.env, file, file.name || "audio.ogg");
    return NextResponse.json({ texto }, { headers });
  } catch (error) {
    const status = error instanceof ProviderError && error.status === 429 ? 429 : 502;
    return NextResponse.json({ error: publicProviderError(error) }, { status, headers });
  }
}
