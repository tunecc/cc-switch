import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { FetchedModel } from "@/lib/api/model-fetch";

interface SearchableModelPickerProps {
  models: FetchedModel[];
  value?: string;
  onSelect: (id: string) => void;
}

export function SearchableModelPicker({
  models,
  value,
  onSelect,
}: SearchableModelPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const groupedModels = useMemo(() => {
    const grouped: Record<string, FetchedModel[]> = {};
    for (const model of models) {
      const vendor = model.ownedBy || "Other";
      if (!grouped[vendor]) grouped[vendor] = [];
      grouped[vendor].push(model);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([vendor, vendorModels]) =>
          [
            vendor,
            [...vendorModels].sort((a, b) => a.id.localeCompare(b.id)),
          ] as const,
      );
  }, [models]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          type="button"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(420px,calc(100vw-2rem))] p-0 z-[200]"
      >
        <Command>
          <CommandInput
            placeholder={t("providerForm.searchModels", {
              defaultValue: "搜索模型...",
            })}
          />
          <CommandList>
            <CommandEmpty>
              {t("providerForm.noModelsFound", {
                defaultValue: "未找到匹配模型",
              })}
            </CommandEmpty>
            {groupedModels.map(([vendor, vendorModels]) => (
              <CommandGroup key={vendor} heading={vendor}>
                {vendorModels.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={`${model.id} ${vendor}`}
                    keywords={[model.id, vendor]}
                    onSelect={() => {
                      onSelect(model.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === model.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{model.id}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
