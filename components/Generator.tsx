"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { profileForRequest, type Mode, type Stance, type StyleProfile } from "@/lib/prompt";
import { TEXT_KINDS, rankModels, recommend, type ProviderId } from "@/lib/providers";
import { MAX_TRAITS, NEGATIVE_TRAITS, POSITIVE_TRAITS } from "@/lib/traits";
import { useLocalState } from "@/lib/store";
import { MIN_EXAMPLES, calibrate, fingerprint } from "@/lib/stylometry";
import type { Preference } from "@/lib/dataset";
import type { GeneratedHistoryItem, ProviderStatus, Settings } from "@/lib/types";
import { requestTone } from "@/lib/api";
import { AudioButton } from "./MediaButtons";
import Fader from "./Fader";
import MessageReading from "./MessageReading";
import ResultCard from "./ResultCard";

interface Props {
  mode: Mode;
  settings: Settings;
  setSettings: (fn: (s: Settings) => Settings) => void;
  perfil: StyleProfile;
  setPerfil: (fn: (p: StyleProfile) => StyleProfile) => void;
  providers: ProviderStatus[];
  senha: string;
}

const STANCES: { id: Stance; label: string }[] = [
  { id: "concordar", label: "Concordar" },
  { id: "discordar", label: "Discordar" },
  { id: "neutro", label: "Neutro" },
  { id: "curioso", label: "Curioso" },
];

interface Result {
  variations: string[];
  providerLabel: string;
  model: string;
  fallbacks: string[];
  texto: string;
}

export default function Generator({ mode, settings, setSettings, perfil, setPerfil, providers, senha }: Props) {
  const [texto, setTexto] = useState("");
  const [contexto, setContexto] = useState("");
  const [stance, setStance] = useState<Stance>("concordar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useLocalState<GeneratedHistoryItem[]>("history", []);
  const [, setPreferencias] = useLocalState<Preference[]>("preferencias", []);
  const [preferred, setPreferred] = useState<number | null>(null);
  const [calibrado, setCalibrado] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  // Texto que cada card está mostrando agora (após embaralhar/editar), para o par do teste A/B.
  const shownRef = useRef<string[]>([]);

  const meuJeito = useMemo(
    () => (perfil.exemplos.length >= MIN_EXAMPLES ? fingerprint(perfil.exemplos.map((e) => e.resposta)) : null),
    [perfil.exemplos],
  );

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => setPreferred(null), [result]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));
  const setH = (key: keyof Settings["humanize"], value: number | boolean) =>
    setSettings((current) => ({ ...current, humanize: { ...current.humanize, [key]: value } }));

  const configured = providers.filter((provider) => provider.configured);
  const best = useMemo(() => recommend(settings.kind, configured)[0], [settings.kind, configured]);
  const currentProvider = providers.find((provider) => provider.id === settings.provider);
  const rankedModels = useMemo(
    () => rankModels(settings.kind, currentProvider?.models ?? []),
    [settings.kind, currentProvider],
  );
  const selectedModel = rankedModels.find((model) => model.id === settings.model) ?? rankedModels[0];
  const kindLabel = TEXT_KINDS.find((kind) => kind.id === settings.kind)?.label.toLowerCase() ?? settings.kind;

  // Modelo salvo que saiu do catálogo (ou do *_MODELS) seria recusado pelo servidor: volta para o melhor.
  useEffect(() => {
    if (!currentProvider || settings.provider === "custom" || !settings.model) return;
    if (!currentProvider.models.some((model) => model.id === settings.model)) {
      setSettings((current) => ({ ...current, model: "" }));
    }
  }, [currentProvider, settings.provider, settings.model, setSettings]);

  function toggleTrait(trait: string) {
    setSettings((current) => {
      const has = current.tracos.includes(trait);
      if (!has && current.tracos.length >= MAX_TRAITS) return current;
      return { ...current, tracos: has ? current.tracos.filter((item) => item !== trait) : [...current.tracos, trait] };
    });
  }

  async function gerar() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json", "x-app-password": senha },
        signal: controller.signal,
        body: JSON.stringify({
          mode,
          texto,
          contextoExtra: contexto,
          kind: settings.kind,
          stance: mode === "afirmacao" ? stance : undefined,
          tracos: settings.tracos,
          emoji: settings.emoji,
          variacoes: settings.variacoes,
          perfil: profileForRequest(perfil),
          provider: settings.provider,
          model: settings.model,
          temperature: settings.temperatura,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao gerar");
      const nextResult: Result = { ...data, texto };
      setResult(nextResult);
      setHistory((items) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            mode,
            texto,
            respostas: data.variations,
            providerLabel: data.providerLabel,
            model: data.model,
            createdAt: new Date().toISOString(),
          },
          ...items,
        ].slice(0, 20),
      );
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setError("Geração cancelada.");
      } else {
        setError(caught instanceof Error ? caught.message : String(caught));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }

  function salvarExemplo(resposta: string) {
    if (!result) return;
    setPerfil((current) => ({ ...current, exemplos: [...current.exemplos, { contexto: result.texto, resposta }] }));
  }

  function calibrar() {
    if (!meuJeito) return;
    const c = calibrate(meuJeito);
    setSettings((current) => ({ ...current, emoji: c.emoji, humanize: { ...current.humanize, ...c.humanize } }));
    const partes = [
      c.humanize.abbreviation !== undefined && `${c.humanize.abbreviation}% abreviação`,
      c.humanize.typoRate !== undefined && `${c.humanize.typoRate}% erro`,
      c.humanize.casual !== undefined && (c.humanize.casual ? "sem ponto final" : "com ponto final"),
      c.emoji && "com emoji",
    ].filter(Boolean);
    setCalibrado(`Calibrado com ${meuJeito.samples} exemplos: ${partes.join(", ") || "nada mensurável ainda"}.`);
  }

  function preferir(index: number, clean: string) {
    if (!result || preferred !== null) return;
    const chosen = shownRef.current[index] ?? clean;
    const pares: Preference[] = result.variations
      .map((_, i) => shownRef.current[i])
      .filter((rejected, i): rejected is string => i !== index && Boolean(rejected) && rejected !== chosen)
      .map((rejected) => ({ contexto: result.texto, chosen, rejected }));
    setPreferencias((items) => [...pares, ...items].slice(0, 200));
    setPerfil((current) =>
      current.exemplos.some((e) => e.contexto === result.texto && e.resposta === clean)
        ? current
        : { ...current, exemplos: [...current.exemplos, { contexto: result.texto, resposta: clean }] },
    );
    setPreferred(index);
  }

  const h = settings.humanize;

  return (
    <section className="grid">
      <div className="card">
        <label className="field">
          <span>{mode === "pergunta" ? "Pergunta que te fizeram" : "Afirmação que te mandaram"}</span>
          <textarea
            className="headline-input"
            rows={2}
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder={
              mode === "pergunta" ? "ex: vai na festa sábado?" : "ex: acho que esse time não ganha mais nada esse ano"
            }
          />
        </label>
        <div className="tools">
          <AudioButton senha={senha} onText={(transcrito) => setTexto(transcrito)} />
          <MessageReading texto={texto} contexto={contexto} settings={settings} senha={senha} />
        </div>

        <details className="more">
          <summary>Contexto extra (opcional)</summary>
          <textarea
            rows={2}
            value={contexto}
            onChange={(event) => setContexto(event.target.value)}
            placeholder="quem é a pessoa, o que você quer dizer..."
          />
        </details>

        {mode === "afirmacao" && (
          <div className="field">
            <span>Sua posição</span>
            <div className="seg">
              {STANCES.map((item) => (
                <button key={item.id} className={stance === item.id ? "on" : ""} onClick={() => setStance(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <span>Tipo de resposta</span>
          <div className="seg wrap">
            {TEXT_KINDS.map((item) => (
              <button
                key={item.id}
                className={settings.kind === item.id ? "on" : ""}
                onClick={() => set("kind", item.id)}
                title={item.hint}
              >
                {item.label}
              </button>
            ))}
          </div>
          {best && (
            <small className="muted">
              Recomendado para isso: <b>{best.label}</b>
            </small>
          )}
        </div>

        <div className="row">
          <label className="field">
            <span>Provedor</span>
            <select
              value={settings.provider}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  provider: event.target.value as "auto" | ProviderId,
                  model: "",
                }))
              }
            >
              <option value="auto">Automático (recomendado)</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id} disabled={!provider.configured}>
                  {provider.label}
                  {provider.configured ? "" : " — sem chave"}
                </option>
              ))}
            </select>
          </label>
          {settings.provider === "custom" && (
            <label className="field">
              <span>Modelo</span>
              <input
                list="models-custom"
                value={settings.model}
                onChange={(event) => set("model", event.target.value)}
                placeholder={rankedModels[0]?.id ?? "id do modelo"}
              />
              <datalist id="models-custom">
                {rankedModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </datalist>
            </label>
          )}
          {settings.provider !== "auto" && settings.provider !== "custom" && (
            <label className="field">
              <span>Modelo</span>
              <select value={settings.model} onChange={(event) => set("model", event.target.value)}>
                <option value="">
                  Melhor para {kindLabel}
                  {rankedModels[0] ? `: ${rankedModels[0].label}` : ""}
                </option>
                {rankedModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label} · {"★".repeat(model.scores[settings.kind])}
                    {model.speed === 3 ? " · rápido" : ""}
                  </option>
                ))}
              </select>
              {selectedModel && <small className="muted">{selectedModel.note}</small>}
            </label>
          )}
        </div>

        <details className="more" open={settings.tracos.length > 0}>
          <summary>Personalidade {settings.tracos.length > 0 && <em>({settings.tracos.join(", ")})</em>}</summary>
          <p className="muted small">Escolha até {MAX_TRAITS} traços.</p>
          <div className="chips">
            {POSITIVE_TRAITS.map((trait) => (
              <button
                key={trait}
                className={settings.tracos.includes(trait) ? "chip pos on" : "chip pos"}
                onClick={() => toggleTrait(trait)}
              >
                {trait}
              </button>
            ))}
          </div>
          <div className="chips">
            {NEGATIVE_TRAITS.map((trait) => (
              <button
                key={trait}
                className={settings.tracos.includes(trait) ? "chip neg on" : "chip neg"}
                onClick={() => toggleTrait(trait)}
              >
                {trait}
              </button>
            ))}
          </div>
        </details>

        <details className="more" open>
          <summary>Parecer que fui eu</summary>
          <div className="calibrate">
            <button
              className="act"
              onClick={calibrar}
              disabled={!meuJeito}
              title={meuJeito ? "Ajusta os controles medindo os seus exemplos" : undefined}
            >
              Calibrar pelo meu jeito
            </button>
            <span className="muted small" role="status">
              {meuJeito ? calibrado : `Precisa de ${MIN_EXAMPLES} exemplos seus (tem ${perfil.exemplos.length}).`}
            </span>
          </div>
          <div className="faders">
            <Fader
              label="abreviação (vc, pq, tb)"
              value={h.abbreviation}
              min={0}
              max={100}
              step={5}
              display={`${h.abbreviation}%`}
              onChange={(value) => setH("abbreviation", value)}
            />
            <Fader
              label="erros de digitação"
              value={h.typoRate}
              min={0}
              max={20}
              step={1}
              display={`${h.typoRate}%`}
              onChange={(value) => setH("typoRate", value)}
            />
            <Fader
              label="criatividade"
              value={settings.temperatura}
              min={0.2}
              max={1.3}
              step={0.1}
              display={settings.temperatura.toFixed(1)}
              onChange={(value) => set("temperatura", value)}
            />
          </div>
          <div className="toggles">
            <label>
              <input type="checkbox" checked={h.casual} onChange={(event) => setH("casual", event.target.checked)} />{" "}
              sem ponto final / minúscula
            </label>
            <label>
              <input type="checkbox" checked={h.kkk} onChange={(event) => setH("kkk", event.target.checked)} /> risada
              vira kkkk
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.emoji}
                onChange={(event) => set("emoji", event.target.checked)}
              />{" "}
              emoji
            </label>
          </div>
          <label className="field versions">
            <span>Versões</span>
            <select value={settings.variacoes} onChange={(event) => set("variacoes", Number(event.target.value))}>
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </details>

        <div className="row">
          <button className="primary" disabled={loading || !texto.trim()} onClick={gerar}>
            {loading ? "Gerando…" : "Gerar resposta"}
          </button>
          {loading && (
            <button className="act" onClick={() => abortRef.current?.abort()}>
              Cancelar
            </button>
          )}
          {!loading && error && (
            <button className="act" onClick={gerar}>
              Tentar novamente
            </button>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {history.length > 0 && (
          <details className="more">
            <summary>Histórico ({history.length})</summary>
            <div className="history-list">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="history-item">
                  <small>
                    {new Date(item.createdAt).toLocaleString()} · {item.providerLabel} · {item.model}
                  </small>
                  <p>{item.texto}</p>
                  <button
                    className="act ghost"
                    onClick={() => {
                      setTexto(item.texto);
                      setResult({
                        variations: item.respostas,
                        providerLabel: item.providerLabel,
                        model: item.model,
                        fallbacks: [],
                        texto: item.texto,
                      });
                    }}
                  >
                    Reabrir
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="results" aria-live="polite">
        {!result && !loading && (
          <div className="empty">
            <p>As respostas aparecem aqui.</p>
            <p className="muted small">
              Dica: edite a melhor e toque em <b>Salvar como meu exemplo</b>. Quanto mais exemplos seus, mais parecido
              com você fica.
            </p>
          </div>
        )}
        {result && (
          <>
            <p className="muted small">
              via <b>{result.providerLabel}</b> · {result.model}
              {result.fallbacks.length > 0 && <> · (pulou {result.fallbacks.length} por limite)</>}
            </p>
            {result.variations.map((variation, index) => (
              <ResultCard
                key={`${result.texto}-${index}-${variation.length}`}
                raw={variation}
                opts={h}
                baseSeed={index + 1}
                telefone={settings.telefone}
                onSave={salvarExemplo}
                meuJeito={meuJeito}
                onShown={(shown) => {
                  shownRef.current[index] = shown;
                }}
                preferState={
                  result.variations.length < 2
                    ? "hidden"
                    : preferred === null
                      ? "open"
                      : preferred === index
                        ? "chosen"
                        : "lost"
                }
                onPrefer={(clean) => preferir(index, clean)}
                onTone={(tom, atual) =>
                  requestTone({ tom, texto: atual, contexto: result.texto, settings, perfil, senha })
                }
              />
            ))}
            <label className="field">
              <span>Número do WhatsApp (opcional, com DDI: 5511999999999)</span>
              <input
                inputMode="numeric"
                value={settings.telefone}
                onChange={(event) => set("telefone", event.target.value.replace(/\D/g, ""))}
              />
            </label>
          </>
        )}
      </div>
    </section>
  );
}
