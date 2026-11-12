"use client";

import { useEffect, useRef, useState } from "react";
import { errorText, modelFields, postJson } from "@/lib/api";
import { humanize } from "@/lib/humanize";
import { profileForRequest, type AgentOutput, type StyleProfile } from "@/lib/prompt";
import { MAX_SIM_TURNS, type Evaluation, type SimPerson, type SimTurn } from "@/lib/simulator";
import type { Settings } from "@/lib/types";
import { parseConversation } from "@/lib/whatsapp";
import { useLocalState } from "@/lib/store";
import { addTrainingEntry, trainingProgress, type TrainingEntry } from "@/lib/training-journal";

interface Props {
  settings: Settings;
  perfil: StyleProfile;
  senha: string;
}

const EU = /^(eu|você|voce|me)$/i;

/** Aba Treino: a IA faz o papel da outra pessoa para você ensaiar uma conversa difícil (ideia 8). */
export default function Simulator({ settings, perfil, senha }: Props) {
  const [pessoa, setPessoa] = useState<SimPerson>({ nome: "", jeito: "", situacao: "" });
  const [colado, setColado] = useState("");
  const [quemComeca, setQuemComeca] = useState<"eu" | "ela">("eu");
  const [historico, setHistorico] = useState<SimTurn[] | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState<"" | "resposta" | "ajuda" | "avaliar">("");
  const [error, setError] = useState("");
  const [avaliacao, setAvaliacao] = useState<Evaluation | null>(null);
  const [journal, setJournal] = useLocalState<TrainingEntry[]>("training-journal", []);
  const progresso = trainingProgress(journal);
  const abortRef = useRef<AbortController | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [historico, loading]);

  const nome = pessoa.nome.trim() || "a pessoa";
  const cheio = (historico?.length ?? 0) >= MAX_SIM_TURNS;

  async function call<T>(task: (signal: AbortSignal) => Promise<T>, kind: typeof loading): Promise<T | null> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(kind);
    setError("");
    try {
      return await task(controller.signal);
    } catch (caught) {
      setError(errorText(caught));
      return null;
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading("");
    }
  }

  function simular(turns: SimTurn[], acao: "responder" | "avaliar", signal: AbortSignal) {
    return postJson<{ texto: string } & Evaluation>(
      "/api/simular",
      { acao, pessoa, historico: turns.slice(-MAX_SIM_TURNS), ...modelFields(settings) },
      senha,
      signal,
    );
  }

  async function pessoaResponde(turns: SimTurn[]) {
    const data = await call((signal) => simular(turns, "responder", signal), "resposta");
    if (data) setHistorico([...turns, { eu: false, texto: data.texto }]);
  }

  function comecar() {
    // Conversa real colada (opcional) vira o começo do treino.
    const inicio: SimTurn[] = parseConversation(colado)
      .slice(-MAX_SIM_TURNS + 4)
      .map((m) => ({ eu: EU.test(m.from) || (Boolean(perfil.nome) && m.from === perfil.nome), texto: m.text }));
    setHistorico(inicio);
    setAvaliacao(null);
    setDraft("");
    setError("");
    const ultimaEhMinha = inicio.at(-1)?.eu ?? false;
    if ((inicio.length === 0 && quemComeca === "ela") || ultimaEhMinha) pessoaResponde(inicio);
  }

  function enviar() {
    const texto = draft.trim();
    if (!historico || !texto || loading || cheio) return;
    const turns = [...historico, { eu: true, texto }];
    setHistorico(turns);
    setDraft("");
    pessoaResponde(turns);
  }

  async function ajudar() {
    if (!historico) return;
    const temDela = historico.some((turn) => !turn.eu);
    const data = await call(
      (signal) =>
        postJson<AgentOutput>(
          "/api/conversa",
          {
            modo: temDela && !historico.at(-1)?.eu ? "responder" : "iniciar",
            mensagens: historico
              .slice(-40)
              .map((turn) => ({ eu: turn.eu, nome: turn.eu ? "Eu" : nome, texto: turn.texto })),
            nomeOutro: pessoa.nome,
            objetivo: pessoa.situacao,
            tracos: settings.tracos,
            emoji: settings.emoji,
            perfil: profileForRequest(perfil),
            ...modelFields(settings),
          },
          senha,
          signal,
        ),
      "ajuda",
    );
    if (data) setDraft(humanize(data.resposta, { ...settings.humanize, typoRate: 0, seed: Date.now() }));
  }

  async function avaliar() {
    if (!historico) return;
    const data = await call((signal) => simular(historico, "avaliar", signal), "avaliar");
    if (data) {
      setAvaliacao({ funcionou: data.funcionou, melhorar: data.melhorar, nota: data.nota });
      setJournal((entries) =>
        addTrainingEntry(
          entries,
          {
            date: new Date().toISOString(),
            situacao: pessoa.situacao || pessoa.nome || "Sem situação",
            nota: data.nota ?? null,
            resumo: data.funcionou ?? "",
          },
          crypto.randomUUID(),
        ),
      );
    }
  }

  function recomecar() {
    abortRef.current?.abort();
    setHistorico(null);
    setAvaliacao(null);
    setDraft("");
    setError("");
  }

  return (
    <section className="grid">
      <div className="card">
        <h2>Treinar uma conversa</h2>
        <p className="muted small">A IA faz o papel da outra pessoa. Você escreve como faria de verdade.</p>
        <label className="field">
          <span>Com quem?</span>
          <input
            maxLength={60}
            value={pessoa.nome}
            disabled={historico !== null}
            onChange={(event) => setPessoa((current) => ({ ...current, nome: event.target.value }))}
            placeholder="ex: Carlos, meu chefe"
          />
        </label>
        <label className="field">
          <span>Como essa pessoa é?</span>
          <textarea
            rows={2}
            maxLength={500}
            value={pessoa.jeito}
            disabled={historico !== null}
            onChange={(event) => setPessoa((current) => ({ ...current, jeito: event.target.value }))}
            placeholder="ex: impaciente, responde seco, odeia enrolação"
          />
        </label>
        <label className="field">
          <span>O que você quer treinar?</span>
          <input
            maxLength={300}
            value={pessoa.situacao}
            disabled={historico !== null}
            onChange={(event) => setPessoa((current) => ({ ...current, situacao: event.target.value }))}
            placeholder="ex: pedir aumento sem parecer desesperado"
          />
        </label>
        <details className="more">
          <summary>Começar de uma conversa real (opcional)</summary>
          <textarea
            rows={4}
            value={colado}
            disabled={historico !== null}
            onChange={(event) => setColado(event.target.value)}
            placeholder={
              "Cole do WhatsApp ou escreva linhas Nome: texto.\nSuas mensagens: use Eu (ou o seu nome em Meu estilo)."
            }
          />
        </details>
        {!colado.trim() && (
          <div className="field">
            <span>Quem começa?</span>
            <div className="seg" role="group" aria-label="Quem começa">
              <button
                className={quemComeca === "eu" ? "on" : ""}
                disabled={historico !== null}
                onClick={() => setQuemComeca("eu")}
              >
                Eu
              </button>
              <button
                className={quemComeca === "ela" ? "on" : ""}
                disabled={historico !== null}
                onClick={() => setQuemComeca("ela")}
              >
                {pessoa.nome.trim() || "A pessoa"}
              </button>
            </div>
          </div>
        )}
        {historico === null ? (
          <button className="primary" disabled={!pessoa.nome.trim()} onClick={comecar}>
            Começar treino
          </button>
        ) : (
          <div className="actions">
            <button className="act" disabled={Boolean(loading) || !historico.some((t) => t.eu)} onClick={avaliar}>
              {loading === "avaliar" ? "Avaliando…" : "📋 Avaliar"}
            </button>
            <button className="act ghost" onClick={recomecar}>
              Recomeçar
            </button>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="results" aria-live="polite">
        {historico === null ? (
          <div className="empty">
            <p>Descreva a pessoa e comece. Ela responde como responderia de verdade.</p>
            <p className="muted small">No fim, toque em Avaliar para ver o que funcionou e o que melhorar.</p>
          </div>
        ) : (
          <>
            <div className="sim-chat" ref={chatRef}>
              {historico.length === 0 && !loading && <p className="muted small">Mande a primeira mensagem.</p>}
              {historico.map((turn, index) => (
                <p key={index} className={turn.eu ? "sim-msg me" : "sim-msg them"}>
                  {turn.texto}
                </p>
              ))}
              {loading === "resposta" && <p className="muted small">{nome} está digitando…</p>}
            </div>
            <div className="sim-compose">
              <textarea
                rows={2}
                value={draft}
                maxLength={1000}
                disabled={cheio}
                aria-label="Sua mensagem"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    enviar();
                  }
                }}
                placeholder={cheio ? "Limite do treino: avalie ou recomece." : "Sua mensagem (Enter envia)"}
              />
              <div className="actions">
                <button
                  className="primary small-primary"
                  disabled={!draft.trim() || Boolean(loading) || cheio}
                  onClick={enviar}
                >
                  Enviar
                </button>
                <button
                  className="act"
                  disabled={Boolean(loading) || cheio}
                  onClick={ajudar}
                  title="Sugere a sua próxima mensagem, no seu estilo"
                >
                  {loading === "ajuda" ? "Pensando…" : "💡 Me ajuda"}
                </button>
              </div>
            </div>
            {journal.length > 0 && (
              <section className="training-panel" aria-labelledby="training-journal-heading">
                <h3 id="training-journal-heading">Sua jornada de treino</h3>
                <div className="training-summary">
                  <span>{progresso.total} ensaio(s)</span>
                  {progresso.media !== null && <span>Média {progresso.media}/10</span>}
                  {progresso.ultima !== null && <span>Última {progresso.ultima}/10</span>}
                  {progresso.tendencia !== null && (
                    <span>
                      {progresso.tendencia > 0 ? "Subindo" : progresso.tendencia < 0 ? "Caindo" : "Estável"}{" "}
                      {progresso.tendencia > 0 ? `+${progresso.tendencia}` : progresso.tendencia}
                    </span>
                  )}
                </div>
                <ul className="training-list">
                  {journal.slice(0, 6).map((entry) => (
                    <li key={entry.id}>
                      <time dateTime={entry.date}>{new Date(entry.date).toLocaleDateString("pt-BR")}</time>
                      <strong>{entry.situacao}</strong>
                      {entry.nota !== null && <span>Nota {entry.nota}/10</span>}
                    </li>
                  ))}
                </ul>
                <div className="actions">
                  <button className="act ghost" onClick={() => setJournal([])}>
                    Limpar histórico
                  </button>
                </div>
                <p className="muted small">
                  Fica só neste navegador. A tendência compara a média dos três últimos ensaios com a dos três
                  anteriores.
                </p>
              </section>
            )}
            {avaliacao && (
              <div className="evaluation">
                {avaliacao.nota !== null && (
                  <p className="eval-score">
                    Nota <b>{avaliacao.nota}</b>/10
                  </p>
                )}
                {avaliacao.funcionou && (
                  <>
                    <h3>✅ Funcionou</h3>
                    <p>{avaliacao.funcionou}</p>
                  </>
                )}
                {avaliacao.melhorar && (
                  <>
                    <h3>🔧 Melhorar</h3>
                    <p>{avaliacao.melhorar}</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
