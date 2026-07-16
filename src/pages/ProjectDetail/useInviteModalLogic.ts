import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

interface InviteValues {
  email: string;
}

// Form state for the invite-member modal. Closes and resets itself once the
// invite succeeds (`done`), and gates submit on a non-empty email while leaving
// format validation to zod on submit.
export function useInviteModalLogic(done: boolean, onClose: () => void, reset: () => void) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
      }),
    [t],
  );
  const form = useForm<InviteValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (done) {
      form.reset({ email: "" });
      onClose();
    }
  }, [done, form, onClose]);

  const close = () => {
    reset();
    form.reset({ email: "" });
    onClose();
  };

  const email = form.watch("email");
  return { form, close, canSubmit: email.trim().length > 0 };
}
