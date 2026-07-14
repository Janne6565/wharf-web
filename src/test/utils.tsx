import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import authReducer, { type AuthUser } from "@/auth/authSlice";
import "@/i18n/config";

interface WrapperOptions {
  readonly user?: AuthUser;
}

// Builds a fresh Redux store + QueryClient per test so hooks using either work
// in isolation. An optional preloaded user seeds an authenticated session.
export function renderWithProviders(ui: ReactElement, options: WrapperOptions = {}): RenderResult {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: options.user
      ? { auth: { status: "authenticated" as const, user: options.user } }
      : undefined,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ReduxProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
