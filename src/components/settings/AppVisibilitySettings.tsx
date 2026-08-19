import { useTranslation } from "react-i18next";
import { Boxes, FolderOpen, History, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleRow } from "@/components/ui/toggle-row";
import { cn } from "@/lib/utils";
import { ProviderIcon } from "@/components/ProviderIcon";
import type { SettingsFormState } from "@/hooks/useSettings";
import type { VisibleApps, VisibleSidebarPanels } from "@/types";
import type { AppId } from "@/lib/api";
import {
  DEFAULT_VISIBLE_APPS,
  DEFAULT_VISIBLE_SIDEBAR_PANELS,
} from "@/config/appConfig";

interface AppVisibilitySettingsProps {
  settings: SettingsFormState;
  onChange: (updates: Partial<SettingsFormState>) => void;
}

const APP_CONFIG: Array<{
  id: AppId;
  icon: string;
  nameKey: string;
}> = [
  { id: "claude", icon: "claude", nameKey: "apps.claudeCode" },
  {
    id: "claude-desktop",
    icon: "claude",
    nameKey: "apps.claudeDesktop",
  },
  { id: "codex", icon: "openai", nameKey: "apps.codex" },
  { id: "gemini", icon: "gemini", nameKey: "apps.gemini" },
  { id: "grokbuild", icon: "grok", nameKey: "apps.grokbuild" },
  { id: "opencode", icon: "opencode", nameKey: "apps.opencode" },
  { id: "openclaw", icon: "openclaw", nameKey: "apps.openclaw" },
  { id: "hermes", icon: "hermes", nameKey: "apps.hermes" },
  { id: "pi", icon: "pi", nameKey: "apps.pi" },
];

export function AppVisibilitySettings({
  settings,
  onChange,
}: AppVisibilitySettingsProps) {
  const { t } = useTranslation();

  const visibleApps: VisibleApps = settings.visibleApps ?? DEFAULT_VISIBLE_APPS;

  const visibleSidebarPanels: VisibleSidebarPanels =
    settings.visibleSidebarPanels ?? DEFAULT_VISIBLE_SIDEBAR_PANELS;

  // Count how many apps are currently visible
  const visibleCount = Object.values(visibleApps).filter(Boolean).length;

  const handleToggle = (appId: AppId) => {
    const isCurrentlyVisible = visibleApps[appId];
    // Prevent disabling the last visible app
    if (isCurrentlyVisible && visibleCount <= 1) return;

    onChange({
      visibleApps: {
        ...visibleApps,
        [appId]: !isCurrentlyVisible,
      },
    });
  };

  const handleSidebarToggle = (key: keyof VisibleSidebarPanels) => {
    onChange({
      visibleSidebarPanels: {
        ...visibleSidebarPanels,
        [key]: !visibleSidebarPanels[key],
      },
    });
  };

  return (
    <section className="space-y-2">
      <header className="space-y-1">
        <h3 className="text-sm font-medium">
          {t("settings.appVisibility.title")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("settings.appVisibility.description")}
        </p>
      </header>
      <div className="flex flex-wrap gap-1 rounded-md border border-border-default bg-background p-1">
        {APP_CONFIG.map((app) => {
          const isVisible = visibleApps[app.id];
          // Disable button if this is the last visible app
          const isDisabled = isVisible && visibleCount <= 1;

          return (
            <AppButton
              key={app.id}
              active={isVisible}
              disabled={isDisabled}
              onClick={() => handleToggle(app.id)}
              icon={app.icon}
              name={t(app.nameKey)}
            >
              {t(app.nameKey)}
            </AppButton>
          );
        })}
      </div>
      <ToggleRow
        icon={<FolderOpen className="h-4 w-4 text-emerald-500" />}
        title={t("settings.appVisibility.showProfileSwitcher")}
        description={t("settings.appVisibility.showProfileSwitcherDescription")}
        checked={settings.showProfileSwitcher ?? true}
        onCheckedChange={(value) => onChange({ showProfileSwitcher: value })}
      />

      <section className="space-y-2 pt-4">
        <header className="space-y-1">
          <h3 className="text-sm font-medium">
            {t("settings.sidebarPanels.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.sidebarPanels.description")}
          </p>
        </header>
        <div className="flex flex-wrap gap-1 rounded-md border border-border-default bg-background p-1">
          <SidebarPanelButton
            active={visibleSidebarPanels.skills}
            onClick={() => handleSidebarToggle("skills")}
            icon={<Wrench className="h-3.5 w-3.5" />}
            label={t("settings.sidebarPanels.skills")}
          />
          <SidebarPanelButton
            active={visibleSidebarPanels.sessions}
            onClick={() => handleSidebarToggle("sessions")}
            icon={<History className="h-3.5 w-3.5" />}
            label={t("settings.sidebarPanels.sessions")}
          />
          <SidebarPanelButton
            active={visibleSidebarPanels.mcp}
            onClick={() => handleSidebarToggle("mcp")}
            icon={<Boxes className="h-3.5 w-3.5" />}
            label={t("settings.sidebarPanels.mcp")}
          />
        </div>
      </section>
    </section>
  );
}

interface AppButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: string;
  name: string;
  children: React.ReactNode;
}

function AppButton({
  active,
  disabled,
  onClick,
  icon,
  name,
  children,
}: AppButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      size="sm"
      variant={active ? "default" : "ghost"}
      className={cn(
        "min-w-[90px] w-auto gap-1.5 px-3",
        active
          ? "shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      <ProviderIcon icon={icon} name={name} size={14} />
      {children}
    </Button>
  );
}

interface SidebarPanelButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function SidebarPanelButton({
  active,
  onClick,
  icon,
  label,
}: SidebarPanelButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      size="sm"
      variant={active ? "default" : "ghost"}
      className={cn(
        "min-w-[90px] w-auto gap-1.5 px-3",
        active
          ? "shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {icon}
      {label}
    </Button>
  );
}
