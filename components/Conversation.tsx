"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  profileForRequest,
  SITUATIONS,
  type AgentOutput,
  type ConversationMode,
  type StyleProfile,
} from "@/lib/prompt";
import { useLocalState } from "@/lib/store";
import { MIN_EXAMPLES, fingerprint } from "@/lib/stylometry";
import type { Settings } from "@/lib/types";
import { MAX_CONVERSATION, listSenders, parseConversation } from "@/lib/whatsapp";
import { errorText, modelFields, postJson, requestTone } from "@/lib/api";
import { AudioButton, PrintButton } from "./MediaButtons";
import MessageReading from "./MessageReading";
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

const MODES: { id: ConversationMode; label: string }[] = [
  { id: "responder", label: "Responder" },
  { id: "iniciar", label: "Puxar assunto" },
];

function horaAtual() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function Conversation({ settings, perfil, setPerfil, senha }: Props) {
  const [colado, setColado] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [modo, setModo] = useState<ConversationMode>("responder");
  const [nomeOutro, setNomeOutro] = useState("");
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

  // Se o nome em "Meu estilo" bate com um remetente, já marca.
  useEffect(() => {
    if (!souEu && perfil.nome && remetentes.includes(perfil.nome)) setEu({ v: perfil.nome });
  }, [souEu, perfil.nome, remetentes, setEu]);

  const meuJeito = useMemo(
    () => (perfil.exemplos.length >= MIN_EXAMPLES ? fingerprint(perfil.exemplos.map((e) => e.resposta)) : null),
    [perfil.exemplos],
  );

  const temConversa = recentes.length > 0;
  const nomeDaPessoa = nomeOutro.trim() || (remetentes.find((nome) => nome !== souEu) ?? "");
  const podeGerar =
    !loading &&
    (modo === "responder"
      ? temConversa && Boolean(souEu) && recentes.some((m) => m.from !== souEu)
      : temConversa
        ? Boolean(souEu)
        : Boolean(nomeOutro.trim()));

  async function gerar() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const data = await postJson<Omit<Result, "ultima">>(
        "/api/conversa",
        {
          modo,
          mensagens: recentes.map((m) => ({
            eu: m.from === souEu,
            nome: m.from,
            texto: m.text.slice(0, 1000),
            hora: m.hora,
          })),
          nomeOutro: nomeDaPessoa,
          agora: horaAtual(),
          objetivo,
          tracos: settings.tracos,
          emoji: settings.emoji,
          perfil: profileForRequest(perfil),
          ...modelFields(settings),
        },
        senha,
        controller.signal,
      );
      setResult({ ...data, ultima: [...recentes].reverse().find((m) => m.from !== souEu)?.text ?? "" });
    } catch (caught) {
      setError(errorText(caught));
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
      onTone={(tom, atual) => requestTone({ tom, texto: atual, contexto, settings, perfil, senha })}
    />
  );

  // Última mensagem da outra pessoa e o que veio antes, para "Ler a mensagem".
  const ultimaIndex = recentes.findLastIndex((m) => m.from !== souEu);
  const ultimaDeles = ultimaIndex >= 0 ? recentes[ultimaIndex].text : "";
  const antes = recentes
    .slice(Math.max(0, ultimaIndex - 10), Math.max(0, ultimaIndex))
    .map((m) => `${m.from === souEu ? "Você" : m.from}: ${m.text}`)
    .join("\n");

  return (
    <section className="grid">
      <div className="card">
        <div className="field">
          <span>O que você quer fazer?</span>
          <div className="seg" role="group" aria-label="Modo">
            {MODES.map((item) => (
              <button key={item.id} className={modo === item.id ? "on" : ""} onClick={() => setModo(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>
            {modo === "responder"
              ? "Conversa (selecione as mensagens no WhatsApp → Copiar → cole aqui)"
              : "Conversa anterior (opcional: ajuda a achar um gancho)"}
          </span>
          <textarea
            rows={8}
            value={colado}
            onChange={(event) => setColado(event.target.value)}
            placeholder={
              "[21:03, 21/09/2026] Ana: vc vem sexta?\n[21:05, 21/09/2026] Jef: acho q sim\n[21:40, 21/09/2026] Ana: preciso saber hj"
            }
          />
        </label>

        <div className="tools">
          <PrintButton
            senha={senha}
            onText={(lido) => {
              setColado((current) => (current.trim() ? `${current.trimEnd()}\n${lido}` : lido));
              // No print, as suas mensagens (balões da direita) vêm como "Eu".
              if (/^Eu:/m.test(lido)) setEu({ v: "Eu" });
            }}
          />
          <AudioButton
            senha={senha}
            onText={(transcrito) => {
              const nome = nomeDaPessoa || "Outra pessoa";
              const linha = `${nome}: ${transcrito.replace(/\s*\n\s*/g, " ")}`;
              setColado((current) => (current.trim() ? `${current.trimEnd()}\n${linha}` : linha));
            }}
          />
        </div>

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
              {souEu &&
                ultima?.from === souEu &&
                (modo === "responder"
                  ? " A última mensagem é sua: vou sugerir uma continuação (ou use Puxar assunto)."
                  : " A última mensagem é sua: vou sugerir como retomar.")}
              {remetentes.length === 1 && " Só achei um remetente."}
            </small>
          </div>
        )}
        {modo === "responder" && souEu && ultimaDeles && (
          <MessageReading texto={ultimaDeles} contexto={antes} settings={settings} senha={senha} />
        )}

        {modo === "iniciar" && (
          <label className="field">
            <span>Com quem? {temConversa ? "(opcional)" : ""}</span>
            <input
              maxLength={80}
              value={nomeOutro}
              onChange={(event) => setNomeOutro(event.target.value)}
              placeholder={remetentes.find((nome) => nome !== souEu) ?? "ex: Ana, minha prima"}
            />
          </label>
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
        <div className="chips" role="group" aria-label="Situações difíceis">
          {SITUATIONS.map((situation) => (
            <button
              key={situation.id}
              className={objetivo === situation.objetivo ? "chip pos on" : "chip"}
              title={situation.objetivo}
              onClick={() => setObjetivo((current) => (current === situation.objetivo ? "" : situation.objetivo))}
            >
              {situation.label}
            </button>
          ))}
        </div>

        <button className="primary" disabled={!podeGerar} onClick={gerar}>
          {loading ? "Pensando…" : modo === "responder" ? "Planejar resposta" : "Sugerir como puxar assunto"}
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
            {result.quando && (
              <p className="when">
                <b>⏰ Quando mandar:</b> {result.quando}
              </p>
            )}
            {result.replicas.length > 0 && <h3 className="replies-title">Se a conversa seguir…</h3>}
            {result.replicas.map((replica, index) => (
              <div key={index} className="reply">
                <p className="them">
                  <small className="muted">se {nomeDaPessoa || "a outra pessoa"} disser</small>
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
