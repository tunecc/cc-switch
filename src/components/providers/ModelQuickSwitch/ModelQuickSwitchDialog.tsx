// 供应商模型快捷切换弹窗。
//
// 与编辑表单同一套读写语义：读走 providerModelUtils.getCurrentModel，
// 写走 applyModelToSettings（claude 的 [1M] 标记语义已在工具内封装）；
// claude 未选模型时支持仅翻转 1M 标记（setClaudeOneMInSettings，模型不动）。
// 拉取模型列表复用 model-fetch 与 SearchableModelPicker，凭据按 app
// 从 settingsConfig 宽松提取（结构随 app 不同，见 extractCredentials）。

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

import type { Provider } from "@/types";
import type { AppId } from "@/lib/api/types";
import { providersApi } from "@/lib/api/providers";
import {
  fetchModelsForConfig,
  showFetchModelsError,
  type FetchedModel,
} from "@/lib/api/model-fetch";
import {
  applyModelToSettings,
  extractModelBadgeForProvider,
  getCurrentModel,
  isModelCapableApp,
  setClaudeOneMInSettings,
} from "@/utils/providerModelUtils";
import { extractCredentials } from "@/utils/providerCredentials";
import { extractErrorMessage } from "@/utils/errorUtils";
import { SearchableModelPicker } from "@/components/providers/forms/shared/SearchableModelPicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ModelQuickSwitchDialogProps {
  provider: Provider;
  appId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelQuickSwitchDialog({
  provider,
  appId,
  open,
  onOpenChange,
}: ModelQuickSwitchDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [models, setModels] = useState<FetchedModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [oneMEnabled, setOneMEnabled] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 供应商当前 1M 状态（与卡片徽章同一判定：SONNET 优先，回退 ANTHROPIC_MODEL）
  const currentOneM = useMemo(
    () =>
      appId === "claude"
        ? (extractModelBadgeForProvider(appId, provider.settingsConfig)?.oneM ??
          false)
        : false,
    [appId, provider.settingsConfig],
  );

  // open 变化时同步瞬态状态：打开时 1M 开关按供应商当前状态初始化，
  // 避免已开 1M 的供应商被"默认关"的开关静默剥掉标记；关闭时清空残留
  useEffect(() => {
    if (open) {
      setOneMEnabled(currentOneM);
      return;
    }
    setModels([]);
    setSelectedModel("");
    setOneMEnabled(false);
    setIsFetching(false);
    setIsSaving(false);
  }, [open, currentOneM]);

  const currentModel = useMemo(
    () =>
      isModelCapableApp(appId)
        ? getCurrentModel(appId, provider.settingsConfig)
        : "",
    [appId, provider.settingsConfig],
  );

  // 未选模型时的"仅 1M"应用：claude 专属，要求当前模型非空且开关状态有变化
  const oneMOnlyApply =
    appId === "claude" &&
    !selectedModel.trim() &&
    Boolean(currentModel) &&
    oneMEnabled !== currentOneM;
  const canApply = Boolean(selectedModel.trim()) || oneMOnlyApply;

  const credentials = useMemo(
    () => extractCredentials(appId, provider.settingsConfig),
    [appId, provider.settingsConfig],
  );
  const hasCredentials = Boolean(credentials.baseUrl && credentials.apiKey);

  const handleFetchModels = useCallback(() => {
    if (!credentials.baseUrl || !credentials.apiKey) {
      showFetchModelsError(null, t, {
        hasApiKey: !!credentials.apiKey,
        hasBaseUrl: !!credentials.baseUrl,
      });
      return;
    }
    setIsFetching(true);
    fetchModelsForConfig(credentials.baseUrl, credentials.apiKey, false)
      .then((fetched) => {
        setModels(fetched);
        if (fetched.length === 0) {
          toast.info(t("providerForm.fetchModelsEmpty"));
        } else {
          toast.success(
            t("providerForm.fetchModelsSuccess", { count: fetched.length }),
          );
        }
      })
      .catch((err) => {
        console.warn("[ModelQuickSwitch] Failed to fetch models:", err);
        showFetchModelsError(err, t);
      })
      .finally(() => setIsFetching(false));
  }, [credentials.baseUrl, credentials.apiKey, t]);

  const handleApply = useCallback(async () => {
    if (isSaving) return;
    const model = selectedModel.trim();
    // 与 canApply 同一口径：未选模型时仅接受"当前模型非空且 1M 状态有变化"
    const oneMOnly =
      appId === "claude" &&
      !model &&
      Boolean(currentModel) &&
      oneMEnabled !== currentOneM;
    if (!model && !oneMOnly) return;
    setIsSaving(true);
    try {
      // 两条写回路径：选了模型 = 全角色写为所选模型；未选模型 = 仅原地
      // 翻转 [1M] 标记（各角色模型 base 与显示名不动）。
      // 两者都深拷贝后写回，provider 原对象不被修改。
      const next = model
        ? applyModelToSettings(appId, provider.settingsConfig, model, {
            withOneM: oneMEnabled,
          })
        : setClaudeOneMInSettings(provider.settingsConfig, oneMEnabled);
      await providersApi.update(
        { ...provider, settingsConfig: next },
        appId as AppId,
      );
      await queryClient.invalidateQueries({ queryKey: ["providers", appId] });
      if (model) {
        toast.success(t("providerModel.applied", { model }));
      } else {
        toast.success(
          t("providerModel.appliedOneMOnly", {
            defaultValue: "已更新 1M 标记，模型保持不变",
          }),
        );
      }
      onOpenChange(false);
    } catch (error) {
      console.warn("[ModelQuickSwitch] Failed to apply model:", error);
      // Tauri invoke 的 reject 值是后端序列化的纯字符串而非 Error 对象，
      // 必须走 extractErrorMessage（与 ProviderList 同款处理）。
      toast.error(
        extractErrorMessage(error) ||
          t("providerModel.applyFailed", { defaultValue: "应用模型失败" }),
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    appId,
    currentModel,
    currentOneM,
    isSaving,
    oneMEnabled,
    onOpenChange,
    provider,
    queryClient,
    selectedModel,
    t,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" zIndex="alert">
        <DialogHeader>
          <DialogTitle>
            {t("providerModel.title", { defaultValue: "模型快捷切换" })}
          </DialogTitle>
          <DialogDescription>{provider.name}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3">
          {/* 当前模型行 */}
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-muted-foreground shrink-0">
                {t("providerModel.currentModel", { defaultValue: "当前模型" })}
              </span>
              <span
                className="font-medium truncate min-w-0"
                title={currentModel || undefined}
              >
                {currentModel || "—"}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={!hasCredentials || isFetching}
              onClick={handleFetchModels}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isFetching
                ? t("providerForm.fetchingModels")
                : t("providerForm.fetchModels")}
            </Button>
          </div>

          {/* 凭据缺失提示：拉取依赖 base_url + api_key，缺失时禁用按钮 */}
          {!hasCredentials && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t("providerModel.noCredentials", {
                  defaultValue: "请先在编辑表单配置 API Key 与请求地址",
                })}
              </p>
            </div>
          )}

          {/* 已选模型展示 */}
          {models.length > 0 && (
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="text-sm truncate min-w-0 flex-1"
                title={selectedModel || undefined}
              >
                {selectedModel || "—"}
              </span>
              <SearchableModelPicker
                models={models}
                value={selectedModel}
                onSelect={setSelectedModel}
              />
            </div>
          )}

          {/* 1M 开关：仅 claude，写回语义已封装在 applyModelToSettings */}
          {appId === "claude" && (
            <div className="flex items-center justify-between">
              <Label
                htmlFor="model-quick-switch-one-m"
                className="text-sm font-normal text-muted-foreground"
              >
                {t("providerModel.applyOneM", {
                  defaultValue: "应用 1M 标记",
                })}
              </Label>
              <Switch
                id="model-quick-switch-one-m"
                checked={oneMEnabled}
                onCheckedChange={setOneMEnabled}
                disabled={isSaving}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!canApply || isSaving}
            onClick={handleApply}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
