import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/components/FormField";
import { cn } from "@/lib/utils";

interface HostFilterProps {
  readonly query: string;
  readonly setQuery: (value: string) => void;
  readonly onClear: () => void;
  // An empty vault keeps the field in place but inert: the affordance stays
  // visible so the card does not change shape, without pretending there is
  // anything to filter.
  readonly disabled: boolean;
}

// The search row above the host list. Its label is carried by the placeholder,
// so the <FormField> label is kept for screen readers only.
export function HostFilter({ query, setQuery, onClear, disabled }: HostFilterProps) {
  const { t } = useTranslation();
  const active = query.trim().length > 0;
  return (
    <div className="mx-6 mb-4">
      <FormField
        label={t("connections.filter")}
        labelHidden
        placeholder={t("connections.filterPlaceholder")}
        data-testid="connections-filter"
        value={query}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
        className={cn(
          "h-10 px-2.5 text-[13px]",
          disabled ? "placeholder:text-faint" : "placeholder:text-dim",
        )}
        leading={
          <Search
            size={15}
            aria-hidden
            className={active ? "text-accent" : disabled ? "text-faint" : "text-dim"}
          />
        }
        trailing={active ? <ClearFilterButton onClear={onClear} /> : undefined}
      />
    </div>
  );
}

function ClearFilterButton({ onClear }: { readonly onClear: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={t("connections.clearFilter")}
      data-testid="connections-filter-clear"
      className="flex items-center text-muted hover:text-accent"
    >
      <X size={14} aria-hidden />
    </button>
  );
}
