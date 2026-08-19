// 供应商"当前模型"读取与快捷切换写回的纯函数工具。
//
// 主页卡片徽章与模型快捷切换弹窗共用这一层，保证读写语义与编辑表单一致：
// claude 走 useModelState 的 env 字段与 [1M] 标记语义，codex/grokbuild 走
// providerConfigUtils 的 TOML 顶层 model 读写，gemini 走 env.GEMINI_MODEL。

import { deepClone } from "@/utils/deepClone";
import {
  extractCodexModelName,
  setCodexModelName,
} from "@/utils/providerConfigUtils";
import {
  setClaudeOneMMarker,
  stripClaudeOneMMarker,
} from "@/components/providers/forms/hooks/useModelState";

/** 支持"当前模型显示/快捷切换"的 app */
export type ModelCapableAppId = "claude" | "codex" | "gemini" | "grokbuild";

export const MODEL_CAPABLE_APPS: ModelCapableAppId[] = [
  "claude",
  "codex",
  "gemini",
  "grokbuild",
];

export function isModelCapableApp(appId: string): appId is ModelCapableAppId {
  return (MODEL_CAPABLE_APPS as string[]).includes(appId);
}

/** settingsConfig 类型宽松处理（各 app 结构不同，Provider.settingsConfig 是 object） */
export type ProviderSettingsConfig = Record<string, any>;

// ---------- claude env 字段 ----------

// 模型字段：值 = 所选模型（withOneM 决定是否带 [1M]；HAIKU 例外，永不加）
const CLAUDE_MODEL_FIELDS = [
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_FABLE_MODEL",
  "ANTHROPIC_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
] as const;
const CLAUDE_HAIKU_FIELD = "ANTHROPIC_DEFAULT_HAIKU_MODEL";

// 显示名字段：仅当原值为空、或等于旧模型 base（/ base+[1M]）时写为新 base，
// 否则视为用户自定义名保留。键 = 对应的模型字段名。
const CLAUDE_MODEL_TO_DISPLAY_NAME_FIELD: Record<string, string> = {
  ANTHROPIC_DEFAULT_SONNET_MODEL: "ANTHROPIC_DEFAULT_SONNET_MODEL_NAME",
  ANTHROPIC_DEFAULT_OPUS_MODEL: "ANTHROPIC_DEFAULT_OPUS_MODEL_NAME",
  ANTHROPIC_DEFAULT_FABLE_MODEL: "ANTHROPIC_DEFAULT_FABLE_MODEL_NAME",
};

const isPlainObject = (value: unknown): value is Record<string, any> =>
  Object.prototype.toString.call(value) === "[object Object]";

const asEnvRecord = (value: unknown): Record<string, any> =>
  isPlainObject(value) ? value : {};

const envString = (env: Record<string, any>, key: string): string => {
  const value = env[key];
  return typeof value === "string" ? value : "";
};

/**
 * 读取当前模型（不含 [1M] 后缀的 base）。
 *
 * - claude: env.ANTHROPIC_DEFAULT_SONNET_MODEL，空则回退 env.ANTHROPIC_MODEL
 * - codex/grokbuild: settingsConfig.config（TOML 文本）顶层 model
 * - gemini: env.GEMINI_MODEL
 * - 范围外 app 或全空 → ""
 */
export function getCurrentModel(
  appId: string,
  settingsConfig: unknown,
): string {
  if (!isModelCapableApp(appId)) return "";

  const config = isPlainObject(settingsConfig) ? settingsConfig : {};
  const env = asEnvRecord(config.env);

  switch (appId) {
    case "claude": {
      const sonnet = envString(env, "ANTHROPIC_DEFAULT_SONNET_MODEL").trim();
      if (sonnet) return stripClaudeOneMMarker(sonnet).trim();
      const model = envString(env, "ANTHROPIC_MODEL").trim();
      return stripClaudeOneMMarker(model).trim();
    }
    case "codex":
    case "grokbuild":
      // extractCodexModelName 对非字符串/空文本/无 model 行一律 undefined，
      // 已覆盖坏形状输入。
      return extractCodexModelName(config.config) ?? "";
    case "gemini":
      return envString(env, "GEMINI_MODEL").trim();
    default:
      return "";
  }
}

/**
 * 把所选模型不可变写回 settingsConfig（深拷贝，原对象不变）。
 *
 * - claude: 模型字段写 model（withOneM 决定 [1M]），HAIKU 恒为 base；
 *   显示名字段按"空 / 等于旧 base / 等于旧 base[1M] / 其他（自定义名）"裁决
 * - codex/grokbuild: config 文本经 setCodexModelName 写回（保注释保键序）；
 *   config 缺失时（不应发生）原样返回
 * - gemini: env.GEMINI_MODEL = model
 * - 范围外 app：原样返回（浅拷贝）
 * - settingsConfig 非 object（null 等）时：claude/gemini 视为 { env: {} }
 *   骨架再写；codex/grokbuild 视为 { config: "" } 无法写则原样返回
 */
export function applyModelToSettings(
  appId: string,
  settingsConfig: unknown,
  model: string,
  opts?: { withOneM?: boolean },
): ProviderSettingsConfig {
  if (!isModelCapableApp(appId)) {
    // 浅拷贝兜底：调用方拿到新引用，不误以为可以继续改原对象
    return isPlainObject(settingsConfig) ? { ...settingsConfig } : {};
  }

  const base =
    typeof model === "string" ? stripClaudeOneMMarker(model).trim() : "";
  const withOneM = opts?.withOneM === true;

  // 非 object（null/undefined/原始值）按设计骨架处理；object 深拷贝后修改，
  // 绝不动入参。
  const next: ProviderSettingsConfig = isPlainObject(settingsConfig)
    ? deepClone(settingsConfig)
    : {};

  switch (appId) {
    case "claude": {
      if (!isPlainObject(next.env)) next.env = {};
      const env = next.env;

      // 显示名裁决依赖"旧模型 base"，必须在覆写模型字段之前快照原值。
      const oldDisplayNames = Object.entries(
        CLAUDE_MODEL_TO_DISPLAY_NAME_FIELD,
      ).map(([modelField, nameField]) => ({
        nameField,
        oldBase: stripClaudeOneMMarker(envString(env, modelField)).trim(),
        oldName: envString(env, nameField),
      }));

      // 模型字段：SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 按开关带 [1M]；
      // HAIKU 永不加（1M 只对主对话模型有意义）。
      const marked = setClaudeOneMMarker(base, withOneM);
      for (const field of CLAUDE_MODEL_FIELDS) {
        env[field] = marked;
      }
      env[CLAUDE_HAIKU_FIELD] = base;

      // 显示名：原值为空 / 等于旧 base / 等于旧 base[1M] 时写新 base；
      // 其余视为用户自定义名，保留。
      for (const { nameField, oldBase, oldName } of oldDisplayNames) {
        const shouldReplace =
          !oldName || oldName === oldBase || oldName === `${oldBase}[1M]`;
        if (shouldReplace) {
          env[nameField] = base;
        }
      }
      return next;
    }
    case "codex":
    case "grokbuild": {
      const config = next.config;
      if (typeof config !== "string") return next;
      next.config = setCodexModelName(config, base);
      return next;
    }
    case "gemini": {
      if (!isPlainObject(next.env)) next.env = {};
      next.env.GEMINI_MODEL = base;
      return next;
    }
    default:
      return next;
  }
}
