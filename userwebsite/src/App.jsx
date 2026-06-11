import { createContext, useContext, useState } from 'react';
import Navbar         from './components/Navbar.jsx';
import Footer         from './components/Footer.jsx';
import Home           from './pages/Home.jsx';
import Categories     from './pages/Categories.jsx';
import BusinessList   from './pages/BusinessList.jsx';
import BusinessDetail from './pages/BusinessDetail.jsx';
import AddBusiness    from './pages/AddBusiness.jsx';
import MyBusiness     from './pages/MyBusiness.jsx';
import Login          from './pages/Login.jsx';
import Signup         from './pages/Signup.jsx';
import Gallery        from './pages/Gallery.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export const NavCtx = createContext(null);
export const useNav = () => useContext(NavCtx);

export default function App() {
  const [page, setPage] = useState({ name: 'home', params: {} });

  const navigate = (name, params = {}) => {
    setPage({ name, params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pages = {
    home:       <Home />,
    categories: <Categories />,
    list:       <BusinessList params={page.params} />,
    detail:     <BusinessDetail params={page.params} />,
    add:        <AddBusiness params={page.params} />,
    my:         <MyBusiness />,
    login:      <Login />,
    signup:     <Signup />,
    gallery:    <Gallery />,
  };

  return (
    <AuthProvider>
      <NavCtx.Provider value={{ navigate, current: page }}>
        <Navbar />
        <div className="page">
          {pages[page.name] || <Home />}
        </div>
        <Footer />
      </NavCtx.Provider>
    </AuthProvider>
  );
}
