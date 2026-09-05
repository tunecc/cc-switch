import { extractCodexModelName } from "@/utils/providerConfigUtils";
import { isPlainObject } from "@/lib/requestOverrides";
import type { AppId } from "@/lib/api";

/**
 * 供应商可测模型 ID 清单，与后端 `model_ids_from_settings`
 * （connectivity_test/model_ids.rs）同口径：
 *
 * - `modelCatalog.models` 数组：每条目只取 `model` / `id` / `name` 中
 *   **第一个**非空字段（trim 后非空即命中，取 trim 值）——多别名字段
 *   不重复入列，与后端 `entry_model_id` 一致；
 * - 数组退化为对象（key=模型 id）：取原始键（不 trim；trim 后为空的
 *   键跳过）；
 * - 清单为空时回退：claude → `env.ANTHROPIC_MODEL`（trim）；codex →
 *   `config` TOML 顶层 `model`；其余 app 无回退；
 * - 按出现顺序去重。
 */
export function listProviderModelIds(
  settingsConfig: Record<string, any> | undefined,
  appId: AppId,
): string[] {
  const config = isPlainObject(settingsConfig) ? settingsConfig : {};
  const catalog = isPlainObject(config.modelCatalog) ? config.modelCatalog : {};
  const models = isPlainObject(catalog) ? catalog.models : undefined;

  const ids: string[] = [];
  if (Array.isArray(models)) {
    for (const entry of models) {
      if (!isPlainObject(entry)) continue;
      for (const field of ["model", "id", "name"] as const) {
        const value = entry[field];
        if (typeof value === "string" && value.trim()) {
          ids.push(value.trim());
          break;
        }
      }
    }
  } else if (isPlainObject(models)) {
    for (const key of Object.keys(models)) {
      if (key.trim()) ids.push(key);
    }
  }

  if (ids.length === 0) {
    if (appId === "claude") {
      const env = isPlainObject(config.env) ? config.env : {};
      const model = env["ANTHROPIC_MODEL"];
      if (typeof model === "string" && model.trim()) {
        ids.push(model.trim());
      }
    } else if (appId === "codex") {
      const model = extractCodexModelName(
        typeof config.config === "string" ? config.config : undefined,
      );
      if (model) ids.push(model.trim());
    }
  }

  const seen = new Set<string>();
  return ids.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * 供应商当前生效的模型 ID（连通性测试弹窗打开时的自动勾选回退源）：
 *
 * - claude → `env.ANTHROPIC_MODEL`（trim 后非空即命中）；
 * - codex → `config` TOML 顶层 `model`；
 * - 其余 app 无定义，返回 undefined。
 *
 * 与 `listProviderModelIds` 的回退口径一致；当前模型可能不在
 * modelCatalog 清单里，调用方需自行判断 `modelIds.includes(...)`。
 */
export function currentProviderModelId(
  settingsConfig: Record<string, any> | undefined,
  appId: AppId,
): string | undefined {
  const config = isPlainObject(settingsConfig) ? settingsConfig : {};
  if (appId === "claude") {
    const env = isPlainObject(config.env) ? config.env : {};
    const model = env["ANTHROPIC_MODEL"];
    if (typeof model === "string" && model.trim()) return model.trim();
    return undefined;
  }
  if (appId === "codex") {
    const model = extractCodexModelName(
      typeof config.config === "string" ? config.config : undefined,
    );
    return model?.trim() || undefined;
  }
  return undefined;
}
