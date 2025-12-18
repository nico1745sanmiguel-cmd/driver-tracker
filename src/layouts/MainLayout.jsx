import { Link, Outlet, useLocation } from 'react-router-dom';
import '../App.css';

export function MainLayout() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <div className="container">
            <header className="header">
                <h1>Driver Tracker</h1>
                <p className="subtitle">Tu Copiloto Financiero</p>
            </header>

            <nav className="main-nav">
                <Link to="/" className={`nav-item ${isActive('/')}`}>
                    📊 Dashboard
                </Link>
                <Link to="/history" className={`nav-item ${isActive('/history')}`}>
                    📅 Historial
                </Link>
                <Link to="/planner" className={`nav-item ${isActive('/planner')}`}>
                    ⚙️ Planificación
                </Link>
                <Link to="/import" className={`nav-item ${isActive('/import')}`}>
                    📥 Importar
                </Link>
            </nav>

            <main className="content-wrapper">
                <Outlet />
            </main>
        </div>
    );
}
