import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Info, Loader2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { providersApi } from "@/lib/api/providers";
import type { AppId } from "@/lib/api";
import {
  DEFAULT_CONNECTIVITY_TEST_SETTINGS,
  getConnectivityTestSettings,
  mergeConnectivityTestSettings,
  type ConnectivityTestSettings,
} from "@/lib/connectivityTestSettings";
import { listProviderModelIds } from "@/lib/providerModelIds";
import { isPlainObject } from "@/lib/requestOverrides";
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
    bodyText:
      settings.body !== undefined ? JSON.stringify(settings.body, null, 2) : "",
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
      {t("connectivityTest.waiting", { defaultValue: "等待中" })}
    </span>
  );
}

/**
 * 供应商逐模型连通性测试弹窗。
 *
 * 模型多选（全选 + 默认测试模型预勾选）→ 一次 invoke 整批测试 → 结果表格
 * （模型/状态/首字节/总耗时/错误 + 请求详情子弹窗）。参数表单打开时经
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

  const modelIds = useMemo(
    () => listProviderModelIds(provider.settingsConfig, appId),
    [provider.settingsConfig, appId],
  );

  const [form, setForm] = useState<FormState>(() =>
    settingsToForm(DEFAULT_CONNECTIVITY_TEST_SETTINGS),
  );
  const [selected, setSelected] = useState<string[]>([]);
  /** 本次测试的行集合：以发起测试时的选中集为准，忽略后端多返回的模型 */
  const [testedIds, setTestedIds] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailResult, setDetailResult] =
    useState<ConnectivityTestResult | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { results, runTest, reset } = useConnectivityTest(provider, appId);

  // 打开时从 settings_config 恢复参数并预勾选默认测试模型
  useEffect(() => {
    if (!open) return;
    const settings = getConnectivityTestSettings(provider.settingsConfig);
    setForm(settingsToForm(settings));
    const preset = settings.defaultTestModelId?.trim();
    setSelected(
      preset && modelIds.includes(preset) ? [preset] : ([] as string[]),
    );
    setTestedIds([]);
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
  }, [open, provider, modelIds, reset]);

  const updateForm = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const allSelected =
    modelIds.length > 0 && selected.length === modelIds.length;
  const someSelected = selected.length > 0 && !allSelected;

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
    setSelected(checked ? [...modelIds] : []);
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
    if (selected.length === 0) return;
    const parsed = parseSettings();
    if (!parsed.ok) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    setTestedIds([...selected]);
    await runTest([...selected], parsed.settings);
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

  const anyRunning = useMemo(
    () => Object.values(results).some((entry) => entry.status === "running"),
    [results],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0">
        <DialogHeader>
          <DialogTitle>
            {t("connectivityTest.title", { defaultValue: "连通性测试" })}
          </DialogTitle>
          <DialogDescription>{provider.name}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {/* 模型多选 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("connectivityTest.modelSelection", {
                defaultValue: "选择模型",
              })}
            </div>
            {modelIds.length === 0 ? (
              <p className="rounded-md border border-dashed border-border-default p-3 text-sm text-muted-foreground">
                {t("connectivityTest.noTestableModels", {
                  defaultValue: "无模型可测试",
                })}
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-border-default pb-2">
                  <Checkbox
                    id="conn-select-all"
                    checked={
                      allSelected
                        ? true
                        : someSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label htmlFor="conn-select-all" className="cursor-pointer">
                    {t("connectivityTest.selectAll", { defaultValue: "全选" })}
                  </Label>
                </div>
                <ScrollArea className="max-h-48 pr-3">
                  <div className="space-y-1.5">
                    {modelIds.map((modelId, index) => (
                      <div key={modelId} className="flex items-center gap-2">
                        <Checkbox
                          id={`conn-model-${index}`}
                          checked={selected.includes(modelId)}
                          onCheckedChange={(checked) =>
                            toggleModel(modelId, checked)
                          }
                        />
                        <Label
                          htmlFor={`conn-model-${index}`}
                          className="cursor-pointer font-normal"
                        >
                          {modelId}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {selected.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("connectivityTest.selectModelFirst", {
                      defaultValue: "请先选择要测试的模型",
                    })}
                  </p>
                ) : null}
              </>
            )}
          </div>

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
                  {modelIds.map((modelId) => (
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

          {/* 结果表格：仅渲染发起测试时选中的模型行 */}
          {testedIds.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {t("connectivityTest.results", { defaultValue: "测试结果" })}
              </div>
              <div className="rounded-md border border-border-default">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {testedIds.map((modelId) => {
                      const entry = results[modelId];
                      const result = entry?.result;
                      const errorMessage =
                        entry?.errorMessage ?? result?.errorMessage;
                      return (
                        <TableRow key={modelId}>
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
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
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
