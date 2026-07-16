import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

export interface MetaValues {
  name: string;
  description: string;
}

// Local state for the inline project-metadata editor: an edit toggle plus the
// name/description form, seeded from the current values each time editing opens.
export function useMetadataHeaderLogic(
  name: string,
  description: string,
  onSave: (name: string, description: string) => void,
) {
  const [editing, setEditing] = useState(false);
  const form = useForm<MetaValues>({ defaultValues: { name, description }, mode: "onSubmit" });

  const open = useCallback(() => {
    form.reset({ name, description });
    setEditing(true);
  }, [form, name, description]);

  const cancel = useCallback(() => setEditing(false), []);

  const onSubmit = form.handleSubmit((values) => {
    onSave(values.name, values.description);
    setEditing(false);
  });

  const watchedName = form.watch("name");
  return {
    editing,
    open,
    cancel,
    form,
    onSubmit,
    canSubmit: watchedName.trim().length > 0,
  };
}
