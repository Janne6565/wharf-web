import { useAuthInformation } from "@/auth/useAuthInformation";

// The signed-in identity the shell header shows. Kept in a hook so the shell's
// JSX reads no store state directly (REACT.md).
export function useAppShellLogic() {
  const { email } = useAuthInformation();
  return { email };
}
