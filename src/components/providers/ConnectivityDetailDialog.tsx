import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ConnectivityTestResult } from "@/lib/api/connectivity-test";

/** 超长文本截断阈值（字符） */
const MAX_TEXT_LENGTH = 2000;

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function truncateText(text: string): string {
  return text.length > MAX_TEXT_LENGTH
    ? `${text.slice(0, MAX_TEXT_LENGTH)}…`
    : text;
}

function DetailSection({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border-default bg-muted/40 p-2 font-mono text-xs leading-relaxed">
        {truncateText(formatValue(value))}
      </pre>
    </div>
  );
}

interface ConnectivityDetailDialogProps {
  result: ConnectivityTestResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 单模型连通性测试详情（只读）。
 *
 * 展示实际请求 URL / headers / body 与响应 headers / body：对象类字段以
 * JSON 美化输出，超过 2000 字符截断为前 2000 字符 + "…"（响应体后端已限制
 * 256 KiB 预览，前端再截断避免长文本拖垮渲染）。
 */
export function ConnectivityDetailDialog({
  result,
  open,
  onOpenChange,
}: ConnectivityDetailDialogProps) {
  const { t } = useTranslation();

  const sectionLabel = (key: string, fallback: string) =>
    t(`connectivityTest.${key}`, { defaultValue: fallback });

  const description = result
    ? [
        result.modelId,
        result.totalMs !== undefined ? `${result.totalMs}ms` : undefined,
        result.errorMessage,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" zIndex="nested">
        <DialogHeader>
          <DialogTitle>
            {t("connectivityTest.requestDetails", {
              defaultValue: "请求详情",
            })}
          </DialogTitle>
          <DialogDescription className="break-all">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <DetailSection
            label={sectionLabel("requestUrl", "请求 URL")}
            value={result?.requestUrl}
          />
          <DetailSection
            label={sectionLabel("requestHeaders", "请求头")}
            value={result?.requestHeaders}
          />
          <DetailSection
            label={sectionLabel("requestBody", "请求体")}
            value={result?.requestBody}
          />
          <DetailSection
            label={sectionLabel("responseHeaders", "响应头")}
            value={result?.responseHeaders}
          />
          <DetailSection
            label={sectionLabel("responseBody", "响应体")}
            value={result?.responseBody}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConnectivityDetailDialog;
