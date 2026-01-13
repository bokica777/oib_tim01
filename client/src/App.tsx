import { Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { IAuthAPI } from "./api/auth/IAuthAPI";
import { AuthAPI } from "./api/auth/AuthAPI";
import { UserAPI } from "./api/users/UserAPI";
import { IUserAPI } from "./api/users/IUserAPI";
import { ProductionPage } from "./pages/ProductionPage";
import { StoragePage } from "./pages/StoragePage";
import { DashboardNavbar } from "./components/dashboard/navbar/Navbar";
import SalesPage from "./pages/SalesPage";

const auth_api: IAuthAPI = new AuthAPI();
const user_api: IUserAPI = new UserAPI();

function App() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {}
      <DashboardNavbar userAPI={user_api} />

      {}
      <div style={{ flex: 1, marginTop: "60px", overflow: "auto" }}>
        <Routes>
          <Route path="/" element={<AuthPage authAPI={auth_api} />} />
          <Route path="/dashboard" element={<ProductionPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/storage" element={<StoragePage />} />
          <Route path="/sales" element={<SalesPage/>} />
          <Route path="*" element={<AuthPage authAPI={auth_api} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
