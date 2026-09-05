import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Download, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ConnectivityDetailDialog } from "@/components/providers/ConnectivityDetailDialog";
import {
  useConnectivityTest,
  type ModelTestEntry,
} from "@/hooks/useConnectivityTest";
import type { ConnectivityTestResult } from "@/lib/api/connectivity-test";
import {
  fetchModelsForConfig,
  showFetchModelsError,
} from "@/lib/api/model-fetch";
import { providersApi } from "@/lib/api/providers";
import type { AppId } from "@/lib/api";
import {
  DEFAULT_CONNECTIVITY_TEST_SETTINGS,
  getConnectivityTestSettings,
  mergeConnectivityTestSettings,
  type ConnectivityTestSettings,
} from "@/lib/connectivityTestSettings";
import {
  currentProviderModelId,
  listProviderModelIds,
} from "@/lib/providerModelIds";
import { isPlainObject } from "@/lib/requestOverrides";
import { extractCredentials } from "@/utils/providerCredentials";
import type { Provider } from "@/types";

interface ConnectivityTestDialogProps {
  provider: Provider;
  appId: AppId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 「默认测试模型」下拉的空选项哨兵值 */
const DEFAULT_MODEL_NONE = "__none__";

/** 弹窗表单态：数字/JSON 字段以文本承载，便于清空与即时校验反馈 */
interface FormState {
  prompt: string;
  defaultTestModelId: string;
  stream: boolean;
  temperatureText: string;
  maxTokensText: string;
  timeoutSecsText: string;
  headersText: string;
  bodyText: string;
}

function settingsToForm(settings: ConnectivityTestSettings): FormState {
  return {
    prompt: settings.prompt,
    defaultTestModelId: settings.defaultTestModelId ?? "",
    stream: settings.stream,
    temperatureText:
      settings.temperature !== undefined ? String(settings.temperature) : "",
    maxTokensText:
      settings.maxTokens !== undefined ? String(settings.maxTokens) : "",
    timeoutSecsText: String(settings.timeoutSecs),
    headersText:
      settings.headers !== undefined
        ? JSON.stringify(settings.headers, null, 2)
        : "",
    bodyText: settings.body !== undefined ? JSON.stringify(settings.body, null, 2) : "",
  };
}

/** JSON 对象解析：空文本视为未设置；解析失败或非对象视为非法 */
function parseJsonObject(text: string): {
  value?: Record<string, unknown>;
  error?: true;
} {
  const trimmed = text.trim();
  if (!trimmed) return { value: undefined };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { error: true };
  }
  if (!isPlainObject(parsed)) return { error: true };
  return { value: parsed };
}

function parseOptionalNumber(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function StatusCell({ entry }: { entry: ModelTestEntry | undefined }) {
  const { t } = useTranslation();
  const status = entry?.status ?? "waiting";

  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("connectivityTest.running", { defaultValue: "测试中" })}
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="text-green-600 dark:text-green-400">
        {t("connectivityTest.success", { defaultValue: "成功" })}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-red-600 dark:text-red-400">
        {t("connectivityTest.failed", { defaultValue: "失败" })}
      </span>
    );
  }
  return (
    <span className="text-muted-foreground">
      {t("connectivityTest.waiting", { defaultValue: "待测试" })}
    </span>
  );
}

interface SummaryStat {
  key: "selected" | "running" | "success" | "failed" | "pending";
  label: string;
  value: number;
  tone?: "success" | "failed";
}

/** 统计卡：已勾选 / 运行中 / 成功 / 失败 / 待测试（模仿 ai-toolbox summaryGrid） */
function SummaryGrid({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className="rounded-md border border-border-default px-2 py-1.5 text-center"
        >
          <div
            className={cn(
              "text-base font-semibold tabular-nums",
              stat.tone === "success" &&
                "text-green-600 dark:text-green-400",
              stat.tone === "failed" && "text-red-600 dark:text-red-400",
            )}
          >
            {stat.value}
          </div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * 供应商逐模型连通性测试弹窗（单一模型表格形态，模仿 ai-toolbox）。
 *
 * 打开即展示该供应商全部模型行（静态清单 + 会话内拉取的远端模型追加
 * 合并去重），勾选行 → 「开始测试」仅对勾选集合逐模型并行发起真实请求
 * 并行内流式更新；测完自动勾选失败项便于一键重测。参数表单打开时经
 * getConnectivityTestSettings 恢复，「保存参数」仅写回 settings_config
 * 的 connectivityTest 块（mergeConnectivityTestSettings 保留其余字段）。
 */
export function ConnectivityTestDialog({
  provider,
  appId,
  open,
  onOpenChange,
}: ConnectivityTestDialogProps) {
  const { t } = useTranslation();

  /** 静态模型清单（settings_config 解析，与后端同口径） */
  const modelIds = useMemo(
    () => listProviderModelIds(provider.settingsConfig, appId),
    [provider.settingsConfig, appId],
  );

  const [form, setForm] = useState<FormState>(() =>
    settingsToForm(DEFAULT_CONNECTIVITY_TEST_SETTINGS),
  );
  const [selected, setSelected] = useState<string[]>([]);
  /** 远端拉取追加的模型（仅本次弹窗会话有效，不写回配置） */
  const [fetchedIds, setFetchedIds] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailResult, setDetailResult] =
    useState<ConnectivityTestResult | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { results, runTest, reset } = useConnectivityTest(provider, appId);

  /** 全部模型行：静态清单 + 拉取追加（按 ID 去重，静态优先） */
  const allIds = useMemo(() => {
    const seen = new Set(modelIds);
    const appended = fetchedIds.filter((id) => !seen.has(id));
    return [...modelIds, ...appended];
  }, [modelIds, fetchedIds]);

  const credentials = useMemo(
    () => extractCredentials(appId, provider.settingsConfig),
    [appId, provider.settingsConfig],
  );

  // 打开时从 settings_config 恢复参数并自动勾选模型，避免每次手动选：
  // 已保存默认测试模型 → 供应商当前模型（在清单中时）→ 清单首个
  useEffect(() => {
    if (!open) return;
    const settings = getConnectivityTestSettings(provider.settingsConfig);
    setForm(settingsToForm(settings));
    const preset = settings.defaultTestModelId?.trim();
    let initial: string[] = [];
    if (preset && modelIds.includes(preset)) {
      initial = [preset];
    } else {
      const current = currentProviderModelId(provider.settingsConfig, appId);
      const fallback =
        current && modelIds.includes(current) ? current : modelIds[0];
      if (fallback) initial = [fallback];
    }
    setSelected(initial);
    setFetchedIds([]);
    setIsFetching(false);
    setAdvancedOpen(
      settings.temperature !== undefined ||
        settings.maxTokens !== undefined ||
        settings.headers !== undefined ||
        settings.body !== undefined ||
        settings.timeoutSecs !== DEFAULT_CONNECTIVITY_TEST_SETTINGS.timeoutSecs,
    );
    setJsonError(null);
    setDetailResult(null);
    setDetailOpen(false);
    reset();
  }, [open, provider, modelIds, appId, reset]);

  const updateForm = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const allSelected =
    allIds.length > 0 && selected.length === allIds.length;
  const someSelected = selected.length > 0 && !allSelected;

  const anyRunning = useMemo(
    () =>
      allIds.some(
        (modelId) => results[modelId]?.status === "running",
      ),
    [allIds, results],
  );

  const toggleModel = (modelId: string, checked: boolean) => {
    setSelected((prev) =>
      checked
        ? prev.includes(modelId)
          ? prev
          : [...prev, modelId]
        : prev.filter((id) => id !== modelId),
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelected(checked ? [...allIds] : []);
  };

  /** 获取上游模型列表：与模型快捷切换同链路同错误语义，追加合并去重 */
  const handleFetchModels = () => {
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
        const ids = fetched.map((model) => model.id.trim()).filter(Boolean);
        setFetchedIds((prev) => {
          const seen = new Set([...modelIds, ...prev]);
          return [...prev, ...ids.filter((id) => !seen.has(id))];
        });
        if (ids.length === 0) {
          toast.info(
            t("providerForm.fetchModelsEmpty", {
              defaultValue: "未找到可用模型",
            }),
          );
        } else {
          toast.success(
            t("providerForm.fetchModelsSuccess", {
              count: ids.length,
              defaultValue: "获取到 {{count}} 个模型",
            }),
          );
        }
      })
      .catch((err) => {
        console.warn(
          "[ConnectivityTest] Failed to fetch models:",
          err,
        );
        showFetchModelsError(err, t);
      })
      .finally(() => setIsFetching(false));
  };

  const invalidJsonMessage = (field: string) =>
    t("connectivityTest.invalidJson", {
      field,
      defaultValue: "{{field}} 不是有效的 JSON",
    });

  /** 表单 → ConnectivityTestSettings；JSON 非法时返回错误文案 */
  const parseSettings = ():
    | { ok: true; settings: ConnectivityTestSettings }
    | { ok: false; error: string } => {
    const headersLabel = t("connectivityTest.customHeaders", {
      defaultValue: "自定义请求头 (JSON)",
    });
    const bodyLabel = t("connectivityTest.customBody", {
      defaultValue: "自定义请求体 (JSON)",
    });

    const headers = parseJsonObject(form.headersText);
    if (headers.error) {
      return { ok: false, error: invalidJsonMessage(headersLabel) };
    }
    const body = parseJsonObject(form.bodyText);
    if (body.error) {
      return { ok: false, error: invalidJsonMessage(bodyLabel) };
    }

    const timeoutSecs = parseOptionalNumber(form.timeoutSecsText);
    return {
      ok: true,
      settings: {
        prompt: form.prompt,
        defaultTestModelId: form.defaultTestModelId.trim() || undefined,
        stream: form.stream,
        temperature: parseOptionalNumber(form.temperatureText),
        maxTokens: parseOptionalNumber(form.maxTokensText),
        headers: headers.value as Record<string, string> | undefined,
        body: body.value,
        timeoutSecs:
          timeoutSecs !== undefined && timeoutSecs > 0
            ? Math.round(timeoutSecs)
            : DEFAULT_CONNECTIVITY_TEST_SETTINGS.timeoutSecs,
      },
    };
  };

  const handleStart = async () => {
    if (selected.length === 0 || anyRunning) return;
    const parsed = parseSettings();
    if (!parsed.ok) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    const snapshot = [...selected];
    const outcome = await runTest(snapshot, parsed.settings);
    // 测完勾选行为（模仿 ai-toolbox）：有失败项 → 自动勾选失败项便于重测；
    // 全部成功 → 保持用户原勾选
    const failed = snapshot.filter(
      (modelId) => outcome[modelId]?.status === "error",
    );
    setSelected(failed.length > 0 ? failed : snapshot);
  };

  const handleSave = async () => {
    const parsed = parseSettings();
    if (!parsed.ok) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    setSaving(true);
    try {
      await providersApi.update(
        {
          ...provider,
          settingsConfig: mergeConnectivityTestSettings(
            provider.settingsConfig,
            parsed.settings,
          ),
        },
        appId,
        provider.id,
      );
      toast.success(
        t("connectivityTest.paramsSaved", { defaultValue: "测试参数已保存" }),
      );
    } catch (e) {
      toast.error(
        t("connectivityTest.paramsSaveFailed", {
          defaultValue: "测试参数保存失败",
        }) + `: ${String(e)}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const stats: SummaryStat[] = useMemo(() => {
    const countBy = (status: ModelTestEntry["status"]) =>
      allIds.filter((modelId) => results[modelId]?.status === status).length;
    return [
      {
        key: "selected",
        label: t("connectivityTest.statSelected", { defaultValue: "已勾选" }),
        value: selected.length,
      },
      {
        key: "running",
        label: t("connectivityTest.statRunning", { defaultValue: "运行中" }),
        value: countBy("running"),
      },
      {
        key: "success",
        label: t("connectivityTest.statSuccess", { defaultValue: "成功" }),
        value: countBy("success"),
        tone: "success",
      },
      {
        key: "failed",
        label: t("connectivityTest.statFailed", { defaultValue: "失败" }),
        value: countBy("error"),
        tone: "failed",
      },
      {
        key: "pending",
        label: t("connectivityTest.statPending", { defaultValue: "待测试" }),
        value: allIds.filter(
          (modelId) =>
            !results[modelId] || results[modelId].status === "waiting",
        ).length,
      },
    ];
  }, [allIds, results, selected.length, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0" zIndex="alert">
        <DialogHeader>
          <DialogTitle>
            {t("connectivityTest.title", { defaultValue: "连通性测试" })}
          </DialogTitle>
          <DialogDescription>{provider.name}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {/* 基础参数 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="conn-prompt">
                {t("connectivityTest.prompt", { defaultValue: "测试提示词" })}
              </Label>
              <Input
                id="conn-prompt"
                value={form.prompt}
                onChange={(e) => updateForm({ prompt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conn-default-model">
                {t("connectivityTest.defaultTestModel", {
                  defaultValue: "默认测试模型",
                })}
              </Label>
              <Select
                value={form.defaultTestModelId || DEFAULT_MODEL_NONE}
                onValueChange={(value) =>
                  updateForm({
                    defaultTestModelId:
                      value === DEFAULT_MODEL_NONE ? "" : value,
                  })
                }
              >
                <SelectTrigger id="conn-default-model" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_MODEL_NONE}>
                    {t("connectivityTest.defaultTestModelNone", {
                      defaultValue: "不指定",
                    })}
                  </SelectItem>
                  {allIds.map((modelId) => (
                    <SelectItem key={modelId} value={modelId}>
                      {modelId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border-default px-3 py-2.5">
            <Label htmlFor="conn-stream" className="cursor-pointer">
              {t("connectivityTest.stream", { defaultValue: "流式请求" })}
            </Label>
            <Switch
              id="conn-stream"
              checked={form.stream}
              onCheckedChange={(checked) => updateForm({ stream: checked })}
            />
          </div>

          {/* 高级参数 */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 px-2 font-medium"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    advancedOpen && "rotate-90",
                  )}
                />
                {t("connectivityTest.advancedParams", {
                  defaultValue: "高级参数",
                })}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 px-1 pt-3">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="conn-temperature">
                    {t("connectivityTest.temperature", {
                      defaultValue: "温度 (temperature)",
                    })}
                  </Label>
                  <Input
                    id="conn-temperature"
                    type="number"
                    inputMode="decimal"
                    placeholder="—"
                    value={form.temperatureText}
                    onChange={(e) =>
                      updateForm({ temperatureText: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conn-max-tokens">
                    {t("connectivityTest.maxTokens", {
                      defaultValue: "最大 Token (maxTokens)",
                    })}
                  </Label>
                  <Input
                    id="conn-max-tokens"
                    type="number"
                    inputMode="numeric"
                    placeholder="—"
                    value={form.maxTokensText}
                    onChange={(e) =>
                      updateForm({ maxTokensText: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conn-timeout">
                    {t("connectivityTest.timeoutSecs", {
                      defaultValue: "超时时间（秒）",
                    })}
                  </Label>
                  <Input
                    id="conn-timeout"
                    type="number"
                    inputMode="numeric"
                    value={form.timeoutSecsText}
                    onChange={(e) =>
                      updateForm({ timeoutSecsText: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conn-headers">
                  {t("connectivityTest.customHeaders", {
                    defaultValue: "自定义请求头 (JSON)",
                  })}
                </Label>
                <Textarea
                  id="conn-headers"
                  rows={4}
                  className="font-mono text-xs"
                  placeholder={'{\n  "X-Custom": "value"\n}'}
                  value={form.headersText}
                  onChange={(e) => updateForm({ headersText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conn-body">
                  {t("connectivityTest.customBody", {
                    defaultValue: "自定义请求体 (JSON)",
                  })}
                </Label>
                <Textarea
                  id="conn-body"
                  rows={4}
                  className="font-mono text-xs"
                  placeholder={'{\n  "metadata": {}\n}'}
                  value={form.bodyText}
                  onChange={(e) => updateForm({ bodyText: e.target.value })}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {jsonError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {jsonError}
            </p>
          ) : null}

          {/* 模型表格：勾选即测试范围，行内流式更新结果 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {t("connectivityTest.results", { defaultValue: "测试结果" })}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={handleFetchModels}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isFetching
                  ? t("providerForm.fetchingModels", {
                      defaultValue: "正在获取...",
                    })
                  : t("providerForm.fetchModels", {
                      defaultValue: "获取模型列表",
                    })}
              </Button>
            </div>
            <SummaryGrid stats={stats} />
            <div className="rounded-md border border-border-default">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label={t("connectivityTest.selectAll", {
                          defaultValue: "全选",
                        })}
                        checked={
                          allSelected
                            ? true
                            : someSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={toggleSelectAll}
                        disabled={anyRunning || allIds.length === 0}
                      />
                    </TableHead>
                    <TableHead>
                      {t("connectivityTest.model", { defaultValue: "模型" })}
                    </TableHead>
                    <TableHead>
                      {t("connectivityTest.status", { defaultValue: "状态" })}
                    </TableHead>
                    <TableHead>
                      {t("connectivityTest.firstByteMs", {
                        defaultValue: "首字节 (ms)",
                      })}
                    </TableHead>
                    <TableHead>
                      {t("connectivityTest.totalMs", {
                        defaultValue: "总耗时 (ms)",
                      })}
                    </TableHead>
                    <TableHead>
                      {t("connectivityTest.errorInfo", {
                        defaultValue: "错误信息",
                      })}
                    </TableHead>
                    <TableHead className="w-24 text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allIds.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-6 text-center text-muted-foreground"
                      >
                        {t("connectivityTest.noTestableModels", {
                          defaultValue: "无模型可测试",
                        })}
                      </TableCell>
                    </TableRow>
                  ) : (
                    allIds.map((modelId) => {
                      const entry = results[modelId];
                      const result = entry?.result;
                      const errorMessage =
                        entry?.errorMessage ?? result?.errorMessage;
                      return (
                        <TableRow key={modelId}>
                          <TableCell>
                            <Checkbox
                              aria-label={modelId}
                              checked={selected.includes(modelId)}
                              onCheckedChange={(checked) =>
                                toggleModel(modelId, checked)
                              }
                              disabled={anyRunning}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {modelId}
                          </TableCell>
                          <TableCell>
                            <StatusCell entry={entry} />
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {result?.firstByteMs !== undefined
                              ? result.firstByteMs
                              : "—"}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {result?.totalMs !== undefined
                              ? result.totalMs
                              : "—"}
                          </TableCell>
                          <TableCell
                            className="max-w-48 truncate"
                            title={errorMessage}
                          >
                            {errorMessage ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {result ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDetailResult(result);
                                  setDetailOpen(true);
                                }}
                              >
                                {t("connectivityTest.requestDetails", {
                                  defaultValue: "请求详情",
                                })}
                              </Button>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {selected.length === 0 && allIds.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("connectivityTest.selectModelFirst", {
                  defaultValue: "请先选择要测试的模型",
                })}
              </p>
            ) : null}
          </div>
        </div>

        {/* 计费免责声明：真实请求会产生用量与费用 */}
        <div className="flex items-start gap-2 px-6 pb-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("connectivityTest.disclaimer", {
              defaultValue:
                "提示：测试会向上游发送真实请求并可能产生费用与用量消耗，结果仅供参考。",
            })}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("connectivityTest.saveParams", { defaultValue: "保存参数" })}
          </Button>
          <Button
            onClick={handleStart}
            disabled={selected.length === 0 || anyRunning}
          >
            {anyRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("connectivityTest.start", {
              defaultValue: "开始测试 (Start)",
            })}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConnectivityDetailDialog
        result={detailResult}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </Dialog>
  );
}

export default ConnectivityTestDialog;
