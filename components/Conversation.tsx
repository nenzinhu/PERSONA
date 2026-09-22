"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { profileForRequest, type AgentOutput, type StyleProfile } from "@/lib/prompt";
import { useLocalState } from "@/lib/store";
import { MIN_EXAMPLES, fingerprint } from "@/lib/stylometry";
import type { Settings } from "@/lib/types";
import { MAX_CONVERSATION, listSenders, parseConversation } from "@/lib/whatsapp";
import ResultCard from "./ResultCard";

interface Props {
  settings: Settings;
  perfil: StyleProfile;
  setPerfil: (fn: (p: StyleProfile) => StyleProfile) => void;
  senha: string;
}

interface Result extends AgentOutput {
  providerLabel: string;
  model: string;
  fallbacks: string[];
  ultima: string;
}

const noop = () => {};

export default function Conversation({ settings, perfil, setPerfil, senha }: Props) {
  const [colado, setColado] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [eu, setEu] = useLocalState<{ v: string }>("conversa-eu", { v: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const mensagens = useMemo(() => parseConversation(colado), [colado]);
  const remetentes = useMemo(() => listSenders(mensagens), [mensagens]);
  const recentes = mensagens.slice(-MAX_CONVERSATION);
  const souEu = remetentes.includes(eu.v) ? eu.v : "";
  const ultima = recentes.at(-1);
  const outro = remetentes.find((nome) => nome !== souEu) ?? "a outra pessoa";

  // Se o nome em "Meu estilo" bate com um remetente, já marca.
  useEffect(() => {
    if (!souEu && perfil.nome && remetentes.includes(perfil.nome)) setEu({ v: perfil.nome });
  }, [souEu, perfil.nome, remetentes, setEu]);

  const meuJeito = useMemo(
    () => (perfil.exemplos.length >= MIN_EXAMPLES ? fingerprint(perfil.exemplos.map((e) => e.resposta)) : null),
    [perfil.exemplos],
  );

  const podeGerar = recentes.length > 0 && Boolean(souEu) && recentes.some((m) => m.from !== souEu) && !loading;

  async function gerar() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/conversa", {
        method: "POST",
        headers: { "content-type": "application/json", "x-app-password": senha },
        signal: controller.signal,
        body: JSON.stringify({
          mensagens: recentes.map((m) => ({ eu: m.from === souEu, nome: m.from, texto: m.text.slice(0, 1000) })),
          objetivo,
          kind: settings.kind,
          tracos: settings.tracos,
          emoji: settings.emoji,
          perfil: profileForRequest(perfil),
          provider: settings.provider,
          model: settings.model,
          temperature: settings.temperatura,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao gerar");
      setResult({ ...data, ultima: [...recentes].reverse().find((m) => m.from !== souEu)?.text ?? "" });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") setError("Geração cancelada.");
      else setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }

  function salvarExemplo(contexto: string) {
    return (resposta: string) =>
      setPerfil((current) =>
        current.exemplos.some((e) => e.contexto === contexto && e.resposta === resposta)
          ? current
          : { ...current, exemplos: [...current.exemplos, { contexto, resposta }] },
      );
  }

  const card = (raw: string, seed: number, contexto: string) => (
    <ResultCard
      key={`${seed}-${raw}`}
      raw={raw}
      opts={settings.humanize}
      baseSeed={seed}
      telefone={settings.telefone}
      onSave={salvarExemplo(contexto)}
      meuJeito={meuJeito}
      onShown={noop}
      preferState="hidden"
      onPrefer={noop}
    />
  );

  return (
    <section className="grid">
      <div className="card">
        <label className="field">
          <span>Conversa (selecione as mensagens no WhatsApp → Copiar → cole aqui)</span>
          <textarea
            rows={8}
            value={colado}
            onChange={(event) => setColado(event.target.value)}
            placeholder={
              "[21:03, 21/09/2026] Ana: vc vem sexta?\n[21:05, 21/09/2026] Jef: acho q sim\n[21:40, 21/09/2026] Ana: preciso saber hj"
            }
          />
        </label>

        {colado.trim() && !mensagens.length && (
          <p className="error" role="alert">
            Não reconheci mensagens. Use o formato copiado do WhatsApp ou linhas &quot;Nome: texto&quot;.
          </p>
        )}

        {remetentes.length > 0 && (
          <div className="field">
            <span>Quem é você?</span>
            <div className="seg" role="group" aria-label="Quem é você na conversa">
              {remetentes.map((nome) => (
                <button key={nome} className={souEu === nome ? "on" : ""} onClick={() => setEu({ v: nome })}>
                  {nome}
                </button>
              ))}
            </div>
            <small className="muted">
              {mensagens.length > MAX_CONVERSATION
                ? `Usando as últimas ${MAX_CONVERSATION} de ${mensagens.length} mensagens.`
                : `${mensagens.length} mensagens reconhecidas.`}
              {souEu && ultima?.from === souEu && " A última mensagem é sua: vou sugerir uma continuação."}
              {remetentes.length === 1 && " Só achei um remetente."}
            </small>
          </div>
        )}

        <label className="field">
          <span>Objetivo (opcional)</span>
          <input
            maxLength={300}
            value={objetivo}
            onChange={(event) => setObjetivo(event.target.value)}
            placeholder="ex: remarcar pra sábado sem parecer furão"
          />
        </label>

        <button className="primary" disabled={!podeGerar} onClick={gerar}>
          {loading ? "Pensando…" : "Planejar resposta"}
        </button>
        {loading && (
          <div className="actions">
            <button className="act" onClick={() => abortRef.current?.abort()}>
              Cancelar
            </button>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <p className="muted small">
          Usa o provedor, a personalidade e o &quot;parecer que fui eu&quot; configurados nas abas Pergunta/Afirmação.
        </p>
      </div>

      <div className="results" aria-live="polite">
        {!result && !loading && (
          <div className="empty">
            <p>O plano, a resposta e as prováveis réplicas aparecem aqui.</p>
          </div>
        )}
        {result && (
          <>
            <p className="muted small">
              via <b>{result.providerLabel}</b> · {result.model}
              {result.fallbacks.length > 0 && <> · (pulou {result.fallbacks.length} por limite)</>}
            </p>
            {result.plano && (
              <p className="plan">
                <b>Plano:</b> {result.plano}
              </p>
            )}
            {card(result.resposta, 1, result.ultima)}
            {result.replicas.length > 0 && <h3 className="replies-title">Se a conversa seguir…</h3>}
            {result.replicas.map((replica, index) => (
              <div key={index} className="reply">
                <p className="them">
                  <small className="muted">se {outro} disser</small>
                  <br />
                  {replica.deles}
                </p>
                {card(replica.voce, index + 2, replica.deles)}
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
