"use client";
// Client-side demo store: seed mocks + user-created vaults in localStorage.
// Keyed per browser; deterministic ids INV-2001, INV-2002, ...

import { MOCK_VAULTS, Vault, fakeSig } from "./mock";

const KEY = "settlenow:vaults:v1";
const COUNTER_KEY = "settlenow:counter:v1";

export function loadUserVaults(): Vault[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Vault[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function loadAllVaults(): Vault[] {
  const user = loadUserVaults();
  const seen = new Set(user.map((v) => v.id.toLowerCase()));
  return [...user, ...MOCK_VAULTS.filter((m) => !seen.has(m.id.toLowerCase()))];
}

export function getVault(id: string): Vault | undefined {
  return loadAllVaults().find((v) => v.id.toLowerCase() === id.toLowerCase());
}

export function nextUserId(): string {
  if (typeof window === "undefined") return "INV-2001";
  const n = Number(window.localStorage.getItem(COUNTER_KEY) || "2000") + 1;
  window.localStorage.setItem(COUNTER_KEY, String(n));
  return `INV-${n}`;
}

export function addVault(v: Vault): Vault[] {
  const user = loadUserVaults();
  user.unshift(v);
  window.localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function markRepaid(id: string): Vault | undefined {
  const user = loadUserVaults();
  const ix = user.findIndex((v) => v.id.toLowerCase() === id.toLowerCase());
  if (ix >= 0) {
    user[ix] = {
      ...user[ix],
      status: "Repaid",
      repayTx: user[ix].repayTx ?? fakeSig(`repay-${user[ix].id}`),
    };
    window.localStorage.setItem(KEY, JSON.stringify(user));
    return user[ix];
  }
  // Mock vaults are read-only seeds; mirror a repaid copy into user vaults.
  const mock = MOCK_VAULTS.find((v) => v.id.toLowerCase() === id.toLowerCase());
  if (mock && !mock.repayTx) {
    const copy: Vault = { ...mock, status: "Repaid", repayTx: fakeSig(`repay-${mock.id}`) };
    user.unshift(copy);
    window.localStorage.setItem(KEY, JSON.stringify(user));
    return copy;
  }
  return mock;
}

export function resetDemo(): void {
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(COUNTER_KEY);
}
