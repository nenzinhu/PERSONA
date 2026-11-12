"use client";

import { useState, type FormEvent } from "react";
import { useLocalState, useSessionState } from "@/lib/store";
import {
  findAgreements,
  MAX_AGREEMENT_MEANING,
  MAX_AGREEMENT_TERM,
  precisionQuestion,
  upsertAgreement,
  type Agreement,
} from "@/lib/agreements";

interface Draft {
  texto: string;
  termo: string;
  significado: string;
}

const INITIAL: Draft = { texto: "", termo: "", significado: "" };

export default function AgreementsDictionary() {
  const [agreements, setAgreements] = useLocalState<Agreement[]>("communication-agreements", []);
  const [form, setForm] = useSessionState<Draft>("beyond-agreements", INITIAL);
  const [notice, setNotice] = useState("");

  const hits = findAgreements(form.texto, agreements);
  const update = (patch: Partial<Draft>) => {
    setNotice("");
    setForm((current) => ({ ...current, ...patch }));
  };

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = upsertAgreement(agreements, form.termo, form.significado);
    if (next === agreements) {
      setNotice("Informe a expressão e o significado combinado.");
      return;
    }
    setAgreements(next);
    setForm((current) => ({ ...current, termo: "", significado: "" }));
    setNotice("Acordo salvo neste navegador.");
  }

  function define(termo: string) {
    setForm((current) => ({ ...current, termo, significado: "" }));
    setNotice("");
  }

  async function copyQuestions() {
    try {
      await navigator.clipboard.writeText(hits.map((hit) => `- ${precisionQuestion(hit.termo)}`).join("\n"));
      setNotice("Perguntas copiadas. Nada foi enviado.");
    } catch {
      setNotice("Não consegui copiar. Selecione as perguntas e copie manualmente.");
    }
  }

  return (
    <div className="studio-grid">
      <section className="composer" aria-labelledby="agreements-heading">
        <div className="panel-heading">
          <span aria-hidden="true">≡</span>
          <h2 id="agreements-heading">O que cada expressão quer dizer</h2>
        </div>
        <p className="studio-intro">
          Registre o significado que vocês combinaram para expressões como “mais tarde” ou “quando der”. O Persona não
          adivinha o sentido: só mostra o que você combinou.
        </p>

        <label className="field">
          <span>Texto para conferir</span>
          <textarea
            rows={6}
            maxLength={2000}
            value={form.texto}
            onChange={(event) => update({ texto: event.target.value })}
            placeholder="Cole aqui a mensagem que você vai enviar."
          />
        </label>

        <form onSubmit={save} className="agreement-form">
          <div className="row">
            <label className="field">
              <span>Expressão</span>
              <input
                value={form.termo}
                maxLength={MAX_AGREEMENT_TERM}
                onChange={(event) => update({ termo: event.target.value })}
                placeholder="mais tarde"
                required
              />
            </label>
            <label className="field">
              <span>Significado combinado</span>
              <input
                value={form.significado}
                maxLength={MAX_AGREEMENT_MEANING}
                onChange={(event) => update({ significado: event.target.value })}
                placeholder="até 18h do mesmo dia"
                required
              />
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="primary">
              Salvar acordo
            </button>
          </div>
        </form>
        <p className="privacy-note">Os acordos ficam no armazenamento local deste navegador e não são enviados à IA.</p>
        {notice && (
          <p className="provider-status" role="status">
            {notice}
          </p>
        )}
      </section>

      <section className="studio-side" aria-labelledby="agreements-hits-heading">
        <div className="panel-heading">
          <span aria-hidden="true">◷</span>
          <h2 id="agreements-hits-heading">Expressões no texto</h2>
          <span className="panel-caption">{hits.length}</span>
        </div>
        {hits.length ? (
          <>
            <ul className="agreement-hits">
              {hits.map((hit) => (
                <li key={hit.termo}>
                  <div className="agreement-hit-top">
                    <strong>“{hit.termo}”</strong>
                    <span className="muted small">
                      {hit.ocorrencias}×{hit.significado ? "" : " · sem acordo registrado"}
                    </span>
                  </div>
                  {hit.significado ? (
                    <p>Combinado: {hit.significado}</p>
                  ) : (
                    <p className="plain-question">{precisionQuestion(hit.termo)}</p>
                  )}
                  {!hit.significado && (
                    <button type="button" className="act" onClick={() => define(hit.termo)}>
                      Definir significado
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="actions plain-actions">
              <button type="button" className="act" onClick={copyQuestions}>
                Copiar perguntas
              </button>
            </div>
          </>
        ) : (
          <div className="empty">
            <p>Nenhuma expressão ambígua encontrada.</p>
            <p className="muted small">Cole um texto para conferir as expressões registradas.</p>
          </div>
        )}

        <h3 className="plain-subhead">Acordos registrados</h3>
        {agreements.length ? (
          <ul className="agreement-list">
            {agreements.map((agreement) => (
              <li key={agreement.id}>
                <span>
                  <strong>“{agreement.termo}”</strong> — {agreement.significado}
                </span>
                <button
                  type="button"
                  className="act"
                  onClick={() => setAgreements(agreements.filter((item) => item.id !== agreement.id))}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Nenhum acordo registrado ainda.</p>
        )}
      </section>
    </div>
  );
}
