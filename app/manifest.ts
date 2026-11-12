import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Persona",
    short_name: "Persona",
    description: "Seu espaço para conversar, refletir e decidir.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f6f3",
    theme_color: "#5142a5",
    shortcuts: [
      {
        name: "Decidir e responder",
        short_name: "Decidir",
        description: "Analisar a mensagem e preparar a resposta.",
        url: "/?area=decisoes",
      },
      {
        name: "Analisar conversa",
        short_name: "Conversa",
        description: "Colar a conversa e ver o próximo passo.",
        url: "/?area=conversa",
      },
      {
        name: "Fora da bolha",
        short_name: "Fora da bolha",
        description: "Pouca energia, passagem de bastão, acordos e cartão de bolso.",
        url: "/?area=beyond",
      },
    ],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
