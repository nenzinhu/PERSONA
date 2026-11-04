"use client";

import Icon from "./Icon";
import { useRef, useState } from "react";
import { errorText, postJson } from "@/lib/api";
import { isAudioFile, MAX_AUDIO_BYTES, MAX_IMAGE_CHARS, MAX_IMAGES } from "@/lib/media";

interface Props {
  senha: string;
  /** Recebe o texto transcrito/lido. */
  onText: (texto: string) => void;
}

/** Reduz o print para caber no limite do servidor (lado maior até 1280 px, JPEG). */
async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.8, 0.65, 0.5, 0.35]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length <= MAX_IMAGE_CHARS) return url;
  }
  throw new Error("Print grande demais, mesmo reduzido.");
}

function useUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function run(task: () => Promise<void>) {
    setLoading(true);
    setError("");
    try {
      await task();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setLoading(false);
    }
  }
  return { loading, error, run };
}

/** 🎤 Áudio: escolhe um áudio (ex.: o .opus do WhatsApp) e devolve a transcrição. */
export function AudioButton({ senha, onText }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loading, error, run } = useUpload();

  function onFile(file: File | undefined) {
    if (!file) return;
    run(async () => {
      if (!isAudioFile(file)) throw new Error("Esse arquivo não parece ser um áudio.");
      if (file.size > MAX_AUDIO_BYTES) throw new Error("Áudio grande demais (máximo 4 MB).");
      const form = new FormData();
      form.append("audio", file, file.name);
      const response = await fetch("/api/transcrever", {
        method: "POST",
        headers: { "x-app-password": senha },
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Não consegui transcrever.");
      onText(String(data.texto ?? ""));
    });
  }

  return (
    <span className="media">
      <button className="act" disabled={loading} onClick={() => inputRef.current?.click()}>
        <Icon name="audio" />
        {loading ? "Transcrevendo…" : "Áudio"}
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="audio/*,.opus,.ogg,.m4a,.mp3,.wav,.webm"
        aria-label="Arquivo de áudio"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error && (
        <small className="error" role="alert">
          {error}
        </small>
      )}
    </span>
  );
}

/** 📷 Print: lê até 3 prints da conversa e devolve linhas "Nome: texto" (você = "Eu"). */
export function PrintButton({ senha, onText }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loading, error, run } = useUpload();

  function onFiles(list: FileList | null) {
    const files = [...(list ?? [])].filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    run(async () => {
      if (files.length > MAX_IMAGES) throw new Error(`Escolha no máximo ${MAX_IMAGES} prints.`);
      const imagens = await Promise.all(files.map(shrinkImage));
      const data = await postJson<{ texto: string }>("/api/ler-print", { imagens }, senha);
      onText(data.texto);
    });
  }

  return (
    <span className="media">
      <button className="act" disabled={loading} onClick={() => inputRef.current?.click()}>
        <Icon name="image" />
        {loading ? "Lendo print…" : "Print"}
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept="image/*"
        aria-label="Prints da conversa"
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {error && (
        <small className="error" role="alert">
          {error}
        </small>
      )}
    </span>
  );
}
