import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPatrolText,
  findPlace,
  isPatrolVehicle,
  PATROL_GROUPS,
  PATROL_PLACES,
  patrolIsReady,
  placeUsesKm,
  sanitizeKm,
} from "../lib/patrol.ts";

const base = { operacao: "P-115" as const, viatura: "0042", destino: "sc-400", km: "12" };

test("P-115/P-18: texto da rodovia com viatura e km", () => {
  assert.equal(
    buildPatrolText(base),
    "Viatura PM-0042 realizando P-115 na SC-400, km 12, visando fluidez viária e prevenção de sinistros.",
  );
  assert.equal(
    buildPatrolText({ ...base, operacao: "P-18", destino: "sc-410", km: "3,5" }),
    "Viatura PM-0042 realizando P-18 na SC-410, km 3,5, visando fluidez viária e prevenção de sinistros.",
  );
});

test("P-115/P-18: sem km o texto mantém o traço do modelo", () => {
  assert.equal(
    buildPatrolText({ ...base, km: "" }),
    "Viatura PM-0042 realizando P-115 na SC-400, km -, visando fluidez viária e prevenção de sinistros.",
  );
});

test("P-115/P-18: acessos usam 'no' e pontes não levam km", () => {
  assert.equal(
    buildPatrolText({ ...base, destino: "acesso-aeroporto", km: "7" }),
    "Viatura PM-0042 realizando P-115 no Acesso Aeroporto Internacional Hercílio Luz, km 7, visando fluidez viária e prevenção de sinistros.",
  );
  assert.equal(
    buildPatrolText({ ...base, destino: "ponte-colombo", km: "9" }),
    "Viatura PM-0042 realizando P-115 na Ponte Colombo Machado Salles, Cabeceira Ilha, sentido Continente, visando fluidez viária e prevenção de sinistros.",
  );
  assert.equal(
    buildPatrolText({ ...base, operacao: "P-18", destino: "ponte-hercilio-continente" }),
    "Viatura PM-0042 realizando P-18 na Ponte Hercílio Luz, Cabeceira Continente, sentido Ilha, visando fluidez viária e prevenção de sinistros.",
  );
});

test("P-115/P-18: viatura precisa de quatro dígitos e o local precisa existir", () => {
  assert.equal(isPatrolVehicle("0042"), true);
  for (const invalid of ["", "42", "12345", "12a4", "PM-0042"]) assert.equal(isPatrolVehicle(invalid), false);
  assert.equal(buildPatrolText({ ...base, viatura: "42" }), "");
  assert.equal(buildPatrolText({ ...base, destino: "sc-999" }), "");
  assert.equal(patrolIsReady({ ...base, viatura: "" }), false);
  assert.equal(patrolIsReady(base), true);
});

test("P-115/P-18: km é limpo e limitado", () => {
  assert.equal(sanitizeKm("km 12"), "12");
  assert.equal(sanitizeKm("12,5"), "12,5");
  assert.equal(sanitizeKm("12.5"), "125");
  assert.equal(sanitizeKm("123456"), "1234");
  assert.equal(sanitizeKm("12,55"), "12,5");
});

test("P-115/P-18: a lista cobre as rodovias, acessos e pontes pedidos", () => {
  const labels = PATROL_PLACES.map((place) => place.label);
  for (const rodovia of [
    "SC-400",
    "SC-401",
    "SC-402",
    "SC-403",
    "SC-404",
    "SC-405",
    "SC-406",
    "SC-281",
    "SC-407",
    "SC-410",
  ]) {
    assert.ok(labels.includes(rodovia), rodovia);
  }
  assert.ok(labels.some((label) => label.includes("Aeroporto Internacional Hercílio Luz")));
  assert.ok(labels.some((label) => label.includes("Tapera")));
  assert.equal(PATROL_PLACES.filter((place) => place.kind === "ponte").length, 4);
  assert.deepEqual([...PATROL_GROUPS], ["Florianópolis", "Pontes", "Grande Florianópolis e vizinhas"]);
  assert.equal(placeUsesKm(findPlace("ponte-pedro-ivo")), false);
  assert.equal(placeUsesKm(findPlace("sc-401")), true);
});
