import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import OfflineBanner     from "./components/OfflineBanner";
import Sidebar           from "./components/Sidebar";
import Dashboard         from "./pages/Dashboard";
import LoginPage         from "./pages/LoginPage";
import Home              from "./pages/Home";
import AlertsPage        from "./pages/AlertsPage";
import EmergencyPage     from "./pages/EmergencyPage";

// Pages that DON'T use the sidebar layout
const FULL_PAGE_ROUTES = ["/", "/login"];

function Layout({ children, pathname }) {
  const fullPage = FULL_PAGE_ROUTES.includes(pathname);
  if (fullPage) return <>{children}</>;
  return (
    <div style={{ display:"flex" }}>
      <Sidebar />
      <div style={{ marginLeft:250, flex:1, minWidth:0 }}>
        {children}
      </div>
    </div>
  );
}

import { useLocation } from "react-router-dom";

function AppRoutes() {
  const { pathname } = useLocation();
  return (
    <Layout pathname={pathname}>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alerts"    element={<AlertsPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <OfflineBanner />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
