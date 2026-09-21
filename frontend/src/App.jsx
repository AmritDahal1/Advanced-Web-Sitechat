import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import ProtectedRoute from './ProtectedRoute';
import Home from './Home';
import Login from './Login';
import Dashboard from './Dashboard';
import Sites from './Sites';
import SiteDetail from './SiteDetail';
import Notifications from './Notifications';
import Profile from './Profile';
import NotFound from './NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sites" element={<Sites />} />
        <Route path="sites/:siteId" element={<SiteDetail />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
