import { useAppSelector } from "@/store/hooks";

// Decodes the current session into UI-friendly auth state. Mirrors the
// `useAuthInformation`-style hook described in AUTH.md.
export function useAuthInformation() {
  const status = useAppSelector((s) => s.auth.status);
  const user = useAppSelector((s) => s.auth.user);
  return {
    status,
    user,
    email: user?.email ?? null,
    isAuthenticated: status === "authenticated",
  };
}
