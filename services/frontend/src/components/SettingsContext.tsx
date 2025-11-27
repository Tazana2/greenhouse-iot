import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Settings = {
  autoRefresh: boolean;
  intervalMs: number;
  sensorLimit: number;
  setAutoRefresh: (v: boolean) => void;
  setIntervalMs: (ms: number) => void;
  setSensorLimit: (n: number) => void;
};

const SettingsContext = createContext<Settings | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    const v = localStorage.getItem('gh:autoRefresh');
    return v === null ? true : v === 'true';
  });
  const [intervalMs, setIntervalMs] = useState<number>(() => {
    const v = localStorage.getItem('gh:intervalMs');
    return v === null ? 5000 : Number(v);
  });
  const [sensorLimit, setSensorLimit] = useState<number>(() => {
    const v = localStorage.getItem('gh:sensorLimit');
    return v === null ? 100 : Number(v);
  });

  useEffect(() => {
    localStorage.setItem('gh:autoRefresh', String(autoRefresh));
  }, [autoRefresh]);

  useEffect(() => {
    localStorage.setItem('gh:intervalMs', String(intervalMs));
  }, [intervalMs]);

  useEffect(() => {
    localStorage.setItem('gh:sensorLimit', String(sensorLimit));
  }, [sensorLimit]);

  return (
    <SettingsContext.Provider value={{ autoRefresh, intervalMs, sensorLimit, setAutoRefresh, setIntervalMs, setSensorLimit }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}