import { createContext, useContext, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Categories from "./pages/Categories.jsx";
import BusinessList from "./pages/BusinessList.jsx";
import BusinessDetail from "./pages/BusinessDetail.jsx";
import AddBusiness from "./pages/AddBusiness.jsx";
import MyBusiness from "./pages/MyBusiness.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Gallery from "./pages/Gallery.jsx";
import MemberCard from "./pages/MemberCard.jsx";
import Profile from "./pages/Profile.jsx";
import MemberList from "./pages/MemberList.jsx";
import OrganizerList from "./pages/OrganizerList.jsx";
import VerifyCard from "./pages/VerifyCard.jsx";
import TermsAndConditions from "./pages/TermsAndConditions.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

export const NavCtx = createContext(null);
export const useNav = () => useContext(NavCtx);

export default function App() {
  const [page, setPage] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const p = sp.get("page");
      // If a referral link (?ref=TNVS-XXXXXXXX) is in the URL, send directly to signup
      if (sp.get("ref")) return { name: "signup", params: {} };
      if (p === "verify")
        return { name: "verify", params: { id: sp.get("id") || "" } };
      if (
        p &&
        [
          "home",
          "categories",
          "list",
          "detail",
          "add",
          "my",
          "login",
          "signup",
          "gallery",
          "membercard",
          "profile",
          "members",
          "organizers",
          "terms",
          "privacy",
        ].includes(p)
      ) {
        return { name: p, params: {} };
      }
    } catch {}
    return { name: "home", params: {} };
  });

  // In-memory history stack for SPA back navigation
  const [history, setHistory] = useState([]);

  const navigate = (name, params = {}) => {
    setHistory((prev) => [...prev, page]); // push current page before navigating
    setPage({ name, params });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setPage(prev);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPage({ name: "home", params: {} });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const pages = {
    home: <Home />,
    categories: <Categories />,
    list: <BusinessList params={page.params} />,
    detail: <BusinessDetail params={page.params} />,
    add: <AddBusiness params={page.params} />,
    my: <MyBusiness />,
    login: <Login />,
    signup: <Signup />,
    gallery: <Gallery />,
    membercard: <MemberCard />,
    profile: <Profile />,
    members: <MemberList />,
    organizers: <OrganizerList />,
    verify: <VerifyCard params={page.params} />,
    terms: <TermsAndConditions />,
    privacy: <PrivacyPolicy />,
  };

  return (
    <AuthProvider>
      <NavCtx.Provider
        value={{
          navigate,
          goBack,
          current: page,
          canGoBack: history.length > 0,
        }}
      >
        <Navbar />
        <div className="page">{pages[page.name] || <Home />}</div>
        {page.name !== "login" &&
          page.name !== "signup" &&
          page.name !== "verify" && <Footer />}
      </NavCtx.Provider>
    </AuthProvider>
  );
}
