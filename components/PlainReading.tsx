"use client";

import { useState } from "react";
import { useSessionState } from "@/lib/store";
import { readWithoutContext } from "@/lib/plain-read";

const INITIAL = { draft: "" };

export default function PlainReading() {
  const [form, setForm] = useSessionState<{ draft: string }>("beyond-plain-read", INITIAL);
  const [notice, setNotice] = useState("");
  const text = form.draft.trim();
  const { checks, gaps } = readWithoutContext(form.draft);

  async function copyQuestions() {
    try {
      await navigator.clipboard.writeText(gaps.map((gap) => `- ${gap.question}`).join("\n"));
      setNotice("Perguntas copiadas. Nada foi enviado.");
    } catch {
      setNotice("Não consegui copiar. Selecione as perguntas e copie manualmente.");
    }
  }

  return (
    <div className="studio-grid">
      <section className="composer" aria-labelledby="plain-heading">
        <div className="panel-heading">
          <span aria-hidden="true">▤</span>
          <h2 id="plain-heading">Sem o histórico, o texto se explica?</h2>
        </div>
        <p className="studio-intro">
          Cole o rascunho e veja exatamente o que a outra pessoa recebe. As perguntas abaixo são sobre o texto, não
          sobre a reação de quem vai ler.
        </p>
        <label className="field">
          <span>Seu rascunho</span>
          <textarea
            rows={8}
            maxLength={2000}
            value={form.draft}
            onChange={(event) => {
              setNotice("");
              setForm({ draft: event.target.value });
            }}
            placeholder="Cole aqui a mensagem que você pretende enviar."
          />
        </label>
        <p className="privacy-note">
          O rascunho fica só nesta sessão do navegador. Esta conferência é feita no seu dispositivo, sem IA.
        </p>
      </section>

      <section className="studio-side" aria-labelledby="plain-preview-heading">
        <div className="panel-heading">
          <span aria-hidden="true">◷</span>
          <h2 id="plain-preview-heading">Como chega</h2>
        </div>
        {text ? (
          <>
            <p className="plain-sheet">{text}</p>
            <h3 className="plain-subhead">O que conferir</h3>
            <ul className="plain-checks">
              {checks.map((check) => (
                <li key={check.id} className={check.ok ? "on" : ""}>
                  <strong>
                    <span aria-hidden="true">{check.ok ? "✓" : "?"}</span> {check.label}
                  </strong>
                  <p>{check.detail}</p>
                  {!check.ok && <p className="plain-question">{check.question}</p>}
                </li>
              ))}
            </ul>
            {gaps.length > 0 && (
              <div className="actions plain-actions">
                <button type="button" className="primary" onClick={copyQuestions}>
                  Copiar perguntas
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty">
            <p>Aqui aparece só o texto, sem o histórico da conversa.</p>
            <p className="muted small">Cole um rascunho para ver o que ficou de fora.</p>
          </div>
        )}
        {notice && (
          <p className="provider-status" role="status">
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}
