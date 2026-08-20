import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DEV_PANEL_ENABLED } from "@/config/forkBuild";

// fork 仓库版本号（与 package.json/Cargo.toml/tauri.conf.json 三处保持一致）
const FORK_VERSION = "3.19.2-fork.1";

interface DevPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Fork 开发预览面板。仅 fork 构建且开发模式下可见（由调用方在
 * IS_FORK_BUILD && DEV_PANEL_ENABLED 守卫下挂载）。
 * 本轮为占位：集中展示 fork 信息与后续魔改功能入口。
 */
export function DevPanel({ open, onOpenChange }: DevPanelProps) {
  const { t } = useTranslation();
  if (!DEV_PANEL_ENABLED) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20"
            >
              Fork
            </Badge>
            {t("devpanel.title")}
          </DialogTitle>
          <DialogDescription>{t("devpanel.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">
                {t("devpanel.version")}
              </div>
              <div className="font-medium font-mono">{FORK_VERSION}</div>
            </div>
            <div>
              <div className="text-muted-foreground">
                {t("devpanel.buildMode")}
              </div>
              <div className="font-medium">{t("devpanel.forkBuild")}</div>
            </div>
          </div>
          <div className="rounded-md border border-border/50 bg-muted/20 p-3 text-sm">
            <div className="text-muted-foreground mb-1">
              {t("devpanel.upstreamSync")}
            </div>
            <div>{t("devpanel.upstreamSyncPending")}</div>
          </div>
          <div className="rounded-md border border-dashed border-border/50 p-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground mb-1">
              {t("devpanel.upcomingFeatures")}
            </div>
            {t("devpanel.upcomingFeaturesHint")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
