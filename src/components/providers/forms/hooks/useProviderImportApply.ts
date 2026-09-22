// 把一次跨应用导入落到具体表单上。
//
// 各应用的扁平 state（codexAuth / geminiEnv / opencodeForm …）归属不同，
// 所以这里只抽出公共的「算字段 + 改 react-hook-form」部分；应用特有的
// 扁平 state 由各表单通过 handlers 自己同步，与它们自己的
// handlePresetChange 保持同一套入口。

import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { AppId } from "@/lib/api/types";
import type { Provider } from "@/types";
import type { ProviderFormData } from "@/lib/schemas/provider";
import {
  buildImportedSettingsConfig,
  patchImportedSettingsConfig,
  readImportableProviderFields,
  resolveImportedApiFormat,
} from "@/utils/providerImport";

/** 新建按模板重建；编辑只在既有配置上覆盖导入范围内的键。 */
export type ProviderImportMode = "add" | "edit";

export interface ProviderImportApplyHandlers {
  /**
   * 同步 settingsConfig 之外的应用特有 state（codex auth/config、gemini env…）。
   * 编辑模式必须只碰导入范围内的字段——整份 reset 会清掉 providerKey、
   * 模型表、modelCatalog 等不在导入范围内的东西。
   */
  syncAppState?: (
    settingsConfig: Record<string, unknown>,
    mode: ProviderImportMode,
  ) => void;
  /** 写入上游 API 格式；目标应用不保存该字段时不必传 */
  applyApiFormat?: (format: string) => void;
  /** 写入认证字段名（Claude 的 AUTH_TOKEN / API_KEY），避免 UI 与配置不一致 */
  applyAuthField?: (field: string) => void;
}

export interface UseProviderImportApplyOptions {
  appId: AppId;
  form: UseFormReturn<ProviderFormData>;
  isEditMode: boolean;
  /** 新建模式下把预设选中态复位到「自定义」 */
  resetPresetSelection: () => void;
  handlers: ProviderImportApplyHandlers;
}

const parseSettingsConfig = (value: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

/** 返回 onImport(sourceAppId, sourceProvider)，供导入弹窗确认时调用。 */
export function useProviderImportApply({
  appId,
  form,
  isEditMode,
  resetPresetSelection,
  handlers,
}: UseProviderImportApplyOptions) {
  const { syncAppState, applyApiFormat, applyAuthField } = handlers;

  return useCallback(
    (sourceAppId: AppId, sourceProvider: Provider) => {
      const fields = readImportableProviderFields(sourceAppId, sourceProvider);
      const importable = {
        baseUrl: fields.baseUrl,
        apiKey: fields.apiKey,
        defaultModel: fields.defaultModel,
      };
      const mode: ProviderImportMode = isEditMode ? "edit" : "add";
      const settingsConfig = isEditMode
        ? patchImportedSettingsConfig(
            appId,
            parseSettingsConfig(form.getValues("settingsConfig")),
            importable,
          )
        : buildImportedSettingsConfig(appId, importable);

      resetPresetSelection();
      // 只覆盖身份字段与配置；图标、第二个官网链接等保持用户当前填写。
      form.reset({
        ...form.getValues(),
        name: fields.name,
        notes: fields.notes,
        websiteUrl: fields.websiteUrl,
        settingsConfig: JSON.stringify(settingsConfig, null, 2),
      });

      syncAppState?.(settingsConfig, mode);

      const apiFormat = resolveImportedApiFormat(appId, fields.apiFormat);
      if (apiFormat) applyApiFormat?.(apiFormat);
      const env = settingsConfig.env;
      if (env && typeof env === "object" && !Array.isArray(env)) {
        const envRecord = env as Record<string, unknown>;
        applyAuthField?.(
          typeof envRecord.ANTHROPIC_API_KEY === "string"
            ? "ANTHROPIC_API_KEY"
            : "ANTHROPIC_AUTH_TOKEN",
        );
      }
    },
    [
      appId,
      form,
      isEditMode,
      resetPresetSelection,
      syncAppState,
      applyApiFormat,
      applyAuthField,
    ],
  );
}
