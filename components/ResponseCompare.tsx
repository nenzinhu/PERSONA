"use client";

import { useMemo, useState } from "react";
import { humanize, type HumanizeOptions } from "@/lib/humanize";
import { styleScore, type Fingerprint } from "@/lib/stylometry";

interface Props {
  variations: string[];
  opts: HumanizeOptions;
  meuJeito: Fingerprint | null;
}

/** Comparação A/B: duas versões lado a lado com a nota "parece você" e o que difere. */
export default function ResponseCompare({ variations, opts, meuJeito }: Props) {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(1);

  const cards = useMemo(
    () =>
      variations.map((variation, index) => {
        const text = humanize(variation, { ...opts, seed: index + 1 });
        return { index, text, score: meuJeito ? styleScore(text, meuJeito) : null };
      }),
    [variations, opts, meuJeito],
  );

  if (variations.length < 2) return null;

  const pair = [cards[left], cards[right]].filter(Boolean);
  const best = pair.every((card) => card.score)
    ? pair[0].score!.score >= pair[1].score!.score
      ? pair[0].index
      : pair[1].index
    : null;

  return (
    <details className="more compare">
      <summary>Comparar duas versões lado a lado</summary>
      <div className="row">
        {[
          { value: left, set: setLeft, label: "Versão à esquerda" },
          { value: right, set: setRight, label: "Versão à direita" },
        ].map((select) => (
          <label className="field" key={select.label}>
            <span>{select.label}</span>
            <select value={select.value} onChange={(event) => select.set(Number(event.target.value))}>
              {variations.map((_, index) => (
                <option key={index} value={index}>
                  Versão {index + 1}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="compare-grid">
        {pair.map((card) => (
          <article key={card.index} className={best === card.index ? "compare-card winner" : "compare-card"}>
            <div className="compare-score">
              <strong>Versão {card.index + 1}</strong>
              {card.score ? (
                <>
                  <b>{card.score.score}</b>
                  <span>/100 parece você</span>
                </>
              ) : (
                <span>adicione exemplos no seu estilo para ver a nota</span>
              )}
            </div>
            <p>{card.text}</p>
            {card.score?.hints.length ? (
              <ul className="compare-hints">
                {card.score.hints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            ) : null}
            <div className="actions">
              <button
                type="button"
                className="act"
                onClick={() => navigator.clipboard?.writeText(card.text).catch(() => undefined)}
              >
                Copiar esta
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="muted small">
        A nota vem do seu jeito de escrever medido nos exemplos salvos. A comparação não gasta chamada de IA.
      </p>
    </details>
  );
}
