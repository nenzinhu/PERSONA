"use client";

import { useState } from "react";
import AgreementsDictionary from "./AgreementsDictionary";
import HandoffCard from "./HandoffCard";
import LowEnergyMode from "./LowEnergyMode";
import PlainReading from "./PlainReading";
import PocketCard from "./PocketCard";

type Section = "energia" | "bastao" | "sem-contexto" | "acordos" | "bolso";

const SECTIONS: { id: Section; label: string; intro: string }[] = [
  {
    id: "energia",
    label: "Pouca energia",
    intro: "Dizer a disponibilidade real, sem inventar justificativas.",
  },
  {
    id: "bastao",
    label: "Passagem de bastão",
    intro: "Um cartão de continuidade com fatos, dúvidas e próxima ação.",
  },
  {
    id: "sem-contexto",
    label: "Sem contexto",
    intro: "Ver o rascunho como quem só recebeu aquele texto.",
  },
  {
    id: "acordos",
    label: "Acordos",
    intro: "O significado combinado de expressões como “quando der”.",
  },
  { id: "bolso", label: "Cartão de bolso", intro: "O que dizer, o que perguntar e o meu limite, no papel." },
];

export default function BeyondBubble() {
  const [section, setSection] = useState<Section>("energia");
  const active = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0];

  return (
    <section className="beyond-studio">
      <div className="studio-tabs" role="group" aria-label="Ferramentas fora da tela">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            className={section === item.id ? "on" : ""}
            aria-pressed={section === item.id}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="studio-intro beyond-intro">{active.intro}</p>
      {section === "energia" && <LowEnergyMode />}
      {section === "bastao" && <HandoffCard />}
      {section === "sem-contexto" && <PlainReading />}
      {section === "acordos" && <AgreementsDictionary />}
      {section === "bolso" && <PocketCard />}
    </section>
  );
}
