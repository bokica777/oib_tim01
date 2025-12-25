import { Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { IAuthAPI } from "./api/auth/IAuthAPI";
import { AuthAPI } from "./api/auth/AuthAPI";
import { UserAPI } from "./api/users/UserAPI";
import { IUserAPI } from "./api/users/IUserAPI";
import { ProductionPage } from "./pages/ProductionPage";

const auth_api: IAuthAPI = new AuthAPI();
const user_api: IUserAPI = new UserAPI();

function App() {
  return (
    <>
      <Routes>
        {/* <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="admin,seller">
              <DashboardPage userAPI={user_api} anotherAPI={API} />
            </ProtectedRoute>
          }
        /> */}
        <Route path="/" element={<AuthPage authAPI={auth_api} />} />
        <Route path="/dashboard" element={<ProductionPage />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="*" element={<AuthPage authAPI={auth_api} />} />
      </Routes>
    </>
  );
}

export default App;
