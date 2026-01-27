import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuthHook";

export default function OAuthSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const didRun = useRef(false);
  const token = params.get("token");

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    login(token);
    navigate("/dashboard", { replace: true });
  }, [token, login, navigate]);

  return (
    <div style={{ padding: 24 }}>
      <div className="window" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="titlebar">
          <span className="titlebar-title">OAuth</span>
        </div>
        <div className="window-content" style={{ padding: 16 }}>
          Prijava je uspešna. Preusmeravam...
        </div>
      </div>
    </div>
  );
}
