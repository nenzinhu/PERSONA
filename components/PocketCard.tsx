"use client";

import { useState } from "react";
import { useSessionState } from "@/lib/store";
import { buildPocketCard, pocketIsReady, type PocketCardInput } from "@/lib/pocket";

const INITIAL: PocketCardInput = { dizer: "", perguntar: "", limite: "" };

export default function PocketCard() {
  const [form, setForm] = useSessionState<PocketCardInput>("beyond-pocket", INITIAL);
  const [notice, setNotice] = useState("");
  const card = buildPocketCard(form);
  const ready = pocketIsReady(form);

  const update = (key: keyof PocketCardInput, value: string) => {
    setNotice("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(card);
      setNotice("Cartão copiado. Nada foi enviado.");
    } catch {
      setNotice("Não consegui copiar. Selecione o texto do cartão e copie manualmente.");
    }
  }

  return (
    <div className="studio-grid">
      <section className="composer" aria-labelledby="pocket-heading">
        <div className="panel-heading">
          <span aria-hidden="true">▭</span>
          <h2 id="pocket-heading">O que levar para a conversa presencial</h2>
        </div>
        <p className="studio-intro">
          Três listas curtas para consultar longe da tela. O cartão usa só o que você escrever: nenhum nome, ordem ou
          detalhe é acrescentado pelo app.
        </p>

        <label className="field">
          <span>O que preciso dizer (uma linha por item)</span>
          <textarea
            rows={4}
            maxLength={1200}
            value={form.dizer}
            onChange={(event) => update("dizer", event.target.value)}
            placeholder={"Que eu preciso de mais prazo\nQue não concordo com o horário"}
          />
        </label>
        <label className="field">
          <span>O que preciso perguntar</span>
          <textarea
            rows={4}
            maxLength={1200}
            value={form.perguntar}
            onChange={(event) => update("perguntar", event.target.value)}
            placeholder={"Quem assume o plantão de sábado?\nComo fica o pagamento?"}
          />
        </label>
        <label className="field">
          <span>Meu limite</span>
          <textarea
            rows={2}
            maxLength={400}
            value={form.limite}
            onChange={(event) => update("limite", event.target.value)}
            placeholder="Não fico depois das 19h."
          />
        </label>

        <div className="actions">
          <button type="button" className="primary" onClick={copy} disabled={!ready}>
            Copiar cartão
          </button>
          <button type="button" className="act" onClick={() => window.print()} disabled={!ready}>
            Imprimir
          </button>
          <button type="button" className="act" onClick={() => setForm(INITIAL)}>
            Limpar
          </button>
        </div>
        <p className="privacy-note">
          O cartão fica só nesta sessão do navegador e desaparece quando você fecha a aba. Nada é enviado à IA.
        </p>
        {notice && (
          <p className="provider-status" role="status">
            {notice}
          </p>
        )}
      </section>

      <section className="studio-side print-region" aria-labelledby="pocket-preview-heading">
        <div className="panel-heading no-print">
          <span aria-hidden="true">✎</span>
          <h2 id="pocket-preview-heading">Cartão</h2>
        </div>
        {ready ? (
          <pre className="pocket-sheet">{card}</pre>
        ) : (
          <div className="empty">
            <p>O cartão aparece aqui.</p>
            <p className="muted small">Escreva ao menos um item para copiar ou imprimir.</p>
          </div>
        )}
      </section>
    </div>
  );
}
