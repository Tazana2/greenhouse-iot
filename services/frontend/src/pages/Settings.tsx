import { useSettings } from '../components/SettingsContext';

export default function SettingsPage() {
  const { autoRefresh, intervalMs, sensorLimit, setAutoRefresh, setIntervalMs, setSensorLimit } = useSettings();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Configuración</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Preferencias del dashboard</div>
      </div>

      <div className="panel" style={{ maxWidth: 560 }}>
        <h2>Actualización de datos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <label className="switch" style={{ justifyContent: 'space-between' }}>
            <span>Auto-refresco</span>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="label">Intervalo de refresco</span>
            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              style={{
                background: 'var(--panel)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px'
              }}
            >
              <option value={2000}>Cada 2 segundos</option>
              <option value={5000}>Cada 5 segundos</option>
              <option value={10000}>Cada 10 segundos</option>
              <option value={30000}>Cada 30 segundos</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="label">Límite de sensores a leer</span>
            <select
              value={sensorLimit}
              onChange={(e) => setSensorLimit(Number(e.target.value))}
              style={{
                background: 'var(--panel)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px'
              }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}