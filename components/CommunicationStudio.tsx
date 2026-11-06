"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";
import ConversationJournal from "./ConversationJournal";
import ServiceOrderReport from "./ServiceOrderReport";
import SpeechRehearsal from "./SpeechRehearsal";

type Section = "fala" | "diario" | "ordem";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "fala", label: "Ensaio de fala" },
  { id: "diario", label: "Diário" },
  { id: "ordem", label: "Ordem de serviço" },
];

interface Props {
  settings: Settings;
  senha: string;
}

export default function CommunicationStudio({ settings, senha }: Props) {
  const [section, setSection] = useState<Section>("fala");
  return (
    <section className={`communication-studio${section === "ordem" ? " communication-studio--order" : ""}`}>
      <div className="studio-tabs" role="group" aria-label="Ferramentas de comunicação prática">
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
      {section === "fala" && <SpeechRehearsal settings={settings} senha={senha} />}
      {section === "diario" && <ConversationJournal />}
      {section === "ordem" && <ServiceOrderReport settings={settings} senha={senha} />}
    </section>
  );
}
