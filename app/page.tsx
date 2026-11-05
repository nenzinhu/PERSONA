"use client";

import { useEffect, useState } from "react";
import DecisionWorkspace from "@/components/DecisionWorkspace";
import InstallApp from "@/components/InstallApp";
import Icon from "@/components/Icon";
import Generator from "@/components/Generator";
import StyleTrainer from "@/components/StyleTrainer";
import ModelGuide from "@/components/ModelGuide";
import Conversation from "@/components/Conversation";
import Simulator from "@/components/Simulator";
import { useLocalState, useSessionState } from "@/lib/store";
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, type ProviderStatus } from "@/lib/types";

type Tab = "decisoes" | "pergunta" | "afirmacao" | "conversa" | "treino" | "estilo" | "modelos";
type Theme = "system" | "light" | "dark";

const TABS: { id: Tab; label: string; icon: string; description: string }[] = [
  {
    id: "decisoes",
    label: "Decidir e responder",
    icon: "analyze",
    description: "Seu objetivo primeiro. Depois, as palavras certas.",
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

  return (
    <div className="app-layout">
      <a className="skip-link" href="#workspace">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <a
          href="#workspace"
          className="brand-lockup"
          aria-label="Persona, início"
          onClick={() => setTab({ v: "pergunta" })}
        >
          <span className="brand-symbol">
            <Icon name="persona" />
          </span>
          <span className="brand">
            persona<span className="brand-dot">.</span>
          </span>
        </a>
        <p className="sidebar-caption">Sua voz, em cada conversa.</p>
        <InstallApp />
        <nav className="workspace-nav" aria-label="Áreas do Persona">
          {TABS.map((item, index) => (
            <button
              key={item.id}
              className={tab.v === item.id ? "nav-item active" : "nav-item"}
              aria-current={tab.v === item.id ? "page" : undefined}
              onClick={() => setTab({ v: item.id })}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {index === 0 && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="style-note">
            <Icon name="profile" />
            <div>
              <strong>Quanto mais seu, melhor.</strong>
              <p>Seus exemplos ensinam o Persona a escrever como você.</p>
              <button onClick={() => setTab({ v: "estilo" })}>
                Ajustar meu estilo <Icon name="arrow" />
              </button>
            </div>
          </div>
          <div className="profile-summary">
            <span className="profile-avatar">{perfil.nome?.trim().slice(0, 1).toUpperCase() || "P"}</span>
            <div>
              <strong>{perfil.nome || "Meu Persona"}</strong>
              <span>{perfil.exemplos.length} exemplos de escrita</span>
            </div>
            <Icon name="lock" />
          </div>
        </div>
      </aside>
      <main className="shell" id="workspace" tabIndex={-1}>
        <header className="workspace-top">
          <span>
            Meu espaço <span className="breadcrumb-separator">/</span>{" "}
            <strong>{TABS.find((item) => item.id === tab.v)?.label}</strong>
          </span>
          <div className="theme-switcher" role="group" aria-label="Tema">
            {THEMES.map((item) => (
              <button
                key={item.id}
                className={theme === item.id ? "on" : ""}
                aria-pressed={theme === item.id}
                onClick={() => setTheme(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>
        <div className="page-heading">
          <div>
            <h1>{TABS.find((item) => item.id === tab.v)?.label}</h1>
            <p>{TABS.find((item) => item.id === tab.v)?.description}</p>
          </div>
          <span className="private-note">
            <Icon name="lock" />
            Seu espaço pessoal
          </span>
        </div>
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
        {tab.v === "estilo" && <StyleTrainer perfil={perfil} setPerfil={setPerfil} />}
        {tab.v === "modelos" && (
          <ModelGuide
            providers={providers}
            settings={settings}
            setSettings={setSettings}
            goTo={() => setTab({ v: "pergunta" })}
            goToDecisions={() => setTab({ v: "decisoes" })}
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
