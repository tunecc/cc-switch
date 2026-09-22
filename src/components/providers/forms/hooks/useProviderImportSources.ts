// 跨应用导入的来源应用枚举：按「已在设置中启用 + 有供应商 + 不是当前应用」
// 过滤。
//
// 刻意不用 react-query：表单有若干测试直接 render 而不挂 QueryClientProvider，
// 挂 query 会让那些测试直接崩；这里用一次性 effect 拉取，供应商表单是短命
// 面板，每次打开重读一次本地数据库的代价可以接受。

import { useEffect, useMemo, useState } from "react";
import type { AppId } from "@/lib/api/types";
import type { Provider, Settings, VisibleApps } from "@/types";
import { APP_IDS, DEFAULT_VISIBLE_APPS } from "@/config/appConfig";
import { providersApi, settingsApi } from "@/lib/api";

export interface ProviderImportSource {
  appId: AppId;
  providers: Provider[];
}

const toProviders = (providers: Record<string, Provider> | undefined) =>
  Object.values(providers ?? {});

const isVisibleApp = (settings: Settings | undefined, appId: AppId) => {
  const visibleApps: VisibleApps =
    settings?.visibleApps ?? DEFAULT_VISIBLE_APPS;
  return visibleApps[appId] !== false;
};

/** 枚举当前可作为导入来源的应用。 */
export function useProviderImportSources(appId: AppId): ProviderImportSource[] {
  const [settings, setSettings] = useState<Settings | undefined>();
  const [providersByApp, setProvidersByApp] = useState<
    Partial<Record<AppId, Provider[]>>
  >({});

  const candidateAppIds = useMemo(
    () =>
      APP_IDS.filter(
        (candidate) => candidate !== appId && isVisibleApp(settings, candidate),
      ),
    [appId, settings],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let nextSettings: Settings | undefined;
      try {
        nextSettings = await settingsApi.get();
      } catch (error) {
        console.error("获取设置失败:", error);
      }
      if (cancelled) return;
      setSettings(nextSettings);

      const candidates = APP_IDS.filter(
        (candidate) =>
          candidate !== appId && isVisibleApp(nextSettings, candidate),
      );
      const entries = await Promise.all(
        candidates.map(async (candidate) => {
          try {
            return [
              candidate,
              toProviders(await providersApi.getAll(candidate)),
            ];
          } catch (error) {
            console.error(`获取 ${candidate} 供应商列表失败:`, error);
            return [candidate, [] as Provider[]];
          }
        }),
      );
      if (cancelled) return;
      setProvidersByApp(
        Object.fromEntries(entries) as Partial<Record<AppId, Provider[]>>,
      );
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [appId]);

  return useMemo(
    () =>
      candidateAppIds
        .map((candidate) => ({
          appId: candidate,
          providers: providersByApp[candidate] ?? [],
        }))
        .filter((source) => source.providers.length > 0),
    [candidateAppIds, providersByApp],
  );
}
