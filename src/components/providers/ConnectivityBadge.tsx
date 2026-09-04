import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type ConnectivityBadgeStatus =
  | "waiting"
  | "running"
  | "success"
  | "error";

interface ConnectivityBadgeProps {
  status: ConnectivityBadgeStatus;
  /** 终态总耗时（毫秒），仅在非运行态展示 */
  totalMs?: number;
  /** 失败原因，悬浮提示展示 */
  errorMessage?: string;
  /** 外部驱动的运行中状态，优先于 status */
  running?: boolean;
  className?: string;
}

/**
 * 连通性测试结果徽标（供应商卡片用，Task 7 集成）。
 *
 * 成功绿点 / 失败红点 + 耗时文本；running 时旋转 spinner。色彩语义与
 * ProviderHealthBadge 保持一致（bg-green-500 / bg-red-500 + dark 变体文本色），
 * 但实现相互独立，不互相引用。
 */
export function ConnectivityBadge({
  status,
  totalMs,
  errorMessage,
  running = false,
  className,
}: ConnectivityBadgeProps) {
  const { t } = useTranslation();

  const isRunning = running || status === "running";
  const label = isRunning
    ? t("connectivityTest.running", { defaultValue: "测试中" })
    : status === "success"
      ? t("connectivityTest.success", { defaultValue: "成功" })
      : status === "error"
        ? t("connectivityTest.failed", { defaultValue: "失败" })
        : t("connectivityTest.waiting", { defaultValue: "等待中" });

  const textColor =
    !isRunning && status === "success"
      ? "text-green-600 dark:text-green-400"
      : !isRunning && status === "error"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";
  const dotColor =
    status === "success"
      ? "bg-green-500"
      : status === "error"
        ? "bg-red-500"
        : "bg-muted-foreground/50";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium",
        textColor,
        className,
      )}
      title={errorMessage}
    >
      {isRunning ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span className={cn("h-2 w-2 rounded-full", dotColor)} />
      )}
      <span>{label}</span>
      {totalMs !== undefined && !isRunning ? (
        <span className="text-muted-foreground">{totalMs}ms</span>
      ) : null}
    </span>
  );
}

export default ConnectivityBadge;
