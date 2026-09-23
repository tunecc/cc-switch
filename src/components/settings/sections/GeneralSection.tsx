import { useTranslation } from "react-i18next";
import {
  Activity,
  Book,
  Boxes,
  ChevronRight,
  History,
  Monitor,
  Moon,
  Sun,
  Wrench,
} from "lucide-react";
import type { SettingsFormState } from "@/hooks/useSettings";
import { useTheme } from "@/components/theme-provider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { isLinux } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { TerminalSelect } from "@/components/settings/TerminalSettings";
import {
  SettingsBlock,
  SettingsCard,
  SettingsRow,
  SettingsSwitchRow,
} from "@/components/settings/SettingsLayout";

type Language = SettingsFormState["language"];

const LANGUAGES: { value: Language; labelKey: string }[] = [
  { value: "zh", labelKey: "settings.languageOptionChinese" },
  { value: "zh-TW", labelKey: "settings.languageOptionTraditionalChinese" },
  { value: "en", labelKey: "settings.languageOptionEnglish" },
  { value: "ja", labelKey: "settings.languageOptionJapanese" },
];

interface GeneralSectionProps {
  settings: SettingsFormState;
  onAutoSave: (updates: Partial<SettingsFormState>) => Promise<boolean>;
  onOpenApps: () => void;
}

export function GeneralSection({
  settings,
  onAutoSave,
  onOpenApps,
}: GeneralSectionProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <SettingsBlock title={t("settings.general.appearance")}>
        <SettingsCard>
          <SettingsRow
            label={t("settings.language")}
            control={
              <Select
                value={settings.language}
                onValueChange={(value) =>
                  void onAutoSave({ language: value as Language })
                }
              >
                <SelectTrigger
                  className="h-8 w-[160px]"
                  aria-label={t("settings.language")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {t(language.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          <SettingsRow
            label={t("settings.theme")}
            control={
              <SegmentedControl
                size="sm"
                aria-label={t("settings.theme")}
                value={theme}
                onValueChange={setTheme}
                items={[
                  {
                    value: "system",
                    label: t("settings.themeSystem"),
                    icon: Monitor,
                  },
                  {
                    value: "light",
                    label: t("settings.themeLight"),
                    icon: Sun,
                  },
                  {
                    value: "dark",
                    label: t("settings.themeDark"),
                    icon: Moon,
                  },
                ]}
              />
            }
          />
          <SettingsRow
            label={t("settings.general.quotaDisplay")}
            help={{
              title: t("settings.general.quotaDisplay"),
              body: t("settings.general.quotaDisplayHelp"),
            }}
            control={
              <SegmentedControl
                size="sm"
                aria-label={t("settings.general.quotaDisplay")}
                value={settings.quotaDisplay ?? "left"}
                onValueChange={(value) =>
                  void onAutoSave({ quotaDisplay: value })
                }
                items={[
                  {
                    value: "left",
                    label: t("settings.general.quotaDisplayLeft"),
                  },
                  {
                    value: "used",
                    label: t("settings.general.quotaDisplayUsed"),
                  },
                ]}
              />
            }
          />
        </SettingsCard>
      </SettingsBlock>

      <SettingsBlock title={t("settings.general.sidebarAndHeader")}>
        <SettingsCard>
          <SettingsRow
            label={t("settings.general.visibleApps")}
            control={
              <Button variant="quiet" size="compact" onClick={onOpenApps}>
                {t("settings.general.goToApps")}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <SettingsSwitchRow
            label={t("settings.appVisibility.showProfileSwitcher")}
            help={{
              title: t("settings.appVisibility.showProfileSwitcher"),
              body: t("settings.appVisibility.showProfileSwitcherDescription"),
            }}
            checked={settings.showProfileSwitcher ?? false}
            onCheckedChange={(value) =>
              void onAutoSave({ showProfileSwitcher: value })
            }
          />
          <SettingsSwitchRow
            label={t("settings.appVisibility.showProviderSearch")}
            help={{
              title: t("settings.appVisibility.showProviderSearch"),
              body: t("settings.appVisibility.showProviderSearchDescription"),
            }}
            checked={settings.showProviderSearch ?? true}
            onCheckedChange={(value) =>
              void onAutoSave({ showProviderSearch: value })
            }
          />
          <SidebarPanelPillRow settings={settings} onAutoSave={onAutoSave} />
        </SettingsCard>
      </SettingsBlock>

      <SettingsBlock title={t("settings.general.updates")}>
        <SettingsCard>
          <SettingsSwitchRow
            label={t("settings.general.checkToolUpdates")}
            help={{
              title: t("settings.general.checkToolUpdates"),
              body: t("settings.general.checkToolUpdatesHelp"),
            }}
            checked={settings.checkToolUpdatesOnStartup ?? false}
            onCheckedChange={(value) =>
              void onAutoSave({ checkToolUpdatesOnStartup: value })
            }
          />
        </SettingsCard>
      </SettingsBlock>

      <SettingsBlock title={t("settings.general.windowAndTerminal")}>
        <SettingsCard>
          <SettingsSwitchRow
            label={t("settings.launchOnStartup")}
            checked={!!settings.launchOnStartup}
            onCheckedChange={(value) =>
              void onAutoSave({ launchOnStartup: value })
            }
          />
          {settings.launchOnStartup && (
            <SettingsSwitchRow
              label={t("settings.silentStartup")}
              help={{
                title: t("settings.silentStartup"),
                body: t("settings.silentStartupDescription"),
              }}
              checked={!!settings.silentStartup}
              onCheckedChange={(value) =>
                void onAutoSave({ silentStartup: value })
              }
            />
          )}
          <SettingsSwitchRow
            label={t("settings.minimizeToTray")}
            help={{
              title: t("settings.minimizeToTray"),
              body: t("settings.general.minimizeToTrayHelp"),
            }}
            checked={settings.minimizeToTrayOnClose}
            onCheckedChange={(value) =>
              void onAutoSave({ minimizeToTrayOnClose: value })
            }
          />
          {isLinux() && (
            <SettingsSwitchRow
              label={t("settings.useAppWindowControls")}
              help={{
                title: t("settings.useAppWindowControls"),
                body: t("settings.useAppWindowControlsDescription"),
              }}
              checked={!!settings.useAppWindowControls}
              onCheckedChange={(value) =>
                void onAutoSave({ useAppWindowControls: value })
              }
            />
          )}
          <SettingsRow
            label={t("settings.terminal.title")}
            help={{
              title: t("settings.terminal.title"),
              body: t("settings.general.terminalHelp"),
            }}
            control={
              <TerminalSelect
                className="h-8 w-[160px]"
                value={settings.preferredTerminal}
                onChange={(terminal) =>
                  void onAutoSave({ preferredTerminal: terminal })
                }
              />
            }
          />
        </SettingsCard>
      </SettingsBlock>
    </>
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
        active ? "shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {icon}
      {label}
    </Button>
  );
}

/** fork：侧边面板入口可见性的紧凑 pill 开关行 */
function SidebarPanelPillRow({
  settings,
  onAutoSave,
}: {
  settings: GeneralSectionProps["settings"];
  onAutoSave: GeneralSectionProps["onAutoSave"];
}) {
  const { t } = useTranslation();
  const panels = settings.visibleSidebarPanels ?? {
    skills: true,
    sessions: true,
    mcp: true,
    prompts: true,
    batchTest: true,
  };
  const toggle = (key: keyof typeof panels) =>
    void onAutoSave({
      visibleSidebarPanels: { ...panels, [key]: !panels[key] },
    });

  return (
    <section className="space-y-2">
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
          active={panels.skills}
          onClick={() => toggle("skills")}
          icon={<Wrench className="h-3.5 w-3.5" />}
          label={t("settings.sidebarPanels.skills")}
        />
        <SidebarPanelButton
          active={panels.sessions}
          onClick={() => toggle("sessions")}
          icon={<History className="h-3.5 w-3.5" />}
          label={t("settings.sidebarPanels.sessions")}
        />
        <SidebarPanelButton
          active={panels.mcp}
          onClick={() => toggle("mcp")}
          icon={<Boxes className="h-3.5 w-3.5" />}
          label={t("settings.sidebarPanels.mcp")}
        />
        <SidebarPanelButton
          active={panels.prompts}
          onClick={() => toggle("prompts")}
          icon={<Book className="h-3.5 w-3.5" />}
          label={t("settings.sidebarPanels.prompts")}
        />
        <SidebarPanelButton
          active={panels.batchTest}
          onClick={() => toggle("batchTest")}
          icon={<Activity className="h-3.5 w-3.5" />}
          label={t("settings.sidebarPanels.batchTest")}
        />
      </div>
    </section>
  );
}
