"use client";

import { useEffect, useRef, useState } from "react";
import { humanize, type HumanizeOptions } from "@/lib/humanize";
import { isValidWhatsAppPhone } from "@/lib/whatsapp";

interface Props {
  raw: string;
  opts: HumanizeOptions;
  baseSeed: number;
  telefone: string;
  onSave: (text: string) => void;
}

export default function ResultCard({ raw, opts, baseSeed, telefone, onSave }: Props) {
  const [seed, setSeed] = useState(baseSeed * 7919);
  const [edited, setEdited] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [flash, setFlash] = useState("");
  const [canShare, setCanShare] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const text = edited ?? humanize(raw, { ...opts, seed });

  function notify(message: string) {
    setFlash(message);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setFlash(""), 1600);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    notify("Copiado");
  }

  function whatsapp() {
    if (!isValidWhatsAppPhone(telefone)) {
      notify("Informe um número de WhatsApp válido.");
      return;
    }
    const url = `https://wa.me/${telefone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
  }

  async function compartilhar() {
    try {
      await navigator.share({ text });
    } catch {
      // cancelamento do usuário não precisa de aviso
    }
  }

  return (
    <article className="bubble-card">
      <textarea
        className="bubble"
        value={text}
        rows={Math.min(8, Math.max(2, Math.ceil(text.length / 38)))}
        onChange={(event) => setEdited(event.target.value)}
        aria-label="Resposta gerada"
      />
      {showRaw && <p className="raw">{raw}</p>}
      <div className="actions">
        <button className="act wa" onClick={whatsapp}>
          WhatsApp
        </button>
        <button className="act" onClick={copiar}>
          Copiar
        </button>
        {canShare && (
          <button className="act" onClick={compartilhar}>
            Compartilhar
          </button>
        )}
        <button
          className="act"
          title="Sorteia outros erros e abreviações"
          onClick={() => {
            setEdited(null);
            setSeed((current) => current + 1);
          }}
        >
          Embaralhar
        </button>
        <button className="act ghost" onClick={() => setShowRaw((current) => !current)}>
          {showRaw ? "Ocultar original" : "Ver original"}
        </button>
        <button
          className="act ghost"
          onClick={() => {
            onSave(edited ?? humanize(raw, { ...opts, typoRate: 0, seed }));
            notify("Salvo nos seus exemplos");
          }}
        >
          Salvar como meu exemplo
        </button>
        {flash && (
          <span className="flash" role="status">
            {flash}
          </span>
        )}
      </div>
    </article>
  );
}
