"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import DecisionWorkspace from "@/components/DecisionWorkspace";
import InstallApp from "@/components/InstallApp";
import Icon from "@/components/Icon";
import Generator from "@/components/Generator";
import StyleTrainer from "@/components/StyleTrainer";
import ModelGuide from "@/components/ModelGuide";
import Conversation from "@/components/Conversation";
import Simulator from "@/components/Simulator";
import CommunicationStudio from "@/components/CommunicationStudio";
import BeyondBubble from "@/components/BeyondBubble";
import { useLocalState, useSessionState } from "@/lib/store";
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, type ProviderStatus } from "@/lib/types";

type Tab = "decisoes" | "pergunta" | "afirmacao" | "conversa" | "treino" | "pratica" | "beyond" | "estilo" | "modelos";
type Theme = "system" | "light" | "dark";

const TABS: { id: Tab; label: string; icon: string; description: string }[] = [
  {
    id: "decisoes",
    label: "Decidir e responder",
    icon: "analyze",
    description: "Cole a mensagem, escolha sua intenção e escreva a resposta do seu jeito.",
  },
  {
    id: "pergunta",
    label: "Responder pergunta",
    icon: "message",
    description: "Encontre as palavras certas, do seu jeito.",
  },
  {
    id: "afirmacao",
    label: "Responder afirmação",
    icon: "reply",
    description: "Escolha sua posição e construa uma resposta.",
  },
  {
    id: "conversa",
    label: "Analisar conversa",
    icon: "conversation",
    description: "Entenda o contexto antes de dar o próximo passo.",
  },
  {
    id: "treino",
    label: "Treinar conversa",
    icon: "practice",
    description: "Ensaie uma conversa difícil com espaço para tentar.",
  },
  {
    id: "pratica",
    label: "Comunicação na prática",
    icon: "practice",
    description: "Ensaie falando, reflita sobre conversas e informe etapas de uma ordem de serviço.",
  },
  {
    id: "beyond",
    label: "Fora da bolha",
    icon: "beyond",
    description: "Dias de pouca energia, passagem de turno, rascunho sem contexto, acordos e cartão de bolso.",
  },
  {
    id: "estilo",
    label: "Meu estilo",
    icon: "profile",
    description: "Ensine ao Persona o que faz uma resposta parecer sua.",
  },
  {
    id: "modelos",
    label: "Modelos e conexões",
    icon: "settings",
    description: "Escolha a inteligência que acompanha sua conversa.",
  },
];

const PRIMARY: { id: Tab; label: string }[] = [
  { id: "decisoes", label: "Decidir" },
  { id: "conversa", label: "Conversa" },
  { id: "pratica", label: "Na prática" },
];
const otherAreas = TABS.filter(({ id }) => !PRIMARY.some((item) => item.id === id));

const THEMES: { id: Theme; label: string }[] = [
  { id: "system", label: "Sistema" },
  { id: "light", label: "Claro" },
  { id: "dark", label: "Escuro" },
];

export default function Home() {
  const [tab, setTab] = useLocalState<{ v: Tab }>("tab", { v: "decisoes" });
  const [settings, setSettings] = useLocalState("settings", DEFAULT_SETTINGS);
  const [perfil, setPerfil] = useLocalState("perfil", DEFAULT_PROFILE);
  const [senha, setSenha] = useSessionState("senha", { v: "" });
  const [theme, setTheme] = useLocalState<Theme>("theme", "system");
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState(false);
  const [providersAttempt, setProvidersAttempt] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const active = TABS.find((item) => item.id === tab.v) ?? TABS[0];
  const connectedProviders = providers.filter((provider) => provider.configured).length;

  function openArea(id: Tab) {
    setMenuOpen(false);
    setTab({ v: id });
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const controller = new AbortController();
    setProvidersLoading(true);
    setProvidersError(false);
    fetch("/api/providers", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não consegui carregar os provedores.");
        return response.json();
      })
      .then((data) => {
        setProviders(data.providers ?? []);
        setNeedsPassword(Boolean(data.needsPassword));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setProviders([]);
        setNeedsPassword(false);
        setProvidersError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setProvidersLoading(false);
      });
    return () => controller.abort();
  }, [providersAttempt]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.title = `${active.label} · Persona`;
  }, [active.label]);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#workspace">
        Ir para o conteúdo
      </a>
      <header className="masthead">
        <div className="masthead-inner">
          <a
            href="#workspace"
            className="brand-lockup"
            aria-label="Persona, início"
            onClick={(event) => {
              event.preventDefault();
              openArea("decisoes");
            }}
          >
            <Image src="/icons/persona.svg" alt="" width={38} height={38} priority />
            <span>persona</span>
          </a>
          <nav className="workspace-nav" aria-label="Áreas do Persona">
            {PRIMARY.map(({ id, label }) => {
              const item = TABS.find((tab) => tab.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  className="nav-item"
                  aria-current={active.id === id ? "page" : undefined}
                  onClick={() => openArea(id)}
                >
                  <Icon name={item.icon} />
                  {label}
                </button>
              );
            })}
            <div
              className="area-menu"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && menuOpen) {
                  setMenuOpen(false);
                  menuButton.current?.focus();
                }
              }}
            >
              <button
                type="button"
                className="nav-item"
                ref={menuButton}
                aria-expanded={menuOpen}
                aria-controls="additional-areas"
                data-current={otherAreas.some((item) => item.id === active.id) || undefined}
                onClick={() => setMenuOpen((value) => !value)}
              >
                <Icon name="settings" />
                Mais
              </button>
              <div id="additional-areas" className="area-panel" hidden={!menuOpen}>
                {otherAreas.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="nav-item"
                    aria-current={active.id === item.id ? "page" : undefined}
                    onClick={() => openArea(item.id)}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </button>
                ))}
                <label className="field area-theme">
                  <span>Aparência</span>
                  <select value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>
                    {THEMES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </nav>
          <InstallApp />
        </div>
      </header>
      <main className="shell" id="workspace" ref={mainRef} tabIndex={-1}>
        <header className="page-heading">
          <div className="page-heading-copy">
            <h1>{active.label}</h1>
            <p>{active.description}</p>
          </div>
          {!providersLoading && !providersError && (
            <button className="connection-link" onClick={() => openArea("modelos")}>
              <Icon name="settings" />
              <span>
                <strong>{connectedProviders ? "IA configurada" : "Conectar IA"}</strong>
                <span>
                  {connectedProviders ? "Ver modelos disponíveis" : "Configure um provedor para gerar respostas"}
                </span>
              </span>
              <Icon name="reply" />
            </button>
          )}
        </header>
        {providersLoading && (
          <p className="muted small" role="status">
            Carregando provedores…
          </p>
        )}
        {providersError && (
          <div className="provider-status error" role="alert">
            Não consegui carregar os provedores.{" "}
            <button className="link-button" onClick={() => setProvidersAttempt((current) => current + 1)}>
              Tentar novamente
            </button>
          </div>
        )}

        {needsPassword && (
          <label className="field inline-pass">
            <span>Senha do app</span>
            <input
              type="password"
              value={senha.v}
              onChange={(event) => setSenha({ v: event.target.value })}
              placeholder="definida em APP_PASSWORD"
            />
          </label>
        )}

        {tab.v === "decisoes" && (
          <DecisionWorkspace
            settings={settings}
            perfil={perfil}
            senha={senha.v}
            openRouterReady={providers.some((provider) => provider.id === "openrouter" && provider.configured)}
          />
        )}
        {(tab.v === "pergunta" || tab.v === "afirmacao") && (
          <Generator
            key={tab.v}
            mode={tab.v}
            settings={settings}
            setSettings={setSettings}
            perfil={perfil}
            setPerfil={setPerfil}
            providers={providers}
            senha={senha.v}
          />
        )}
        {tab.v === "conversa" && (
          <Conversation settings={settings} perfil={perfil} setPerfil={setPerfil} senha={senha.v} />
        )}
        {tab.v === "treino" && <Simulator settings={settings} perfil={perfil} senha={senha.v} />}
        {tab.v === "pratica" && <CommunicationStudio settings={settings} senha={senha.v} />}
        {tab.v === "beyond" && <BeyondBubble />}
        {tab.v === "estilo" && <StyleTrainer perfil={perfil} setPerfil={setPerfil} />}
        {tab.v === "modelos" && (
          <ModelGuide
            providers={providers}
            settings={settings}
            setSettings={setSettings}
            goTo={() => openArea("pergunta")}
            goToDecisions={() => openArea("decisoes")}
          />
        )}

        <footer className="foot">
          <Icon name="lock" /> Seu perfil e exemplos ficam neste navegador. As mensagens são enviadas ao provedor de IA
          para análise.
        </footer>
      </main>
    </div>
  );
}
