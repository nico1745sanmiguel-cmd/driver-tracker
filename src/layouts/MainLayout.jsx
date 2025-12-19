import { Link, Outlet, useLocation } from 'react-router-dom';
import '../App.css';

export function MainLayout() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <div className="container">
            {/* Header eliminado porque la nav está arriba y hace de header */}

            <nav className="main-nav">
                <Link to="/" className={`nav-item ${isActive('/')}`}>
                    <span className="nav-icon">📊</span>
                    <span>Dashboard</span>
                </Link>
                <Link to="/history" className={`nav-item ${isActive('/history')}`}>
                    <span className="nav-icon">📅</span>
                    <span>Historial</span>
                </Link>
                <Link to="/planner" className={`nav-item ${isActive('/planner')}`}>
                    <span className="nav-icon">⚙️</span>
                    <span>Plan</span>
                </Link>
                <Link to="/import" className={`nav-item ${isActive('/import')}`}>
                    <span className="nav-icon">📥</span>
                    <span>Importar</span>
                </Link>
            </nav>

            <main className="content-wrapper">
                <Outlet />
            </main>
        </div>
    );
}
