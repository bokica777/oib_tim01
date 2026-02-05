import React, { useEffect, useMemo, useState } from "react";
import { UserAPI } from "../api/users/UserAPI";
import { UserDTO } from "../models/users/UserDTO";
import { useAuth } from "../hooks/useAuthHook";

type FormState = {
  id?: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string; 
};

const emptyForm: FormState = {
  username: "",
  email: "",
  role: "seller",
  firstName: "",
  lastName: "",
  profileImage: "",
};

const roles = ["admin", "sales_manager", "seller"];

const AdminUsersPage: React.FC = () => {
  const { token } = useAuth();
  const user_api = useMemo(() => new UserAPI(), []);

  const [activeTab, setActiveTab] = useState<"korisnici">("korisnici");

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search
  const [qUsername, setQUsername] = useState("");
  const [qEmail, setQEmail] = useState("");
  const [qRole, setQRole] = useState("");

  // form
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<FormState>(emptyForm);

  const requireToken = () => {
    const t = token ?? localStorage.getItem("accessToken");
    if (!t) throw new Error("No access token");
    return t;
  };

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const t = requireToken();
      const data = await user_api.getAllUsers(t);
      setUsers(data);
    } catch (e: any) {
      setError(e?.message ?? "Ne mogu da učitam korisnike.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const startCreate = () => {
    setFormMode("create");
    setForm({ ...emptyForm });
  };

  const startEdit = (u: UserDTO) => {
    setFormMode("edit");
    setForm({
      id: u.id,
      username: u.username ?? "",
      email: u.email ?? "",
      role: (u.role ?? "seller").toLowerCase(),
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      profileImage: u.profileImage ?? "",
    });
  };

  const doSearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const t = requireToken();
      const params = {
        username: qUsername.trim() || undefined,
        email: qEmail.trim() || undefined,
        role: qRole.trim() || undefined,
      };

      const data = await user_api.searchUsers(t, params);
      setUsers(data);
    } catch (e: any) {
      setError(e?.message ?? "Pretraga nije uspela.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = async () => {
    setQUsername("");
    setQEmail("");
    setQRole("");
    await loadAll();
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);

    try {
      const t = requireToken();
      if (!form.username.trim()) throw new Error("Username je obavezan.");
      if (!form.email.trim()) throw new Error("Email je obavezan.");
      if (!form.role.trim()) throw new Error("Uloga je obavezna.");

      const dto: Partial<UserDTO> = {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        firstName: form.firstName?.trim() || undefined,
        lastName: form.lastName?.trim() || undefined,
        profileImage: form.profileImage?.trim() || undefined,
      };

      const created = await user_api.createUser(t, dto);
      setUsers((prev) => [created, ...prev]);
      startCreate();
    } catch (e: any) {
      setError(e?.message ?? "Kreiranje nije uspelo.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async () => {
    setBusy(true);
    setError(null);

    try {
      const t = requireToken();
      if (!form.id) throw new Error("Nedostaje ID korisnika.");

      const dto: Partial<UserDTO> = {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        firstName: form.firstName?.trim() || undefined,
        lastName: form.lastName?.trim() || undefined,
        profileImage: form.profileImage?.trim() || undefined,
      };

      const updated = await user_api.updateUser(t, form.id, dto);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      startCreate();
    } catch (e: any) {
      setError(e?.message ?? "Izmena nije uspela.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm(`Da li si sigurna da želiš da obrišeš korisnika #${id}?`);
    if (!ok) return;

    setBusy(true);
    setError(null);

    try {
      const t = requireToken();
      await user_api.deleteUser(t, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (formMode === "edit" && form.id === id) startCreate();
    } catch (e: any) {
      setError(e?.message ?? "Brisanje nije uspelo.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = () => {
    if (formMode === "create") return handleCreate();
    return handleUpdate();
  };

  return (
    <div
      className="overlay-blur-none"
      style={{
        position: "fixed",
        inset: 0,
        padding: "10px",
        backgroundColor: "var(--win11-bg)",
      }}
    >
      <style>{`
        .admin-menubar button {
          background: transparent;
          border: none;
          padding: 8px 10px;
          font-size: 13px;
          cursor: pointer;
          color: var(--win11-text-primary);
          opacity: 0.85;
        }
        .admin-menubar button.active {
          font-weight: 700;
          opacity: 1;
          border-bottom: 2px solid var(--win11-accent);
        }

        .admin-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 10px;
          height: calc(100% - 72px);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .admin-table thead th {
          text-align: left;
          font-weight: 700;
          padding: 8px 10px;
          border-bottom: 1px solid var(--win11-divider);
          background: rgba(255,255,255,0.03);
        }
        .admin-table tbody td {
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .admin-table tbody tr:hover {
          background: rgba(255,255,255,0.04);
        }

        .admin-panel {
          border: 1px solid var(--win11-divider);
          background: rgba(0,0,0,0.15);
          border-radius: 10px;
          padding: 10px;
        }

        .admin-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .admin-muted { opacity: 0.75; font-size: 12px; }
      `}</style>

      <div className="window" style={{ height: "100%", position: "relative" }}>
        <div className="titlebar">
          <span className="titlebar-title">Parfimerija O&apos;Sinel De Or - Administracija</span>
        </div>

        <div className="window-content" style={{ padding: 10, height: "calc(100vh - 160px)", overflowY: "auto" }}>
          <div className="admin-menubar" style={{ display: "flex", gap: 6, padding: "6px 10px" }}>
            <button
              className={activeTab === "korisnici" ? "active" : ""}
              onClick={() => setActiveTab("korisnici")}
            >
              Korisnici
            </button>
          </div>

          {activeTab === "korisnici" && (
            <>
              {/* SEARCH */}
              <div className="admin-panel" style={{ marginTop: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 220px auto", gap: 10 }}>
                  <div>
                    <label className="admin-muted">Username</label>
                    <input
                      type="text"
                      value={qUsername}
                      onChange={(e) => setQUsername(e.target.value)}
                      placeholder="npr. maja"
                    />
                  </div>

                  <div>
                    <label className="admin-muted">Email</label>
                    <input
                      type="email"
                      value={qEmail}
                      onChange={(e) => setQEmail(e.target.value)}
                      placeholder="npr. maja@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="admin-muted">Uloga</label>
                    <select value={qRole} onChange={(e) => setQRole(e.target.value)}>
                      <option value="">(bilo koja)</option>
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          <span>{r}</span>
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                    <button className="btn btn-accent" onClick={doSearch} disabled={isLoading || busy}>
                      Pretraži
                    </button>
                    <button className="btn btn-standard" onClick={clearSearch} disabled={isLoading || busy}>
                      Reset
                    </button>
                    <button className="btn btn-standard" onClick={loadAll} disabled={isLoading || busy}>
                      Osveži
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ marginTop: 10, padding: 10, border: "1px solid rgba(255,0,0,0.25)", borderRadius: 10 }}>
                    <strong style={{ color: "crimson" }}>Greška:</strong> {error}
                  </div>
                )}
              </div>

              <div className="admin-grid" style={{ marginTop: 10 }}>
                {/* TABLE */}
                <div className="admin-panel" style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px" }}>
                    <div style={{ fontWeight: 700 }}>Lista korisnika</div>
                    <div className="admin-muted">
                      {isLoading ? "Učitavanje..." : `${users.length} rezultat(a)`}
                    </div>
                  </div>

                  <div style={{ overflow: "auto" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Akcije</th>
                        </tr>
                      </thead>

                      <tbody>
                        {!isLoading && users.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: 12, opacity: 0.75 }}>
                              Nema korisnika za prikaz.
                            </td>
                          </tr>
                        )}

                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>
                              <div className="admin-actions">
                                <button className="btn btn-standard" onClick={() => startEdit(u)} disabled={busy}>
                                  Izmeni
                                </button>
                                <button className="btn btn-standard" onClick={() => handleDelete(u.id)} disabled={busy}>
                                  Obriši
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* FORM */}
                <div className="admin-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700 }}>
                      {formMode === "create" ? "Novi korisnik" : `Izmena korisnika #${form.id}`}
                    </div>

                    {formMode === "edit" && (
                      <button className="btn btn-ghost" onClick={startCreate} disabled={busy}>
                        Otkaži
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                    <div>
                      <label className="admin-muted">Username</label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                        placeholder="username"
                      />
                    </div>

                    <div>
                      <label className="admin-muted">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="email"
                      />
                    </div>

                    <div>
                      <label className="admin-muted">Uloga</label>
                      <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label className="admin-muted">Ime</label>
                        <input
                          type="text"
                          value={form.firstName ?? ""}
                          onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                          placeholder="ime"
                        />
                      </div>
                      <div>
                        <label className="admin-muted">Prezime</label>
                        <input
                          type="text"
                          value={form.lastName ?? ""}
                          onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                          placeholder="prezime"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="admin-muted">Profilna slika (base64)</label>
                      <textarea
                        value={form.profileImage ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, profileImage: e.target.value }))}
                        placeholder="data:image/png;base64,... (opciono)"
                      />
                    </div>

                    <button className="btn btn-accent" onClick={onSubmit} disabled={busy}>
                      {busy ? "Radim..." : formMode === "create" ? "Kreiraj" : "Sačuvaj"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: 10,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            border: "1px solid var(--win11-divider)",
            background: "rgba(0,0,0,0.15)",
            borderRadius: 10,
            fontSize: 12,
            color: "var(--win11-text-primary)",
          }}
        >
          <div style={{ opacity: 0.75 }}>
            Admin panel &nbsp;|&nbsp; Status: <strong>{isLoading ? "Učitavam..." : "Spremno"}</strong>
          </div>
          <div style={{ opacity: 0.75 }}>{new Date().toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;