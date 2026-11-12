import test from "node:test";
import assert from "node:assert/strict";
import { buildEnergyMessage, energyIsReady, ENERGY_AVAILABILITY } from "../lib/energy.ts";

test("modo pouca energia: cada disponibilidade muda só a frase principal", () => {
  assert.equal(
    buildEnergyMessage({ disponibilidade: "agora", assunto: "o relatório do turno", quando: "", limite: "" }),
    "Consigo resolver o relatório do turno agora.",
  );
  assert.equal(
    buildEnergyMessage({
      disponibilidade: "depois",
      assunto: "o relatório do turno",
      quando: "na quinta de manhã",
      limite: "",
    }),
    "Preciso de tempo para o relatório do turno. Consigo retomar na quinta de manhã.",
  );
  assert.equal(
    buildEnergyMessage({ disponibilidade: "nao-assumo", assunto: "o plantão de sábado", quando: "", limite: "" }),
    "Não consigo assumir o plantão de sábado.",
  );
});

test("modo pouca energia: sem assunto a mensagem continua compreensível", () => {
  assert.equal(
    buildEnergyMessage({ disponibilidade: "depois", assunto: "   ", quando: "", limite: "" }),
    "Preciso de tempo para isso.",
  );
  assert.equal(
    buildEnergyMessage({ disponibilidade: "nao-assumo", assunto: "", quando: "", limite: "" }),
    "Não consigo assumir isso.",
  );
});

test("modo pouca energia: o limite entra como frase própria, sem justificativa criada", () => {
  const message = buildEnergyMessage({
    disponibilidade: "agora",
    assunto: "a conferência",
    quando: "",
    limite: "responder até as 14h",
  });
  assert.equal(message, "Consigo resolver a conferência agora. O meu limite é responder até as 14h.");
  assert.equal(/porque|pois|já que/i.test(message), false);
});

test("modo pouca energia: só fica pronto com assunto ou limite", () => {
  assert.equal(energyIsReady({ disponibilidade: "agora", assunto: "", quando: "", limite: "" }), false);
  assert.equal(energyIsReady({ disponibilidade: "agora", assunto: "o ofício", quando: "", limite: "" }), true);
  assert.equal(energyIsReady({ disponibilidade: "agora", assunto: "", quando: "hoje", limite: "só à tarde" }), true);
  assert.equal(ENERGY_AVAILABILITY.length, 3);
});
