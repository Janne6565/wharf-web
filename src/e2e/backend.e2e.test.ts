// Opt-in end-to-end test against a REAL running backend, using the REAL client
// crypto module. It exercises the exact key-derivation + WHARFV vault contract
// the browser uses, so it is the strongest proof the frontend and backend agree.
//
// It is skipped by default (it needs the Spring API on :8080). Run it with:
//   1. start the backend on :8080 (see wharf-backend/README.md)
//   2. E2E=1 bunx vitest run src/e2e
import { describe, expect, it } from "vitest";
import {
  createVault,
  deriveAuthKey,
  deriveMasterKey,
  deriveRecoveryAuthKey,
  fromBase64,
  initialVaultPayload,
  recoverySecretFromCode,
  reEncrypt,
  toBase64,
  unlockWithPassword,
  unlockWithRecovery,
} from "@/crypto";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8080/api/v1";
const decoder = new TextDecoder();

async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

async function get(path: string, token?: string) {
  const res = await fetch(BASE + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

describe.skipIf(!process.env.E2E)("backend E2E (live server)", () => {
  it("register -> device-code -> login -> vault -> recover reset, full contract", async () => {
    const email = `e2e+${Date.now()}@wharf.test`;
    const password = "correct horse battery staple";
    const expectedPayload = decoder.decode(initialVaultPayload());

    // register
    const masterKey = await deriveMasterKey(password, email);
    const authKey = await deriveAuthKey(masterKey);
    const { blob, recoveryCode } = await createVault(password, initialVaultPayload());
    const recoveryAuthKey = await deriveRecoveryAuthKey(recoverySecretFromCode(recoveryCode));
    const reg = await post("/auth/register", {
      email,
      authKey,
      recoveryAuthKey,
      vault: toBase64(blob),
    });
    expect(reg.status).toBe(201);
    const accessToken = reg.json.tokens.accessToken as string;

    // duplicate register -> 409
    const dup = await post("/auth/register", {
      email,
      authKey,
      recoveryAuthKey,
      vault: toBase64(blob),
    });
    expect(dup.status).toBe(409);

    // device code
    const dc = await post("/device-codes", {}, accessToken);
    expect(dc.status).toBe(200);
    expect(dc.json.code).toHaveLength(8);

    // login + wrong password
    const loginRes = await post("/auth/login", { email, authKey, tokenMode: "DIRECT" });
    expect(loginRes.status).toBe(200);
    const badAuthKey = await deriveAuthKey(await deriveMasterKey("wrong", email));
    expect(
      (await post("/auth/login", { email, authKey: badAuthKey, tokenMode: "DIRECT" })).status,
    ).toBe(401);

    // fetch + unlock vault
    const vaultRes = await get("/vault", loginRes.json.accessToken);
    expect(vaultRes.status).toBe(200);
    const fetched = await unlockWithPassword(fromBase64(vaultRes.json.vault), password);
    expect(decoder.decode(fetched.payload)).toBe(expectedPayload);

    // recovery verify + unlock via recovery slot
    const verify = await post("/auth/recover/verify", { email, recoveryAuthKey });
    expect(verify.status).toBe(200);
    const recovered = await unlockWithRecovery(fromBase64(verify.json.vault), recoveryCode);
    expect(decoder.decode(recovered.payload)).toBe(expectedPayload);

    // recovery reset (rotate password + recovery code)
    const newPassword = "a-brand-new-master-passphrase-2026";
    const resealed = await reEncrypt(recovered, newPassword);
    const newAuthKey = await deriveAuthKey(await deriveMasterKey(newPassword, email));
    const newRecoveryAuthKey = await deriveRecoveryAuthKey(
      recoverySecretFromCode(resealed.recoveryCode),
    );
    const reset = await post("/auth/recover/reset", {
      email,
      recoveryAuthKey,
      newAuthKey,
      newRecoveryAuthKey,
      vault: toBase64(resealed.blob),
    });
    expect(reset.status).toBe(200);

    // old creds invalidated, new password works
    expect((await post("/auth/recover/verify", { email, recoveryAuthKey })).status).toBe(401);
    expect((await post("/auth/login", { email, authKey, tokenMode: "DIRECT" })).status).toBe(401);
    const newLogin = await post("/auth/login", { email, authKey: newAuthKey, tokenMode: "DIRECT" });
    expect(newLogin.status).toBe(200);
    const newVaultRes = await get("/vault", newLogin.json.accessToken);
    const newVault = await unlockWithPassword(fromBase64(newVaultRes.json.vault), newPassword);
    expect(decoder.decode(newVault.payload)).toBe(expectedPayload);
  }, 60_000);
});
