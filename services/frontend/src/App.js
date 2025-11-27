import React, { useState, useEffect } from 'react';
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
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState({ sensors: 0, avgTemp: 0, avgHum: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/sensors/latest?limit=100`);
      const sensorData = response.data;
      
      // Procesar datos para el gráfico
      const processedData = sensorData.map(item => {
        const values = typeof item.values === 'string' ? JSON.parse(item.values) : item.values;
        return {
          time: new Date(item.server_ts).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          timestamp: item.server_ts,
          sensor: item.sensor_id,
          temperature: values.temperature || values.temp || 0,
          humidity: values.humidity || values.hum || 0
        };
      }).reverse();

      setData(processedData);

      // Calcular estadísticas
      if (processedData.length > 0) {
        const uniqueSensors = new Set(processedData.map(d => d.sensor)).size;
        const avgTemp = (processedData.reduce((sum, d) => sum + d.temperature, 0) / processedData.length).toFixed(1);
        const avgHum = (processedData.reduce((sum, d) => sum + d.humidity, 0) / processedData.length).toFixed(1);
        setStats({ sensors: uniqueSensors, avgTemp, avgHum });
      }

      setError(null);
    } catch (err) {
      setError(err.message);
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
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <div className="App">
      <header className="header">
        <h1>🌿 Greenhouse IoT Dashboard</h1>
        <p>Sistema de Monitoreo en Tiempo Real</p>
      </header>

      <div className="controls">
        <button onClick={fetchData} className="refresh-btn" disabled={loading}>
          {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
        </button>
        <label className="auto-refresh">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span>Auto-actualizar cada 5s</span>
        </label>
      </div>

      {error && (
        <div className="error">
          ⚠️ Error: {error}. Verifica que el API Gateway esté funcionando.
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.sensors}</div>
          <div className="stat-label">Sensores Activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌡️</div>
          <div className="stat-value">{stats.avgTemp}°C</div>
          <div className="stat-label">Temperatura Promedio</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💧</div>
          <div className="stat-value">{stats.avgHum}%</div>
          <div className="stat-label">Humedad Promedio</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{data.length}</div>
          <div className="stat-label">Lecturas Totales</div>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="charts-container">
          <div className="chart-card">
            <h2>🌡️ Temperatura en el Tiempo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="time" 
                  stroke="#fff"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fontSize: 12 }}
                  label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#fff' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ff6b6b" 
                  fillOpacity={1}
                  fill="url(#colorTemp)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2>💧 Humedad en el Tiempo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="time" 
                  stroke="#fff"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fontSize: 12 }}
                  label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#fff' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#4ecdc4" 
                  fillOpacity={1}
                  fill="url(#colorHum)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card full-width">
            <h2>📊 Temperatura y Humedad Combinadas</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="time" 
                  stroke="#fff"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#fff"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ff6b6b" 
                  strokeWidth={2}
                  dot={false}
                  name="Temperatura (°C)"
                />
                <Line 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#4ecdc4" 
                  strokeWidth={2}
                  dot={false}
                  name="Humedad (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="no-data">
            <p>📭 No hay datos disponibles</p>
            <p>Verifica que el load-generator esté enviando datos</p>
          </div>
        )
      )}

      <footer className="footer">
        <p>Última actualización: {new Date().toLocaleString('es-ES')}</p>
        <p>Sistema IoT de Invernadero - Cloud Computing 2025</p>
      </footer>
    </div>
  );
}

export default App;
