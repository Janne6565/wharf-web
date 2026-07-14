// Flat, ergonomic wrappers over the Orval-generated factory clients. Logic hooks
// call these through React Query (useQuery/useMutation) — never the generated
// factories directly, and never from JSX.

import { getAuthentication } from "./generated/authentication/authentication";
import { getDeviceCodes } from "./generated/device-codes/device-codes";
import type {
  LoginRequest,
  RecoveryResetRequest,
  RecoveryVerifyRequest,
  RegisterRequest,
  UpdateVaultRequest,
} from "./generated/model";
import { getUsers } from "./generated/users/users";
import { getVault as getVaultClient } from "./generated/vault/vault";

const auth = getAuthentication();
const users = getUsers();
const vault = getVaultClient();
const deviceCodes = getDeviceCodes();

export const registerAccount = (body: RegisterRequest) => auth.register(body);
export const login = (body: LoginRequest) => auth.login(body);
// Cookie-mode refresh: the httpOnly refresh cookie is read server-side, so the
// body is empty. Used by the app-load silent refresh.
export const refreshSession = () => auth.refresh({});
export const recoverVerify = (body: RecoveryVerifyRequest) => auth.recoverVerify(body);
export const recoverReset = (body: RecoveryResetRequest) => auth.recoverReset(body);

export const getCurrentUser = () => users.getCurrentUser();

export const getVault = () => vault.getVault();
export const updateVault = (body: UpdateVaultRequest) => vault.updateVault(body);

export const issueDeviceCode = () => deviceCodes.issueDeviceCode();
