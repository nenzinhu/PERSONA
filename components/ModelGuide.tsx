"use client";

import { PROVIDERS, TEXT_KINDS, recommend, type TextKind } from "@/lib/providers";
import type { ProviderStatus, Settings } from "@/lib/types";

interface Props {
  providers: ProviderStatus[];
  settings: Settings;
  setSettings: (fn: (s: Settings) => Settings) => void;
  goTo: () => void;
}

const WHY: Record<TextKind, string> = {
  casual:
    "Para zap curto o que importa é velocidade e PT-BR natural. Qwen 3.6 27B no Groq responde em menos de 1s e não soa robótico. Ministral 14B (Mistral) é a alternativa.",
  argumento:
    "Para rebater uma afirmação ou dar opinião, precisa raciocinar. DeepSeek V4 Flash (Nous ou OrcaRouter free), GLM 5.3 Flash e Nemotron 3 Super argumentam melhor; o humanizador depois tira a cara de redação.",
  persona:
    "Para imitar o SEU jeito, DeepSeek V4 Flash segue melhor os seus exemplos. Mistral Nemo e Ministral 14B soam mais soltos. Seu fine-tune, se tiver, ganha de todos.",
  formal:
    "Para cliente/trabalho, modelos mais ‘certinhos’ ganham: GPT-OSS 120B, Nemotron 3 Super e DeepSeek V4 Flash. Use abreviação e erro em 0%.",
};

export default function ModelGuide({ providers, settings, setSettings, goTo }: Props) {
  const all = PROVIDERS.map((p) => ({ id: p.id, models: providers.find((x) => x.id === p.id)?.models ?? p.models }));
  const configured = new Set(providers.filter((p) => p.configured).map((p) => p.id));

  function use(kind: TextKind, provider: string, model: string) {
    setSettings((s) => ({ ...s, kind, provider: provider as Settings["provider"], model }));
    goTo();
  }

  return (
    <section className="guide">
      <div className="card">
        <h2>Qual modelo usar para cada tipo de resposta</h2>
        <p className="muted small">
          Notas de 1 a 5 para naturalidade em PT-BR informal. No modo Automático o app escolhe o melhor que tiver chave
          e, se o grátis estourar o limite, tenta o próximo.
        </p>
        {TEXT_KINDS.map((k) => {
          const top = recommend(k.id, all).slice(0, 4);
          return (
            <div key={k.id} className="kind">
              <h3>
                {k.label} <small className="muted">— {k.hint}</small>
              </h3>
              <p className="small">{WHY[k.id]}</p>
              <ol className="rank">
                {top.map((r, i) => (
                  <li key={r.provider + r.model}>
                    <span>
                      {i === 0 && <b className="tag">mais recomendado</b>} {r.label}
                      <small className="muted"> · {r.why}</small>
                    </span>
                    {configured.has(r.provider) ? (
                      <button className="act" onClick={() => use(k.id, r.provider, r.model)}>
                        Usar
                      </button>
                    ) : (
                      <small className="muted">sem chave</small>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2>Provedores</h2>
        <ul className="providers">
          {PROVIDERS.map((p) => (
            <li key={p.id}>
              <div>
                <b>{p.label}</b>{" "}
                <span className={configured.has(p.id) ? "ok" : "no"}>
                  {configured.has(p.id) ? "chave ok" : "sem chave"}
                </span>
                <p className="small muted">{p.freeTier}</p>
                <code className="small">
                  {p.envKey}
                  {p.envBaseUrl ? ` + ${p.envBaseUrl}` : ""}
                </code>
              </div>
              {p.site && (
                <a href={p.site} target="_blank" rel="noreferrer" className="act">
                  Pegar chave
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="small muted">
          Seleção atual:{" "}
          {settings.provider === "auto" ? "Automático" : `${settings.provider} · ${settings.model || "modelo padrão"}`}
        </p>
      </div>
    </section>
  );
}
