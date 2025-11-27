import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useSettings } from '../components/SettingsContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface SensorValues {
  temperature?: number;
  temp?: number;
  humidity?: number;
  hum?: number;
}

interface SensorDataRaw {
  server_ts: string;
  sensor_id: string;
  values: string | SensorValues;
}

interface ProcessedData {
  time: string;
  timestamp: string;
  sensor: string;
  temperature: number;
  humidity: number;
}

export default function DashboardPage() {
  const { autoRefresh, intervalMs, sensorLimit } = useSettings();
  const [data, setData] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sensorsCount, setSensorsCount] = useState(0);
  const [avgTemp, setAvgTemp] = useState('0');
  const [avgHum, setAvgHum] = useState('0');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get<SensorDataRaw[]>(`${API_URL}/sensors/latest?limit=${sensorLimit}`);
      const sensorData = response.data;
      const processedData: ProcessedData[] = sensorData.map(item => {
        const values: SensorValues = typeof item.values === 'string' ? JSON.parse(item.values) : item.values;
        return {
          time: new Date(item.server_ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: item.server_ts,
          sensor: item.sensor_id,
          temperature: values.temperature || values.temp || 0,
          humidity: values.humidity || values.hum || 0,
        };
      }).reverse();

      setData(processedData);
      console.log('Fetched data:', processedData);
      if (processedData.length > 0) {
        setSensorsCount(new Set(processedData.map(d => d.sensor)).size);
        setAvgTemp((processedData.reduce((sum, d) => sum + d.temperature, 0) / processedData.length).toFixed(1));
        setAvgHum((processedData.reduce((sum, d) => sum + d.humidity, 0) / processedData.length).toFixed(1));
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, intervalMs);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, intervalMs, sensorLimit]);

  return (
    <div>
      <div className="header" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Panel de Monitoreo</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Estado en tiempo real</div>
        </div>
        <div className="controls">
          <button className="button" onClick={fetchData} disabled={loading}>
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
          Error: {error}. Verifica el API Gateway.
        </div>
      )}

      <section className="kpis" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="label">Sensores activos</div>
          <div className="value">{sensorsCount}</div>
        </div>
        <div className="card">
          <div className="label">Temperatura promedio</div>
          <div className="value">{avgTemp}°C</div>
        </div>
        <div className="card">
          <div className="label">Humedad promedio</div>
          <div className="value">{avgHum}%</div>
        </div>
        <div className="card">
          <div className="label">Lecturas totales</div>
          <div className="value">{data.length}</div>
        </div>
      </section>

      {data.length > 0 ? (
        <section className="grid-2">
          <div className="panel">
            <h2>Temperatura</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #1f2937', borderRadius: 8, color: '#e5e7eb' }} />
                <Area type="monotone" dataKey="temperature" stroke="#3b82f6" fill="#1d4ed8" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="panel">
            <h2>Humedad</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #1f2937', borderRadius: 8, color: '#e5e7eb' }} />
                <Area type="monotone" dataKey="humidity" stroke="#22c55e" fill="#16a34a" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <h2>Comparativa</h2>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #1f2937', borderRadius: 8, color: '#e5e7eb' }} />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
                <Line type="monotone" dataKey="temperature" stroke="#3b82f6" strokeWidth={2} dot={false} name="Temperatura (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#22c55e" strokeWidth={2} dot={false} name="Humedad (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : (
        !loading && (
          <div className="panel">No hay datos disponibles. Verifica el generador de carga.</div>
        )
      )}

      <div className="footer" style={{ marginTop: 16 }}>
        Última actualización: {new Date().toLocaleString('es-ES')} — Cloud Computing 2025
      </div>
    </div>
  );
}