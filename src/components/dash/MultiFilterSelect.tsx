import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type Props = {
  label: string;
  shortLabel?: string;
  values: string[] | null;
  options: Option[];
  allLabel?: string;
  singleOrAll?: boolean;
  singleSelect?: boolean;
  showAllOption?: boolean;
  onChange: (values: string[] | null) => void;
};

export function MultiFilterSelect({
  label,
  shortLabel,
  values,
  options,
  allLabel = "Todas",
  singleOrAll = false,
  singleSelect = false,
  showAllOption = true,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const allSelected = singleSelect
    ? false
    : singleOrAll
    ? values === null
    : values === null ||
      (options.length > 0 && values.length > 0 && options.every((option) => values.includes(option.value)));
  const selectedLabel = allSelected
    ? allLabel
    : singleSelect
      ? (values?.[0]
          ? (options.find((option) => option.value === values[0])?.label ?? values[0])
          : (options[0]?.label ?? "Ventas"))
    : !values || values.length === 0
      ? "Ninguna"
    : values.length === 1
      ? (options.find((option) => option.value === values[0])?.label ?? values[0])
      : `${values.length} seleccionadas`;

  const toggleAll = (checked: boolean) => {
    if (singleOrAll) {
      onChange(checked ? null : []);
      return;
    }
    onChange(checked ? null : []);
  };

  const toggleOption = (value: string, checked: boolean) => {
    if (singleSelect) {
      if (!checked) return;
      onChange([value]);
      setOpen(false);
      return;
    }

    if (singleOrAll) {
      onChange(checked ? [value] : []);
      return;
    }

    const current = allSelected ? options.map((option) => option.value) : (values ?? []);
    const next = checked
      ? [...current.filter((item) => item !== value), value]
      : current.filter((item) => item !== value);
    // If all are selected again => null (= "Todas"), otherwise keep the array (even if empty)
    onChange(next.length === options.length ? null : next.length === 0 ? [] : next);
  };

  const lockedBySingleOrAllMode =
    singleOrAll && values !== null && values.length === 1 ? values[0] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 min-w-0 justify-between rounded-full border-border bg-card px-3.5 text-sm font-medium shadow-none hover:bg-muted/50"
          aria-label={label}
        >
          <span className="mr-2 flex min-w-0 items-center gap-1.5 truncate">
            <span className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
              {(shortLabel || label)}:
            </span>
            <span className={cn("truncate", singleSelect ? "font-semibold text-foreground" : "font-medium")}>
              {selectedLabel}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        {showAllOption && (
          <>
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold hover:bg-muted">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => toggleAll(checked === true)}
              />
              <span>{allLabel}</span>
              {allSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
            </label>
            <div className="my-1 border-t border-border" />
          </>
        )}
        <div className="max-h-64 overflow-y-auto">
          {options.map((option) => {
            const checked = singleSelect
              ? (values ?? []).includes(option.value)
              : singleOrAll
                ? (values ?? []).includes(option.value)
                : allSelected || (values ?? []).includes(option.value);
            const disabled = lockedBySingleOrAllMode !== null && !checked;
            if (singleSelect) {
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value, true)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      checked ? "border-primary text-primary" : "border-border text-transparent",
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                  </span>
                  <span className="min-w-0 truncate">{option.label}</span>
                  {checked && <Check className="ml-auto h-4 w-4 text-primary" />}
                </button>
              );
            }

            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60"
                data-disabled={disabled}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(nextChecked) =>
                    toggleOption(option.value, nextChecked === true)
                  }
                />
                <span className="min-w-0 truncate">{option.label}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default MultiFilterSelect;
