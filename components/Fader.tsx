import type { CSSProperties } from "react";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Texto mostrado dentro do fader (ex: "40%", "0.9"). */
  display: string;
  onChange: (value: number) => void;
}

/** Slider vertical estilo mesa de som: o input nativo fica por cima, invisível, e garante teclado e leitor de tela. */
export default function Fader({ label, value, min, max, step, display, onChange }: Props) {
  const fill = Math.round(((value - min) / (max - min)) * 100);
  const style = { "--fill": `${fill}%` } as CSSProperties;

  return (
    <label className="fader">
      <span className="fader-track" style={style}>
        <span className={fill > 80 ? "fader-value on-fill" : "fader-value"}>{display}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={display}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </span>
      <span className="fader-label">{label}</span>
    </label>
  );
}
