import { useQuery } from "@tanstack/react-query";
import { MY_INVITES_KEY } from "@/api/queryKeys";
import { getMyInvites } from "@/api/wharf";
import { useAuthInformation } from "@/auth/useAuthInformation";

// The signed-in identity the shell header shows, plus the pending-invite count
// behind the projects link. The invite read is deliberately NOT gated on the
// vault being unlocked — an invite is the one thing a user has no other way of
// discovering in the app, so the badge has to show while the vault is still
// sealed and pull them towards /projects (which then asks for the password).
export function useAppShellLogic() {
  const { email } = useAuthInformation();
  const invitesQuery = useQuery({
    queryKey: MY_INVITES_KEY,
    queryFn: getMyInvites,
    retry: false,
  });
  return { email, inviteCount: invitesQuery.data?.length ?? 0 };
}
