import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Auth UI state. The raw access token lives in tokenStore (in memory); this
// slice mirrors the *derived* session for the UI — who is signed in and whether
// the initial silent-refresh has resolved yet. It holds no secrets, so it is
// safe to render during SSR.

export interface AuthUser {
  readonly id: string;
  readonly email: string;
}

export type AuthStatus = "unknown" | "authenticated" | "anonymous";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

const initialState: AuthState = {
  status: "unknown",
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionEstablished(state, action: PayloadAction<AuthUser>) {
      state.status = "authenticated";
      state.user = action.payload;
    },
    sessionResolvedAnonymous(state) {
      state.status = "anonymous";
      state.user = null;
    },
    sessionCleared(state) {
      state.status = "anonymous";
      state.user = null;
    },
  },
});

export const { sessionEstablished, sessionResolvedAnonymous, sessionCleared } = authSlice.actions;
export default authSlice.reducer;
