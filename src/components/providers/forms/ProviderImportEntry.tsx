// 跨应用导入入口：来源应用按钮行 + 来源供应商选择弹窗。
//
// 只负责「选哪个来源应用的哪个供应商」，不碰表单状态——确认后通过
// onImport 把 Provider 交给上层表单，由各表单自己决定怎么把字段写进
// 自己的配置形状（每个应用的 state 归属不同，见 providerImport.ts）。

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import type { AppId } from "@/lib/api/types";
import type { Provider } from "@/types";
import { APP_ICON_MAP, getAppLabel } from "@/config/appConfig";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProviderIcon } from "@/components/ProviderIcon";
import {
  readImportableProviderFields,
  resolveImportedApiFormat,
  targetSupportsApiFormat,
  targetSupportsDefaultModel,
} from "@/utils/providerImport";
import type { ProviderImportSource } from "./hooks/useProviderImportSources";

export interface ProviderImportEntryProps {
  appId: AppId;
  sources: ProviderImportSource[];
  isEditMode: boolean;
  onImport: (sourceAppId: AppId, provider: Provider) => void;
}

type FieldKey =
  | "name"
  | "notes"
  | "websiteUrl"
  | "apiKey"
  | "baseUrl"
  | "model";

// i18n key + defaultValue：与 locales/*.json 的 providerImport.field.* 对齐。
const FIELD_LABELS: Record<FieldKey, { key: string; fallback: string }> = {
  name: { key: "providerImport.field.name", fallback: "供应商名称" },
  notes: { key: "providerImport.field.notes", fallback: "备注" },
  websiteUrl: { key: "providerImport.field.websiteUrl", fallback: "官网链接" },
  apiKey: { key: "providerImport.field.apiKey", fallback: "API Key" },
  baseUrl: { key: "providerImport.field.baseUrl", fallback: "请求地址" },
  model: { key: "providerImport.field.model", fallback: "默认模型" },
};

export function ProviderImportEntry({
  appId,
  sources,
  isEditMode,
  onImport,
}: ProviderImportEntryProps) {
  const { t } = useTranslation();
  const [activeSource, setActiveSource] = useState<ProviderImportSource | null>(
    null,
  );
  const [selectedProviderId, setSelectedProviderId] = useState("");

  const supportsApiFormat = targetSupportsApiFormat(appId);
  const supportsDefaultModel = targetSupportsDefaultModel(appId);

  const openSource = (source: ProviderImportSource) => {
    setActiveSource(source);
    setSelectedProviderId("");
  };

  const closeSource = () => {
    setActiveSource(null);
    setSelectedProviderId("");
  };

  const selectedProvider = useMemo(
    () =>
      activeSource?.providers.find(
        (provider) => provider.id === selectedProviderId,
      ) ?? null,
    [activeSource, selectedProviderId],
  );

  // 选中供应商后就能预告「哪些字段真的有值会被写入」；空字段不进清单，
  // 免得让用户以为会写下空值。
  const writableFields = useMemo<FieldKey[]>(() => {
    if (!activeSource || !selectedProvider) return [];
    const fields = readImportableProviderFields(
      activeSource.appId,
      selectedProvider,
    );
    const keys: FieldKey[] = [];
    if (fields.name) keys.push("name");
    if (fields.notes) keys.push("notes");
    if (fields.websiteUrl) keys.push("websiteUrl");
    if (fields.apiKey) keys.push("apiKey");
    if (fields.baseUrl) keys.push("baseUrl");
    if (fields.defaultModel && supportsDefaultModel) keys.push("model");
    return keys;
  }, [activeSource, selectedProvider, supportsDefaultModel]);

  const apiFormatNote = useMemo(() => {
    if (!activeSource || !selectedProvider) return null;
    const fields = readImportableProviderFields(
      activeSource.appId,
      selectedProvider,
    );
    const resolved = resolveImportedApiFormat(appId, fields.apiFormat);
    if (resolved) {
      return t("providerImport.apiFormatWillImport", {
        format: fields.apiFormat,
        defaultValue: "上游格式：{{format}}",
      });
    }
    if (!supportsApiFormat) {
      return t("providerImport.apiFormatUnsupported", {
        defaultValue: "当前应用不保存上游格式，该字段不会写入",
      });
    }
    if (fields.apiFormat) {
      return t("providerImport.apiFormatNotMappable", {
        format: fields.apiFormat,
        defaultValue: "上游格式 {{format}} 在当前应用没有对应取值，将保持默认",
      });
    }
    return t("providerImport.apiFormatMissing", {
      defaultValue: "来源供应商未声明上游格式，将保持当前应用默认",
    });
  }, [activeSource, selectedProvider, appId, supportsApiFormat, t]);

  if (sources.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {t("providerImport.label", { defaultValue: "从其他应用导入" })}
        </span>
        {sources.map((source) => (
          <Button
            key={source.appId}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5"
            onClick={() => openSource(source)}
          >
            <Download className="size-3.5" />
            {/* 应用图标是装饰性的（按钮文案已含应用名），藏起来避免它的
                <title> 被算进可访问名称，读出来会变成「Claude 从 Claude 导入」 */}
            <span aria-hidden="true" className="inline-flex">
              {APP_ICON_MAP[source.appId]?.icon}
            </span>
            <span className="truncate">
              {t("providerImport.button", {
                app: t(`apps.${source.appId}`, {
                  defaultValue: getAppLabel(source.appId),
                }),
                defaultValue: "从 {{app}} 导入",
              })}
            </span>
          </Button>
        ))}
      </div>

      <Dialog
        open={activeSource !== null}
        onOpenChange={(open) => {
          if (!open) closeSource();
        }}
      >
        <DialogContent zIndex="top" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {activeSource
                ? t("providerImport.dialogTitle", {
                    app: t(`apps.${activeSource.appId}`, {
                      defaultValue: getAppLabel(activeSource.appId),
                    }),
                    defaultValue: "从 {{app}} 导入供应商",
                  })
                : ""}
            </DialogTitle>
            <DialogDescription>
              {t("providerImport.dialogDescription", {
                defaultValue:
                  "选择要导入的供应商。仅迁移名称、备注、官网链接、API Key、请求地址、默认模型与上游格式，其余配置请自行填写。",
              })}
            </DialogDescription>
          </DialogHeader>

          {isEditMode && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
              {t("providerImport.overwriteWarning", {
                defaultValue:
                  "导入会覆盖当前表单已填写的名称、备注、官网链接、密钥和请求地址。",
              })}
            </p>
          )}

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {activeSource?.providers.map((provider) => {
              const fields = readImportableProviderFields(
                activeSource.appId,
                provider,
              );
              const isSelected = provider.id === selectedProviderId;
              return (
                <button
                  key={provider.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedProviderId(provider.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border-default hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ProviderIcon
                      icon={provider.icon}
                      name={provider.name}
                      color={provider.iconColor}
                      size={16}
                    />
                    <span className="truncate text-sm font-medium">
                      {provider.name}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {fields.notes ||
                      t("providerImport.emptyNotes", {
                        defaultValue: "无备注",
                      })}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fields.baseUrl ||
                      t("providerImport.noAddress", {
                        defaultValue: "未配置请求地址",
                      })}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedProvider && (
            <div className="space-y-1 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                {t("providerImport.fieldsTitle", {
                  defaultValue: "本次将写入",
                })}
              </p>
              <p>
                {writableFields.length > 0
                  ? writableFields
                      .map((field) =>
                        t(FIELD_LABELS[field].key, {
                          defaultValue: FIELD_LABELS[field].fallback,
                        }),
                      )
                      .join(" · ")
                  : t("providerImport.fieldsEmpty", {
                      defaultValue: "（没有可写入的字段）",
                    })}
              </p>
              {apiFormatNote && <p>{apiFormatNote}</p>}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeSource}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              disabled={!activeSource || !selectedProvider}
              onClick={() => {
                if (!activeSource || !selectedProvider) return;
                onImport(activeSource.appId, selectedProvider);
                closeSource();
              }}
            >
              {t("providerImport.confirm", { defaultValue: "导入" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
