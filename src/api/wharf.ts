// Flat, ergonomic wrappers over the Orval-generated factory clients. Logic hooks
// call these through React Query (useQuery/useMutation) — never the generated
// factories directly, and never from JSX.

import { getAuthentication } from "./generated/authentication/authentication";
import { getDeviceCodes } from "./generated/device-codes/device-codes";
import type {
  AccountSetupRequest,
  CreateInviteRequest,
  CreateProjectRequest,
  DeleteAccountRequest,
  LoginRequest,
  RecoveryResetRequest,
  RecoveryVerifyRequest,
  RegisterRequest,
  ResendVerificationRequest,
  RotateProjectRequest,
  SubmitWrappedKeyRequest,
  UpdateMemberRoleRequest,
  UpdateProjectRequest,
  UpdatePublicKeyRequest,
  UpdateVaultRequest,
  VerifyEmailRequest,
} from "./generated/model";
import { getOauth } from "./generated/oauth/oauth";
import { getProjects } from "./generated/projects/projects";
import { getUsers } from "./generated/users/users";
import { getVault as getVaultClient } from "./generated/vault/vault";

const auth = getAuthentication();
const users = getUsers();
const vault = getVaultClient();
const deviceCodes = getDeviceCodes();
const oauth = getOauth();
const projects = getProjects();

// Register only creates the account and mails a 6-digit code (202) — it issues
// no tokens and sets no cookie. The session comes from verifyEmail below.
export const registerAccount = (body: RegisterRequest) => auth.register(body);
// Completes registration: same SessionResponse shape as login.
export const verifyEmail = (body: VerifyEmailRequest) => auth.verifyEmail(body);
// Always 202 with an empty body (and a silent 60s cooldown), so the endpoint
// never reveals whether the address belongs to an account.
export const resendVerification = (body: ResendVerificationRequest) =>
  auth.resendVerification(body);
export const login = (body: LoginRequest) => auth.login(body);
// One-time OAuth onboarding: registers the recovery key + initial vault (and,
// when authKey is present, a password credential) atomically. Returns 204.
export const setupAccount = (body: AccountSetupRequest) => auth.setupAccount(body);
// Public: the OAuth providers configured on the backend (empty when none).
export const listOAuthProviders = () => oauth.listOAuthProviders();
// Cookie-mode refresh: the httpOnly refresh cookie is read server-side, so the
// body is empty. Used by the app-load silent refresh.
export const refreshSession = () => auth.refresh({});
export const recoverVerify = (body: RecoveryVerifyRequest) => auth.recoverVerify(body);
export const recoverReset = (body: RecoveryResetRequest) => auth.recoverReset(body);

export const getCurrentUser = () => users.getCurrentUser();

export const getVault = () => vault.getVault();
export const updateVault = (body: UpdateVaultRequest) => vault.updateVault(body);

export const issueDeviceCode = () => deviceCodes.issueDeviceCode();

// --- Wharf Projects (team workspaces) ------------------------------------
// The account's X25519 identity: publish or rotate the public key others seal
// project DEKs against. The private half never leaves the encrypted vault.
export const updatePublicKey = (body: UpdatePublicKeyRequest) => users.updatePublicKey(body);

// Incoming project invites addressed to the signed-in account.
export const getMyInvites = () => users.getMyInvites();
export const acceptInvite = (id: string) => users.acceptInvite(id);
export const declineInvite = (id: string) => users.declineInvite(id);

// Projects the caller belongs to, plus full detail for one project.
export const listProjects = () => projects.listProjects();
export const getProject = (id: string) => projects.getProject(id);
export const createProject = (body: CreateProjectRequest) => projects.createProject(body);
export const updateProject = (id: string, body: UpdateProjectRequest) =>
  projects.updateProject(id, body);
export const deleteProject = (id: string) => projects.deleteProject(id);

// A project's ciphertext blob + the caller's wrapped DEK (statelessly delivered
// every fetch), and the versioned write path.
export const getProjectVault = (id: string) => projects.getProjectVault(id);
export const rotateProject = (id: string, body: RotateProjectRequest) =>
  projects.rotateProject(id, body);

// Invite management + the accept-then-finalize key distribution.
export const createInvite = (id: string, body: CreateInviteRequest) =>
  projects.createInvite(id, body);
export const deleteInvite = (id: string, inviteId: string) => projects.deleteInvite(id, inviteId);
export const getPendingKeys = (id: string) => projects.getPendingKeys(id);
export const submitMemberKey = (id: string, userId: string, body: SubmitWrappedKeyRequest) =>
  projects.submitMemberKey(id, userId, body);

// --- Account deletion -----------------------------------------------------
// What deleting the account destroys, so the confirmation can spell it out.
// springdoc types every field as optional; useDeleteAccountLogic resolves that
// once and exports the tightened shape the UI works with.
export const getAccountDeletionPreview = () => users.getAccountDeletionPreview();

// Irreversibly deletes the account (204). Accounts with a master password must
// re-prove it with a derived authKey; an OAuth-only account omits the field and
// is authorized by the session alone.
export const deleteAccount = (body: DeleteAccountRequest) => users.deleteAccount(body);

// Role changes / transfer (owner) and voluntary leave.
export const updateMemberRole = (id: string, userId: string, body: UpdateMemberRoleRequest) =>
  projects.updateMemberRole(id, userId, body);
export const leaveProject = (id: string) => projects.leaveProject(id);
