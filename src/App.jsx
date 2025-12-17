import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DriverProvider } from './context/DriverContext';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { PlannerPage } from './pages/PlannerPage';
import { ImportPage } from './pages/ImportPage';
import './App.css';

function App() {
  return (
    <DriverProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="planner" element={<PlannerPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DriverProvider>
  );
}

export default App;
