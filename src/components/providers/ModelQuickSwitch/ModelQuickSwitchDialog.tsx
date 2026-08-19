// 供应商模型快捷切换弹窗。
//
// 与编辑表单同一套读写语义：读走 providerModelUtils.getCurrentModel，
// 写走 applyModelToSettings（claude 的 [1M] 标记语义已在工具内封装）。
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
  getCurrentModel,
  isModelCapableApp,
} from "@/utils/providerModelUtils";
import {
  extractCodexBaseUrl,
  extractCodexExperimentalBearerToken,
} from "@/utils/providerConfigUtils";
import { parseGrokBuildConfig } from "@/utils/grokBuildConfig";
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

/** 凭据预检结果：base_url + api_key，缺任一则拉取按钮禁用 */
interface ProviderCredentials {
  baseUrl: string;
  apiKey: string;
}

const asRecord = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;

const asTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

// 按当前模型读取语义对齐：codex 走 pickCodexApiKey 同款回退
// （auth.OPENAI_API_KEY 缺失时读 config.toml 的 experimental_bearer_token）。
// grokbuild 的 config 是 Grok CLI 自己的 TOML（[model.<profile>] 表），
// 凭据在 auth.OPENAI_API_KEY 或模型表 env_key 指向的变量里——env_key 只是
// 变量名，拿不到值，视为缺 key（官方 OAuth / env 引用场景本就不走该弹窗拉取）。
function extractCredentials(
  appId: string,
  settingsConfig: Record<string, any> | undefined,
): ProviderCredentials {
  const config = asRecord(settingsConfig) ?? {};
  const env = asRecord(config.env) ?? {};
  const auth = asRecord(config.auth) ?? {};
  const configText =
    typeof config.config === "string" ? config.config : undefined;

  switch (appId) {
    case "claude":
      return {
        baseUrl: asTrimmedString(env.ANTHROPIC_BASE_URL),
        apiKey: asTrimmedString(
          env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY,
        ),
      };
    case "codex":
      return {
        baseUrl: extractCodexBaseUrl(configText)?.trim() ?? "",
        apiKey:
          asTrimmedString(auth.OPENAI_API_KEY) ||
          extractCodexExperimentalBearerToken(configText)?.trim() ||
          "",
      };
    case "grokbuild": {
      // grokbuild 供应商的 settingsConfig 是 { config: <TOML> }（无 auth 字段），
      // api_key 在 [model.<default>].api_key / env_key 里；env_key 只是变量名拿不到值。
      const parsed = configText ? parseGrokBuildConfig(configText) : null;
      return {
        baseUrl: parsed?.baseUrl?.trim() ?? "",
        apiKey:
          asTrimmedString(parsed?.apiKey) ||
          asTrimmedString(auth.OPENAI_API_KEY) ||
          "",
      };
    }
    case "gemini":
      return {
        baseUrl: asTrimmedString(env.GOOGLE_GEMINI_BASE_URL),
        apiKey: asTrimmedString(env.GEMINI_API_KEY),
      };
    default:
      return { baseUrl: "", apiKey: "" };
  }
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

  // open 变化时重置瞬态状态，避免上一次打开的模型列表/选择残留
  useEffect(() => {
    if (open) return;
    setModels([]);
    setSelectedModel("");
    setOneMEnabled(false);
    setIsFetching(false);
    setIsSaving(false);
  }, [open]);

  const currentModel = useMemo(
    () => (isModelCapableApp(appId) ? getCurrentModel(appId, provider.settingsConfig) : ""),
    [appId, provider.settingsConfig],
  );

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
    const model = selectedModel.trim();
    if (!model || isSaving) return;
    setIsSaving(true);
    try {
      // applyModelToSettings 深拷贝后写回，provider 原对象不被修改
      const next = applyModelToSettings(
        appId,
        provider.settingsConfig,
        model,
        { withOneM: oneMEnabled },
      );
      await providersApi.update({ ...provider, settingsConfig: next }, appId as AppId);
      await queryClient.invalidateQueries({ queryKey: ["providers", appId] });
      toast.success(t("providerModel.applied", { model }));
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("providerModel.title", { defaultValue: "模型快捷切换" })}
          </DialogTitle>
          <DialogDescription>{provider.name}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* 当前模型行 */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground shrink-0">
              {t("providerModel.currentModel", { defaultValue: "当前模型" })}
            </span>
            <span
              className="font-medium truncate"
              title={currentModel || undefined}
            >
              {currentModel || "—"}
            </span>
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

          {/* 拉取按钮 + 已选模型展示 */}
          <div className="flex items-center gap-2">
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
            {models.length > 0 && (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span
                  className="text-sm truncate min-w-0"
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
          </div>

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
            disabled={!selectedModel.trim() || isSaving}
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
