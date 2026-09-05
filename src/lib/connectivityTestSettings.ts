import { isPlainObject } from "@/lib/requestOverrides";
import { deepClone } from "@/utils/deepClone";

export interface ConnectivityTestSettings {
  prompt: string;
  defaultTestModelId?: string;
  stream: boolean;
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  timeoutSecs: number;
}

export const DEFAULT_CONNECTIVITY_TEST_SETTINGS: ConnectivityTestSettings = {
  prompt: "你好，你可以帮我做什么事情",
  stream: true,
  timeoutSecs: 30,
};

// `connectivityTest` is cc-switch-internal metadata stored inside the
// provider's settings_config. The Rust side strips it
// (sanitize_claude_settings_for_live) before writing live Claude
// settings.json, so persisting it here never leaks to the CLI process.

export function getConnectivityTestSettings(
  settingsConfig: Record<string, any>,
): ConnectivityTestSettings {
  const raw = isPlainObject(settingsConfig)
    ? settingsConfig.connectivityTest
    : undefined;
  const saved: Record<string, unknown> = isPlainObject(raw) ? raw : {};

  // Always return the full shape (missing optionals become undefined) so
  // callers get a stable object for form state.
  return {
    prompt:
      typeof saved.prompt === "string"
        ? saved.prompt
        : DEFAULT_CONNECTIVITY_TEST_SETTINGS.prompt,
    defaultTestModelId:
      typeof saved.defaultTestModelId === "string"
        ? saved.defaultTestModelId
        : undefined,
    stream:
      typeof saved.stream === "boolean"
        ? saved.stream
        : DEFAULT_CONNECTIVITY_TEST_SETTINGS.stream,
    temperature:
      typeof saved.temperature === "number" ? saved.temperature : undefined,
    maxTokens:
      typeof saved.maxTokens === "number" ? saved.maxTokens : undefined,
    headers: isPlainObject(saved.headers)
      ? (deepClone(saved.headers) as Record<string, string>)
      : undefined,
    body: isPlainObject(saved.body)
      ? (deepClone(saved.body) as Record<string, unknown>)
      : undefined,
    timeoutSecs:
      typeof saved.timeoutSecs === "number"
        ? saved.timeoutSecs
        : DEFAULT_CONNECTIVITY_TEST_SETTINGS.timeoutSecs,
  };
}

// Writes only fields that differ from the defaults (undefined optionals are
// always skipped) so the persisted payload stays minimal; a saved block whose
// values are all defaults is removed outright. The input settingsConfig is
// deep-copied and never mutated.
export function mergeConnectivityTestSettings(
  settingsConfig: Record<string, any>,
  next: ConnectivityTestSettings,
): Record<string, any> {
  const result = deepClone(settingsConfig);
  const stored: Record<string, unknown> = {};

  if (next.prompt !== DEFAULT_CONNECTIVITY_TEST_SETTINGS.prompt) {
    stored.prompt = next.prompt;
  }
  if (next.stream !== DEFAULT_CONNECTIVITY_TEST_SETTINGS.stream) {
    stored.stream = next.stream;
  }
  if (next.timeoutSecs !== DEFAULT_CONNECTIVITY_TEST_SETTINGS.timeoutSecs) {
    stored.timeoutSecs = next.timeoutSecs;
  }
  if (next.defaultTestModelId !== undefined) {
    stored.defaultTestModelId = next.defaultTestModelId;
  }
  if (next.temperature !== undefined) {
    stored.temperature = next.temperature;
  }
  if (next.maxTokens !== undefined) {
    stored.maxTokens = next.maxTokens;
  }
  if (next.headers !== undefined) {
    stored.headers = deepClone(next.headers);
  }
  if (next.body !== undefined) {
    stored.body = deepClone(next.body);
  }

  if (Object.keys(stored).length > 0) {
    result.connectivityTest = stored;
  } else {
    delete result.connectivityTest;
  }
  return result;
}
