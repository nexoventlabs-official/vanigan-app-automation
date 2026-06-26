import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from './api';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Businesses from './pages/Businesses.jsx';
import BusinessDetail from './pages/BusinessDetail.jsx';
import Organizers from './pages/Organizers.jsx';
import DirectOrganizer from './pages/DirectOrganizer.jsx';
import Postings from './pages/Postings.jsx';
import Wings from './pages/Wings.jsx';
import Members from './pages/Members.jsx';
import Plans from './pages/Plans.jsx';
import Reviews from './pages/Reviews.jsx';
import FlowImages from './pages/FlowImages.jsx';
import Users from './pages/Users.jsx';
import CategoryImages from './pages/CategoryImages.jsx';
import Gallery from './pages/Gallery.jsx';
import Referrals from './pages/Referrals.jsx';

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
          <Route path="directorg" element={<DirectOrganizer />} />
          <Route path="postings" element={auth?.username === 'vanigan' ? <Navigate to="/members" replace /> : <Postings />} />
          <Route path="wings" element={auth?.username === 'vanigan' ? <Navigate to="/members" replace /> : <Wings />} />
          <Route path="members" element={<Members />} />
          <Route path="plans" element={auth?.username === 'vanigan' ? <Navigate to="/members" replace /> : <Plans />} />
          <Route path="reviews" element={auth?.username === 'vanigan' ? <Navigate to="/members" replace /> : <Reviews />} />
          <Route path="flow-images" element={auth?.username === 'vanigan' ? <Navigate to="/members" replace /> : <FlowImages />} />
          <Route path="users" element={auth?.username === 'vanigan' ? <Navigate to="/members" replace /> : <Users />} />
          <Route path="category-images" element={auth?.username === 'vanigan' ? <Navigate to="/members" replace /> : <CategoryImages />} />
          <Route path="gallery" element={auth?.username === 'vanigan' ? <Navigate to="/members" replace /> : <Gallery />} />
          <Route path="referrals" element={<Referrals />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
