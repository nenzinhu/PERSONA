"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_VERSION = 1;

type StoredValue<T> = { version: number; value: T };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCompatibleStoredValue(initial: unknown, incoming: unknown): boolean {
  if (Array.isArray(initial)) return Array.isArray(incoming);
  if (isPlainObject(initial)) return isPlainObject(incoming);
  return typeof incoming === typeof initial && incoming !== null;
}

function mergeStoredValue<T>(initial: T, incoming: unknown): T {
  if (!isCompatibleStoredValue(initial, incoming)) return initial;
  if (Array.isArray(incoming)) return incoming as T;
  if (!isPlainObject(incoming)) return incoming as T;
  if (!isPlainObject(initial)) return incoming as T;

  const merged: Record<string, unknown> = { ...initial };
  for (const [key, value] of Object.entries(incoming)) {
    const previous = merged[key];
    if (previous !== undefined && !isCompatibleStoredValue(previous, value)) continue;
    merged[key] = isPlainObject(value) && isPlainObject(previous) ? mergeStoredValue(previous, value) : value;
  }
  return merged as T;
}

export function parseStoredValue<T>(raw: string, initial: T): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return initial;
  }
  const value =
    isPlainObject(parsed) && parsed.version === STORAGE_VERSION && "value" in parsed ? parsed.value : parsed;
  if (!isCompatibleStoredValue(initial, value)) return initial;
  return mergeStoredValue(initial, value);
}

export function useLocalState<T>(key: string, initial: T): [T, (value: T | ((previous: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  // `initial` costuma ser um literal novo a cada render; depender dele gera loop infinito.
  const initialRef = useRef(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(parseStoredValue(raw, initialRef.current));
    } catch {
      // storage indisponível (aba anônima, bloqueio do navegador ou dado corrompido)
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, value } satisfies StoredValue<T>));
    } catch {
      // ignora falhas de quota ou storage bloqueado
    }
  }, [key, value, loaded]);

  return [value, setValue];
}

export function useSessionState<T>(key: string, initial: T): [T, (value: T | ((previous: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) setValue(parseStoredValue(raw, initialRef.current));
    } catch {
      // storage indisponível ou sessão bloqueada
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, value } satisfies StoredValue<T>));
    } catch {
      // ignora falhas de quota ou storage bloqueado
    }
  }, [key, value, loaded]);

  return [value, setValue];
}

export { mergeStoredValue };
