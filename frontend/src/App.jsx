import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from './api';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Businesses from './pages/Businesses.jsx';
import BusinessDetail from './pages/BusinessDetail.jsx';
import Organizers from './pages/Organizers.jsx';
import Members from './pages/Members.jsx';
import Plans from './pages/Plans.jsx';
import Reviews from './pages/Reviews.jsx';
import FlowImages from './pages/FlowImages.jsx';
import Users from './pages/Users.jsx';
import CategoryImages from './pages/CategoryImages.jsx';
import Gallery from './pages/Gallery.jsx';

function App() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vn_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/verify')
      .then((r) => setAuth(r.data.user))
      .catch(() => localStorage.removeItem('vn_token'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-brand-700">Loading…</div>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route
          path="/login"
          element={auth ? <Navigate to="/" replace /> : <Login setAuth={setAuth} />}
        />
        <Route
          path="/"
          element={auth ? <Layout user={auth} setAuth={setAuth} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="businesses" element={<Businesses />} />
          <Route path="businesses/:id" element={<BusinessDetail />} />
          <Route path="organizers" element={<Organizers />} />
          <Route path="members" element={<Members />} />
          <Route path="plans" element={<Plans />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="flow-images" element={<FlowImages />} />
          <Route path="users" element={<Users />} />
          <Route path="category-images" element={<CategoryImages />} />
          <Route path="gallery" element={<Gallery />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
