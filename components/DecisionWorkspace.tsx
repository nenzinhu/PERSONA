"use client";

import { useEffect, useRef, useState } from "react";
import { postJson, modelFields } from "@/lib/api";
import { useLocalState, useSessionState } from "@/lib/store";
import { parseDecisionRequest, type DecisionAction, type DecisionInput, type DecisionResult } from "@/lib/decisions";
import {
  protectText,
  restoreText,
  validateAliases,
  mapContentText,
  confirmPending,
  changePendingStatus,
  type AliasEntry,
  type PendingSuggestion,
  type SavedPending,
} from "@/lib/decision-local";
import type { Settings } from "@/lib/types";
import type { StyleProfile } from "@/lib/prompt";
import Icon from "./Icon";
import { FranklPauseModal } from "./cognitive/FranklPauseModal";
import { DistortionAlert } from "./cognitive/DistortionAlert";
import { analyzeDraftDistortions } from "@/lib/cognitive/cognitiveDistortions";
import { calculateEmotionalLoad } from "@/lib/cognitive/franklPause";

const INITIAL_FORM = {
  assunto: "",
  fonteA: "",
  fonteB: "",
  rascunho: "",
  objetivo: "",
  limites: "",
  intencao: "responder" as DecisionInput["intencao"],
  usarEstilo: false,
  usarMemorias: true,
};
const INITIAL_PRIVACY = { enabled: false, entries: [] as AliasEntry[] };
const INTENTS = [
  { id: "responder", label: "Responder" },
  { id: "esclarecer", label: "Esclarecer" },
  { id: "recusar", label: "Recusar" },
  { id: "encerrar", label: "Encerrar" },
  { id: "nao_responder", label: "Não responder" },
] as const;
const ACTIONS: Record<DecisionAction, string> = {
  resposta: "Preparar resposta",
  conferir: "Conferir rascunho",
  pendencias: "Encontrar pendências",
  conflitos: "Comparar mensagens",
};
type SpanResult = { scores: { id: string; label: string; probabilidade: number }[]; model: string };
type Prepared = { input: DecisionInput; aliases: AliasEntry[]; revision: number; span?: boolean };

function PendingEditor({
  item,
  onSave,
  label = "Confirmar e salvar",
}: {
  item: PendingSuggestion;
  onSave: (value: PendingSuggestion) => void;
  label?: string;
}) {
  const [draft, setDraft] = useState(item);
  const [confirmed, setConfirmed] = useState(false);
  const update = (key: keyof PendingSuggestion, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setConfirmed(false);
  };
  return (
    <div className="pending-editor">
      <label className="field">
        <span>Tipo de pendência</span>
        <select value={draft.tipo} onChange={(e) => update("tipo", e.target.value)}>
          <option value="pergunta">Pergunta em aberto</option>
          <option value="pedido">Pedido recebido</option>
          <option value="compromisso">Compromisso assumido</option>
        </select>
      </label>
      <label className="field">
        <span>O que está pendente</span>
        <textarea
          rows={2}
          maxLength={1500}
          value={draft.descricao}
          onChange={(e) => update("descricao", e.target.value)}
        />
      </label>
      <div className="row">
        <label className="field">
          <span>Responsável, se houver</span>
          <input maxLength={300} value={draft.responsavel} onChange={(e) => update("responsavel", e.target.value)} />
        </label>
        <label className="field">
          <span>Prazo, como foi combinado</span>
          <input maxLength={300} value={draft.prazo} onChange={(e) => update("prazo", e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Condição para acontecer</span>
        <input maxLength={1000} value={draft.condicao} onChange={(e) => update("condicao", e.target.value)} />
      </label>
      <blockquote>{draft.fonte}</blockquote>
      <label className="check-label">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        Conferi o trecho e confirmo este registro.
      </label>
      <button className="act" disabled={!confirmed || !draft.descricao.trim()} onClick={() => onSave(draft)}>
        {label}
      </button>
    </div>
  );
}

export default function DecisionWorkspace({
  settings,
  perfil,
  senha,
  openRouterReady,
}: {
  settings: Settings;
  perfil: StyleProfile;
  senha: string;
  openRouterReady: boolean;
}) {
  const [form, setForm] = useSessionState("decision-form", INITIAL_FORM);
  const [privacy, setPrivacy] = useSessionState("decision-privacy", INITIAL_PRIVACY);
  const [saved, setSaved] = useLocalState<SavedPending[]>("decision-pending", []);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [pause, setPause] = useState<string | null>(null);
  const [results, setResults] = useState<Partial<Record<DecisionAction, DecisionResult>>>({});
  const [spanResult, setSpanResult] = useState<SpanResult | null>(null);
  const [loading, setLoading] = useState<DecisionAction | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removed, setRemoved] = useState<SavedPending | null>(null);
  const abort = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const validSaved = saved.filter(
    (item) =>
      item && typeof item.assunto === "string" && typeof item.descricao === "string" && typeof item.fonte === "string",
  );
  const subjectSaved = validSaved.filter((item) => item.assunto === form.assunto.trim());

  function invalidate() {
    revision.current += 1;
    abort.current?.abort();
    abort.current = null;
    setPrepared(null);
    setPause(null);
    setResults({});
    setSpanResult(null);
    setLoading(null);
    setError("");
    setNotice("");
  }
  function change<K extends keyof typeof INITIAL_FORM>(key: K, value: (typeof INITIAL_FORM)[K]) {
    invalidate();
    setForm((current) => ({ ...current, [key]: value }));
  }
  function editPrivacy(next: typeof INITIAL_PRIVACY) {
    invalidate();
    setPrivacy(next);
  }
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    revision.current += 1;
    abort.current?.abort();
    abort.current = null;
    setLoading(null);
    setPrepared(null);
    setPause(null);
    setResults({});
    setSpanResult(null);
  }, [settings.provider, settings.model, settings.kind, settings.temperatura]);

  function prepare(acao: DecisionAction, span = false) {
    setError("");
    setPrepared(null);
    setPause(null);
    setNotice("");
    try {
      const memorias = form.usarMemorias
        ? subjectSaved
            .filter((item) => item.status === "aberto")
            .slice(-20)
            .map((item) =>
              `${item.tipo}: ${item.descricao}; responsável: ${item.responsavel || "não informado"}; prazo: ${item.prazo || "não informado"}; condição: ${item.condicao || "nenhuma registrada"}; confirmado em ${item.confirmadoEm}; fonte: ${item.fonte}`.slice(
                0,
                1000,
              ),
            )
        : [];
      const estilo = form.usarEstilo
        ? [perfil.descricao, ...perfil.exemplos.slice(-3).map((item) => item.resposta)].join("\n").slice(0, 2000)
        : "";
      const raw = {
        acao,
        fonteA: form.fonteA,
        fonteB: form.fonteB,
        rascunho: form.rascunho,
        intencao: form.intencao,
        objetivo: form.objetivo,
        limites: form.limites,
        memorias,
        estilo,
        ...modelFields(settings),
      };
      const aliases = privacy.enabled ? privacy.entries.filter((entry) => entry.original || entry.alias) : [];
      validateAliases(aliases, JSON.stringify(raw));
      const protectedInput = mapContentText(raw, (value) => protectText(value, aliases));
      const parsed = parseDecisionRequest(protectedInput);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Revise os campos antes de continuar.");
      setPrepared({
        input: parsed.data,
        aliases: aliases.map((entry) => ({ ...entry })),
        revision: revision.current,
        span,
      });
      requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não consegui preparar o envio.");
    }
  }

  function confirmSend() {
    if (!prepared || prepared.revision !== revision.current || abort.current) return;
    if (prepared.input.acao === "resposta") {
      const load = calculateEmotionalLoad([form.fonteA, form.fonteB].join("\n"), form.rascunho);
      if (load.score >= 50) {
        setPause(load.reason ?? "Revise a intenção antes de enviar à IA.");
        return;
      }
    }
    void send();
  }

  function reviewDraft() {
    setPause(null);
    setPrepared(null);
    requestAnimationFrame(() => draftRef.current?.focus());
  }

  async function send() {
    if (!prepared || prepared.revision !== revision.current || abort.current) return;
    const snapshot = prepared;
    const controller = new AbortController();
    abort.current = controller;
    setLoading(snapshot.input.acao);
    setPrepared(null);
    setPause(null);
    setError("");
    try {
      if (snapshot.span) {
        const data = await postJson<SpanResult>("/api/sinais", snapshot.input, senha, controller.signal);
        if (!controller.signal.aborted && snapshot.revision === revision.current) setSpanResult(data);
        return;
      }
      const data = await postJson<DecisionResult>("/api/decisoes", snapshot.input, senha, controller.signal);
      if (controller.signal.aborted || snapshot.revision !== revision.current) return;
      if (data.acao !== snapshot.input.acao) throw new Error("A análise veio em formato inesperado. Tente novamente.");
      const restored = mapContentText(data, (value) => restoreText(value, snapshot.aliases));
      if (restored.acao === "resposta") {
        setForm((current) => ({ ...current, rascunho: restored.texto }));
        setSpanResult(null);
        setResults((current) => ({ ...current, conferir: undefined, resposta: restored }));
      } else setResults((current) => ({ ...current, [restored.acao]: restored }));
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" }));
    } catch (caught) {
      if (!controller.signal.aborted)
        setError(caught instanceof Error ? caught.message : "Falha na análise. Tente novamente.");
    } finally {
      if (abort.current === controller) {
        abort.current = null;
        setLoading(null);
      }
    }
  }

  function savePending(item: PendingSuggestion, existing?: SavedPending) {
    try {
      if (
        !existing &&
        validSaved.some(
          (other) =>
            other.assunto === form.assunto.trim() && other.fonte === item.fonte && other.descricao === item.descricao,
        )
      )
        throw new Error("Este registro já está salvo neste assunto.");
      const confirmed = confirmPending(
        item,
        form.assunto,
        true,
        existing?.id ?? crypto.randomUUID(),
        new Date().toISOString(),
        existing,
      );
      setSaved((items) => [...items.filter((other) => other.id !== confirmed.id), confirmed].slice(-100));
      setNotice("Registro confirmado e salvo neste navegador.");
      invalidateAfterMemoryChange();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não consegui salvar.");
    }
  }
  function invalidateAfterMemoryChange() {
    revision.current += 1;
    abort.current?.abort();
    abort.current = null;
    setLoading(null);
    setPrepared(null);
    setResults((current) => ({ ...current, conferir: undefined }));
    setSpanResult(null);
  }
  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(form.rascunho);
      setNotice("Rascunho copiado.");
    } catch {
      setError("Não consegui copiar. Selecione o rascunho e copie manualmente.");
    }
  }
  const review = results.conferir?.acao === "conferir" ? results.conferir : null;
  const pending = results.pendencias?.acao === "pendencias" ? results.pendencias : null;
  const conflicts = results.conflitos?.acao === "conflitos" ? results.conflitos : null;

  return (
    <div className="decision-workspace">
      <div className="decision-intro">
        <Icon name="analyze" />
        <p>
          Escolha seu objetivo, confira o que foi dito e decida o que vale responder. Nada é enviado para outra pessoa
          pelo Persona.
        </p>
      </div>
      <div className="decision-columns">
        <section className="composer decision-compose" aria-labelledby="decision-source-heading">
          <div className="panel-heading">
            <Icon name="message" />
            <h2 id="decision-source-heading">Contexto e intenção</h2>
          </div>
          <label className="field">
            <span>Assunto ou contato</span>
            <input
              list="decision-subjects"
              maxLength={120}
              value={form.assunto}
              onChange={(e) => change("assunto", e.target.value)}
              placeholder="Ex.: plantão de sexta ou devolução de objetos"
            />
            <small className="muted">
              Separa as pendências de cada conversa. Use a mesma identificação para retomá-la.
            </small>
          </label>
          <datalist id="decision-subjects">
            {Array.from(new Set(validSaved.map((item) => item.assunto))).map((subject) => (
              <option value={subject} key={subject} />
            ))}
          </datalist>
          <label className="field">
            <span>Mensagem recebida</span>
            <textarea
              rows={5}
              maxLength={6000}
              value={form.fonteA}
              onChange={(e) => change("fonteA", e.target.value)}
              placeholder="Cole o texto que você quer analisar…"
            />
          </label>
          <fieldset className="decision-intent">
            <legend>O que você quer fazer?</legend>
            <div className="seg wrap">
              {INTENTS.map((intent) => (
                <button
                  key={intent.id}
                  aria-pressed={form.intencao === intent.id}
                  className={form.intencao === intent.id ? "on" : ""}
                  onClick={() => change("intencao", intent.id)}
                >
                  {intent.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Resultado que quero alcançar</span>
            <input
              maxLength={1000}
              value={form.objetivo}
              onChange={(e) => change("objetivo", e.target.value)}
              placeholder="Ex.: resolver a devolução sem retomar a relação"
            />
          </label>
          <label className="field">
            <span>Limites que quero preservar</span>
            <textarea
              rows={2}
              maxLength={1500}
              value={form.limites}
              onChange={(e) => change("limites", e.target.value)}
              placeholder="Ex.: não confirmar disponibilidade antes de verificar"
            />
          </label>
          <label className="check-label">
            <input type="checkbox" checked={form.usarEstilo} onChange={(e) => change("usarEstilo", e.target.checked)} />
            Incluir minha descrição de estilo e até 3 exemplos na prévia
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.usarMemorias}
              onChange={(e) => change("usarMemorias", e.target.checked)}
            />
            Considerar registros abertos deste assunto ({subjectSaved.filter((item) => item.status === "aberto").length}
            )
          </label>
          {form.intencao === "nao_responder" && (
            <p className="decision-note">
              Você escolheu não responder. A geração está desativada; ainda pode conferir informações e organizar
              pendências.
            </p>
          )}
          <div className="decision-actions">
            <button
              className="primary"
              disabled={!!loading || !form.fonteA.trim() || form.intencao === "nao_responder"}
              onClick={() => prepare("resposta")}
            >
              <Icon name="reply" />
              Preparar resposta
            </button>
            <button className="act" disabled={!!loading || !form.fonteA.trim()} onClick={() => prepare("pendencias")}>
              Encontrar pendências
            </button>
          </div>

          <details className="more">
            <summary>Comparar com outra mensagem</summary>
            <label className="field">
              <span>Segunda mensagem ou orientação</span>
              <textarea
                rows={4}
                maxLength={6000}
                value={form.fonteB}
                onChange={(e) => change("fonteB", e.target.value)}
                placeholder="Cole a outra versão, incluindo a data se souber…"
              />
            </label>
            <p className="muted small">
              A comparação mostra divergências e prepara uma pergunta. Uma mensagem posterior pode ser uma atualização
              válida.
            </p>
            <button
              className="act"
              disabled={!!loading || !form.fonteA.trim() || !form.fonteB.trim()}
              onClick={() => prepare("conflitos")}
            >
              Comparar mensagens
            </button>
          </details>

          <details className="more decision-privacy">
            <summary>
              <Icon name="lock" /> Contexto protegido {privacy.enabled ? "· ativo nesta área" : "· opcional"}
            </summary>
            <p className="muted small">
              Substitua nomes e códigos antes dos envios desta área. A proteção não se aplica às outras abas, áudios ou
              prints e não garante anonimato.
            </p>
            <label className="check-label">
              <input
                type="checkbox"
                checked={privacy.enabled}
                onChange={(e) => editPrivacy({ ...privacy, enabled: e.target.checked })}
              />
              Usar substituições nesta área
            </label>
            {privacy.entries.map((entry, index) => (
              <div className="alias-row" key={index}>
                <label className="field">
                  <span>Termo original {index + 1}</span>
                  <input
                    maxLength={120}
                    value={entry.original}
                    onChange={(e) =>
                      editPrivacy({
                        ...privacy,
                        entries: privacy.entries.map((item, i) =>
                          i === index ? { ...item, original: e.target.value } : item,
                        ),
                      })
                    }
                    placeholder="Nome, local ou código"
                  />
                </label>
                <label className="field">
                  <span>Apelido {index + 1}</span>
                  <input
                    maxLength={120}
                    value={entry.alias}
                    onChange={(e) =>
                      editPrivacy({
                        ...privacy,
                        entries: privacy.entries.map((item, i) =>
                          i === index ? { ...item, alias: e.target.value } : item,
                        ),
                      })
                    }
                    placeholder="Pessoa A"
                  />
                </label>
                <button
                  className="act"
                  aria-label={`Remover substituição ${index + 1}`}
                  onClick={() => editPrivacy({ ...privacy, entries: privacy.entries.filter((_, i) => i !== index) })}
                >
                  Remover
                </button>
              </div>
            ))}
            <div className="row">
              <button
                className="act"
                disabled={privacy.entries.length >= 20}
                onClick={() => editPrivacy({ ...privacy, entries: [...privacy.entries, { original: "", alias: "" }] })}
              >
                Adicionar substituição
              </button>
              <button
                className="act ghost"
                disabled={!privacy.entries.length}
                onClick={() => editPrivacy({ enabled: false, entries: [] })}
              >
                Apagar substituições
              </button>
            </div>
            <p className="muted small">
              Trocas literais e sensíveis a maiúsculas. Revise variações do nome na prévia. O mapa fica nesta sessão do
              navegador e não é enviado à IA.
            </p>
          </details>
        </section>

        <section className="decision-results" ref={resultRef} aria-label="Rascunho e análises">
          <div className="panel-heading">
            <Icon name="reply" />
            <h2>Sua decisão, suas palavras</h2>
          </div>
          <label className="field">
            <span>Rascunho para editar ou conferir</span>
            <textarea
              ref={draftRef}
              rows={6}
              maxLength={4000}
              value={form.rascunho}
              onChange={(e) => change("rascunho", e.target.value)}
              placeholder="Escreva sua resposta ou prepare uma com o Persona…"
            />
          </label>
          <DistortionAlert distortions={analyzeDraftDistortions(form.rascunho)} />
          <div className="row">
            <button
              className="act"
              disabled={!!loading || !form.fonteA.trim() || !form.rascunho.trim()}
              onClick={() => prepare("conferir")}
            >
              <Icon name="analyze" />
              Conferir rascunho
            </button>
            <button className="act" disabled={!form.rascunho.trim()} onClick={copyDraft}>
              Copiar rascunho
            </button>
          </div>
          <p className="muted small">
            A conferência compara o rascunho com suas fontes e limites. Não comprova fatos externos.
          </p>
          <details className="more">
            <summary>Avaliação adicional · Span-01 Lite</summary>
            <p className="muted small">
              O modelo de decisões do OpenRouter estima sinais de compromissos adicionais, limites contrariados e
              condições preservadas. As estimativas não são fatos comprovados.
            </p>
            <button
              className="act"
              disabled={!openRouterReady || !!loading || !form.fonteA.trim() || !form.rascunho.trim()}
              onClick={() => prepare("conferir", true)}
            >
              Avaliar com Span-01 Lite
            </button>
            {!openRouterReady && <p className="muted small">Requer chave OpenRouter configurada no servidor.</p>}
          </details>

          {prepared && (
            <div className="send-preview" ref={previewRef} role="region" aria-label="Revisão antes do envio">
              <h3>Revise antes de enviar à IA</h3>
              <p className="small">
                Ação: <strong>{prepared.span ? "Avaliar com Span-01 Lite" : ACTIONS[prepared.input.acao]}</strong>.{" "}
                {prepared.aliases.length
                  ? "As substituições abaixo já foram aplicadas."
                  : "Nenhuma substituição está aplicada."}
              </p>
              <dl>
                {(
                  [
                    ["Mensagem recebida", prepared.input.fonteA],
                    ["Segunda mensagem", prepared.input.fonteB],
                    ["Rascunho", prepared.input.rascunho],
                    ["Intenção", INTENTS.find((i) => i.id === prepared.input.intencao)?.label || ""],
                    ["Objetivo", prepared.input.objetivo],
                    ["Limites", prepared.input.limites],
                    ["Estilo e exemplos", prepared.input.estilo],
                    ["Registros considerados", prepared.input.memorias.join("\n")],
                  ] as [string, string][]
                )
                  .filter(([, text]) => text)
                  .map(([label, text]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{text}</dd>
                    </div>
                  ))}
              </dl>
              <p className="muted small">
                Provedor:{" "}
                {prepared.span
                  ? "OpenRouter · respan/span-01-lite:free"
                  : prepared.input.provider === "auto"
                    ? "automático, conforme suas configurações"
                    : prepared.input.provider}
                . Nenhum envio acontece antes da confirmação.
              </p>
              <div className="row">
                <button className="primary" onClick={confirmSend}>
                  Confirmar envio à IA
                </button>
                <button className="act" onClick={() => setPrepared(null)}>
                  Voltar sem enviar
                </button>
              </div>
            </div>
          )}
          {pause && prepared && (
            <FranklPauseModal reason={pause} onCancel={reviewDraft} onConfirm={() => void send()} />
          )}
          {loading && (
            <div className="generation-status" role="status">
              <span className="loading-dot" />
              Analisando…{" "}
              <button
                className="act"
                onClick={() => {
                  abort.current?.abort();
                  abort.current = null;
                  setLoading(null);
                  setNotice("Envio cancelado. Você pode tentar novamente.");
                }}
              >
                Cancelar análise
              </button>
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="decision-note" role="status">
              {notice}
            </p>
          )}
          {spanResult && (
            <section className="decision-output" aria-label="Sinais do Span-01 Lite">
              <h3>Sinais do Span-01 Lite</h3>
              <p className="muted small">
                Estimativa do modelo para a presença de cada sinal, não garantia de correção.
              </p>
              <dl className="span-scores">
                {spanResult.scores.map((score) => (
                  <div key={score.id}>
                    <dt>{score.label}</dt>
                    <dd>{Math.round(score.probabilidade * 100)}%</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {review && (
            <section className="decision-output" aria-label="Conferência do rascunho">
              <h3>Conferência do rascunho</h3>
              <p>{review.resumo}</p>
              {!review.observacoes.length && (
                <p className="muted small">A análise não apontou divergências. Ainda vale revisar antes de usar.</p>
              )}
              {review.observacoes.map((item, i) => (
                <div className="evidence-item" key={i}>
                  <strong>
                    {
                      {
                        contradicao: "Possível contradição",
                        sem_apoio: "Informação sem apoio",
                        limite: "Limite declarado",
                        omissao: "Informação omitida",
                      }[item.tipo]
                    }
                  </strong>
                  <p>{item.explicacao}</p>
                  {item.fonte && (
                    <blockquote>
                      <span>Fonte ou limite</span>
                      {item.fonte}
                    </blockquote>
                  )}
                  {item.rascunho && (
                    <blockquote>
                      <span>Seu rascunho</span>
                      {item.rascunho}
                    </blockquote>
                  )}
                </div>
              ))}
            </section>
          )}
          {conflicts && (
            <section className="decision-output" aria-label="Comparação das mensagens">
              <h3>O que diverge entre as mensagens</h3>
              {!conflicts.conflitos.length && <p>Nenhum conflito explícito foi apontado nesta comparação.</p>}
              {conflicts.conflitos.map((item, i) => (
                <div className="evidence-item" key={i}>
                  <div className="source-pair">
                    <blockquote>
                      <span>Primeira mensagem</span>
                      {item.trechoA}
                    </blockquote>
                    <blockquote>
                      <span>Segunda mensagem</span>
                      {item.trechoB}
                    </blockquote>
                  </div>
                  <p>{item.explicacao}</p>
                </div>
              ))}
              {conflicts.pergunta && (
                <>
                  <h3>Pergunta para esclarecer</h3>
                  <p>{conflicts.pergunta}</p>
                  <button className="act" onClick={() => change("rascunho", conflicts.pergunta)}>
                    Usar como rascunho
                  </button>
                </>
              )}
            </section>
          )}
          {pending && (
            <section className="decision-output" aria-label="Sugestões de pendências">
              <h3>Pendências encontradas</h3>
              <p className="muted small">
                Revise e confirme cada item. Um pedido recebido não significa compromisso assumido.
              </p>
              {!form.assunto.trim() && (
                <p className="decision-note">Preencha “Assunto ou contato” antes de salvar um registro.</p>
              )}
              {!pending.itens.length && <p>Nenhuma pendência explícita foi identificada.</p>}
              {pending.itens.map((item, i) => (
                <PendingEditor key={`${i}-${item.fonte}`} item={item} onSave={(value) => savePending(value)} />
              ))}
            </section>
          )}
        </section>
      </div>
      <section className="decision-ledger" aria-labelledby="pending-heading">
        <div className="panel-heading">
          <Icon name="practice" />
          <h2 id="pending-heading">Registros confirmados deste assunto</h2>
        </div>
        <p className="muted small">
          Ficam neste navegador e só entram em análises deste mesmo assunto quando a opção está marcada. Corrija ou
          conclua o que deixou de valer.
        </p>
        {!subjectSaved.length && (
          <p className="muted">
            {form.assunto.trim()
              ? "Ainda não há registros confirmados para este assunto."
              : "Informe o assunto acima para ver suas pendências."}
          </p>
        )}
        {subjectSaved.map((item) => (
          <article className="ledger-item" key={item.id}>
            <div className="ledger-top">
              <strong>{item.descricao}</strong>
              <span className={item.status === "concluido" ? "ledger-status done" : "ledger-status"}>
                {item.status === "concluido" ? "Concluído" : "Em aberto"}
              </span>
            </div>
            <p className="small">
              {item.tipo === "compromisso" ? "Compromisso" : item.tipo === "pedido" ? "Pedido" : "Pergunta"} ·{" "}
              {item.responsavel || "Responsável não informado"}
              {item.prazo && ` · Prazo: ${item.prazo}`}
            </p>
            {item.condicao && <p className="small">Condição: {item.condicao}</p>}
            <blockquote>{item.fonte}</blockquote>
            <p className="muted small">Confirmado em {new Date(item.confirmadoEm).toLocaleString("pt-BR")}</p>
            <div className="row">
              <button
                className="act"
                onClick={() => {
                  setSaved((items) =>
                    items.map((other) =>
                      other.id === item.id
                        ? changePendingStatus(other, item.status === "aberto" ? "concluido" : "aberto")
                        : other,
                    ),
                  );
                  invalidateAfterMemoryChange();
                }}
              >
                {item.status === "aberto" ? "Concluir" : "Reabrir"}
              </button>
              <button
                className="act ghost"
                onClick={() => {
                  setRemoved(item);
                  setSaved((items) => items.filter((other) => other.id !== item.id));
                  invalidateAfterMemoryChange();
                }}
              >
                Excluir registro
              </button>
            </div>
            <details className="more">
              <summary>Corrigir registro</summary>
              <PendingEditor item={item} onSave={(value) => savePending(value, item)} label="Confirmar edição" />
            </details>
          </article>
        ))}
        {removed && (
          <p className="decision-note" role="status">
            Registro excluído.{" "}
            <button
              className="link-button"
              onClick={() => {
                setSaved((items) => [...items, removed]);
                setRemoved(null);
                invalidateAfterMemoryChange();
              }}
            >
              Desfazer
            </button>
          </p>
        )}
      </section>
      <p className="muted small">
        Fontes, rascunho e substituições ficam nesta sessão. Os registros confirmados permanecem no navegador. As
        análises só usam o conteúdo que você aprovar na prévia.
      </p>
    </div>
  );
}
