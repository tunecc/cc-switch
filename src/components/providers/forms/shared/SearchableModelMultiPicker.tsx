import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export interface SearchableModelMultiPickerProps {
  /** 上游拉取到的模型（会话内缓存，仅在弹窗中展示供挑选） */
  models: FetchedModel[];
  /** 已在测试表格中的模型 ID（静态清单 + 已添加），这些项置灰不可勾选 */
  existingIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 勾选集合经「添加到测试」回传给宿主 */
  onAdd: (ids: string[]) => void;
  /** 测试进行中禁用添加（与表格行勾选禁用同一口径） */
  disabled?: boolean;
}

/**
 * 搜索添加模型选择器（连通性测试弹窗用）。
 *
 * 受控 Popover：宿主持有 open（拉取成功后自动弹一次，「搜索添加」按钮
 * 可随时重开）。按厂商分组展示上游模型，多选勾选后经「添加到测试」把
 * 勾选集合回传给宿主；已在测试表格中的模型置灰标注「已在列表」不可勾。
 * 拉取结果仅在会话内缓存，不持久化。
 */
export function SearchableModelMultiPicker({
  models,
  existingIds,
  open,
  onOpenChange,
  onAdd,
  disabled = false,
}: SearchableModelMultiPickerProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // 每次打开重置勾选，丢弃上次未添加的选择
  useEffect(() => {
    if (open) setChecked(new Set());
  }, [open]);

  const existing = useMemo(() => new Set(existingIds), [existingIds]);

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

  const toggle = (id: string) => {
    if (existing.has(id)) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    if (checked.size === 0 || disabled) return;
    // 按分组排序后的列表顺序输出，顺序确定
    const ids = groupedModels
      .flatMap(([, vendorModels]) => vendorModels.map((model) => model.id))
      .filter((id) => checked.has(id) && !existing.has(id));
    if (ids.length === 0) return;
    onAdd(ids);
    onOpenChange(false);
    setChecked(new Set());
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={models.length === 0 || disabled}
        >
          <Search className="h-4 w-4" />
          {t("connectivityTest.searchAdd", { defaultValue: "搜索添加" })}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(420px,calc(100vw-2rem))] p-0 z-[200]"
        // 模态 Dialog 内打开时，popover 挂在 document.body、位于 Dialog 的
        // RemoveScroll shards 之外，wheel 会被 document 级监听 preventDefault
        // 导致列表滚不动；捕获阶段阻断传播即可放行原生滚动（与
        // SearchableModelPicker 同款修复）。
        onWheelCapture={(e) => e.stopPropagation()}
      >
        {/* 外层按 Radix 可用高度限高（var 定义在 PopoverContent 上、可继承），
            模型列表在 CommandList 内部滚动，footer 固定在滚动区之外——
            屏幕空间再紧张「添加到测试」也始终可见，不会被 overflow 裁掉 */}
        <div className="flex max-h-[min(var(--radix-popover-content-available-height),420px)] flex-col">
          <Command className="h-auto min-h-0 flex-1">
            <CommandInput
              placeholder={t("providerForm.searchModels", {
                defaultValue: "搜索模型...",
              })}
            />
            <CommandList className="max-h-none min-h-0 flex-1">
              <CommandEmpty>
                {t("providerForm.noModelsFound", {
                  defaultValue: "未找到匹配模型",
                })}
              </CommandEmpty>
              {groupedModels.map(([vendor, vendorModels]) => (
                <CommandGroup key={vendor} heading={vendor}>
                  {vendorModels.map((model) => {
                    const isExisting = existing.has(model.id);
                    return (
                      <CommandItem
                        key={model.id}
                        value={`${model.id} ${vendor}`}
                        keywords={[model.id, vendor]}
                        disabled={isExisting}
                        onSelect={() => toggle(model.id)}
                        className={cn(isExisting && "opacity-50")}
                      >
                        {isExisting ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {t("connectivityTest.alreadyInList", {
                              defaultValue: "已在列表",
                            })}
                          </span>
                        ) : (
                          // 纯展示态勾选框：点击由 CommandItem 承接（bubble），
                          // pointer-events-none 让真实点击落到行上，避免双触发
                          <Checkbox
                            aria-label={model.id}
                            checked={checked.has(model.id)}
                            className="pointer-events-none"
                            tabIndex={-1}
                          />
                        )}
                        <span className="truncate">{model.id}</span>
                        {isExisting ? null : (
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4 shrink-0",
                              checked.has(model.id)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border-default p-2">
            <span className="text-xs text-muted-foreground">
              {t("connectivityTest.selectedCount", {
                count: checked.size,
                defaultValue: "已选 {{count}}",
              })}
            </span>
            <Button
              type="button"
              size="sm"
              disabled={checked.size === 0 || disabled}
              onClick={handleAdd}
            >
              {t("connectivityTest.addToTest", {
                defaultValue: "添加到测试",
              })}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
