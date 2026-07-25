import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getCurrentUser, logout } from "@/api/wharf";
import { ME_QUERY_KEY } from "@/auth/profile";
import { clearSession } from "@/auth/session";
import { useAuthInformation } from "@/auth/useAuthInformation";

// Owns the account screen: the signed-in identity and the sign-out teardown.
export function useAccountLogic() {
  const navigate = useNavigate();
  const { email } = useAuthInformation();

  // Read through the shared /users/me cache the guards already populate.
  // emailVerified is true for every signed-in account today (no token is issued
  // for an unverified one), but the badge reads the real flag rather than
  // asserting that invariant from the UI.
  const profileQuery = useQuery({ queryKey: ME_QUERY_KEY, queryFn: getCurrentUser });

  // Signing out is local-only (the "everywhere" variant is deliberately not
  // surfaced). The teardown runs whether or not the request succeeded: a failed
  // call must still sign the user out on this device, and it is the browser's
  // own state — token, in-memory vault, Redux session — that keeps them in.
  const mutation = useMutation({
    mutationFn: async () => {
      try {
        await logout();
      } catch {
        // Ignored on purpose — see above.
      }
    },
    onSettled: async () => {
      // Leave the guarded screen *before* clearing the session, so no guarded
      // route ever renders against a dead session (same order as deletion).
      await navigate({ to: "/" });
      clearSession();
    },
  });

  return {
    email,
    // Undefined until the profile resolves, so the badge can stay quiet rather
    // than flashing "not verified" at a verified account.
    emailVerified: profileQuery.data?.emailVerified,
    signOut: () => mutation.mutate(),
    isSigningOut: mutation.isPending,
  };
}
