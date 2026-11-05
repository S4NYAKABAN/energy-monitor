import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Layout from './components/Layout.jsx';
import { navigate, useRoute } from './router.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AutonomyPage from './pages/AutonomyPage.jsx';
import DevicesPage from './pages/DevicesPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const ROUTES = {
  '/': { title: 'Огляд', Page: DashboardPage },
  '/analytics': { title: 'Аналітика', Page: AnalyticsPage },
  '/autonomy': { title: 'Автономне живлення', Page: AutonomyPage },
  '/devices': { title: 'Пристрої', Page: DevicesPage },
  '/alerts': { title: 'Сповіщення', Page: AlertsPage },
  '/settings': { title: 'Налаштування', Page: SettingsPage },
};

function Shell() {
  const { user } = useAuth();
  const path = useRoute();
  const route = ROUTES[path];

  useEffect(() => {
    if (!user && path !== '/login') navigate('/login');
    if (user && path === '/login') navigate('/');
  }, [user, path]);

  useEffect(() => {
    const name = user ? (route ? route.title : 'Не знайдено') : 'Вхід';
    document.title = `${name} | Енергомоніторинг`;
  }, [user, route]);

  if (!user) return <LoginPage />;
  if (path === '/login') return null;

  const Page = route ? route.Page : NotFoundPage;
  return (
    <Layout path={path}>
      <ErrorBoundary key={path}>
        <Page />
      </ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
