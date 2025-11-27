import { BrowserRouter, Routes, Route, NavLink } from 'react-router';
import { SettingsProvider } from './components/SettingsContext';
import DashboardPage from './pages/Dashboard';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <div className="app">
          <aside className="sidebar">
            <div className="brand">Greenhouse IoT</div>
            <nav className="nav">
              <NavLink to="/" end className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}>Dashboard</NavLink>
              <NavLink to="/settings" className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}>Configuración</NavLink>
            </nav>
          </aside>

          <main className="content" style={{ gridArea: 'content' }}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;