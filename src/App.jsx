import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Photos from '@/pages/Photos';
import PunchList from '@/pages/PunchList';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="photos" element={<Photos />} />
        <Route path="punch-list" element={<PunchList />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <AuthenticatedApp />
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
