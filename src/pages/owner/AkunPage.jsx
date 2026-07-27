import { useState, useEffect } from "react";
import { sb } from "../../config/supabase";
import { FiCheck, FiPlus, FiTrash2, FiUsers, FiLogOut } from "react-icons/fi";

export default function AkunPage({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadUsers = async () => {
    const { data } = await sb.from("profiles").select("*").order("created_at");
    setUsers(data || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddKasir = async () => {
    if (!form.name || !form.email || !form.password) {
      setError("Semua field wajib diisi.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data: signUpData, error: signUpError } = await sb.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name } }
      });
      if (signUpError) throw signUpError;
      if (!signUpData?.user) throw new Error("Gagal membuat akun.");

      const { error: profileError } = await sb.from("profiles").insert({
        id: signUpData.user.id,
        name: form.name,
        role: "kasir"
      });
      if (profileError) throw profileError;

      setSuccess(
        `Akun kasir "${form.name}" berhasil dibuat. Silahkan login dengan email dan password yang telah Anda buat untuk verifikasi.`
      );
      setForm({ name: "", email: "", password: "" });
      setShowForm(false);
      loadUsers();
    } catch (e) {
      setError(e.message || "Gagal membuat akun kasir.");
    }
    setLoading(false);
  };

  const handleDeleteKasir = async (u) => {
    setDeleteTarget(null);
    const { error } = await sb.from("profiles").delete().eq("id", u.id);
    if (error) {
      setError("Gagal menghapus: " + (error.message || error.code));
    } else {
      setSuccess(`Akun "${u.name}" berhasil dihapus.`);
    }
    loadUsers();
  };

  return (
    <div className="page-content">
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        Akun & Pengaturan
      </div>

      <div className="card card-padded" style={{ marginBottom: 12 }}>
        <div
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}
        >
          Login sebagai
        </div>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          {user.profile?.name || "Owner"}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {user.email}
        </div>
        <span className="badge badge-green" style={{ marginTop: 8 }}>
          Owner
        </span>
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>
          <FiCheck size={14} /> {success}
        </div>
      )}

      <div className="card card-padded" style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12
          }}
        >
          <div className="section-title" style={{ marginBottom: 0 }}>
            Daftar Pengguna
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
          >
            <FiPlus size={13} />
            Tambah Kasir
          </button>
        </div>
        {users.map((u) => (
          <div key={u.id} className="product-list-item">
            <div className="product-list-info">
              <div className="product-list-name">{u.name}</div>
              <span
                className={`badge ${u.role === "owner" ? "badge-green" : "badge-blue"}`}
                style={{ marginTop: 4, display: "inline-flex" }}
              >
                {u.role === "owner" ? "Owner" : "kasir"}
              </span>
            </div>
            {u.role === "kasir" && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setDeleteTarget(u)}
              >
                <FiTrash2 size={13} />
              </button>
            )}
          </div>
        ))}
        {users.length === 0 && (
          <div className="empty-state" style={{ padding: "16px 0" }}>
            <p>Belum ada pengguna</p>
          </div>
        )}
      </div>

      <div className="card card-padded">
        <button className="btn btn-danger btn-full" onClick={onLogout}>
          <FiLogOut size={16} />
          Keluar
        </button>
      </div>

      {showForm && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Tambah Akun Kasir</div>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Nama Kasir</label>
              <input
                className="form-input"
                placeholder="Nama lengkap"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="email@kasir.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleAddKasir}
              disabled={loading}
            >
              {loading ? (
                <div
                  className="spinner"
                  style={{
                    width: 16,
                    height: 16,
                    borderColor: "rgba(255,255,255,0.3)",
                    borderTopColor: "#fff"
                  }}
                />
              ) : (
                <>
                  <FiUsers size={16} color="#fff" />
                  Buat Akun Kasir
                </>
              )}
            </button>
            <button
              className="btn btn-ghost btn-full mt-8"
              onClick={() => setShowForm(false)}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Hapus Akun Kasir?</div>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginBottom: 20
              }}
            >
              Akun <strong>{deleteTarget.name}</strong> akan dihapus dan tidak
              bisa login lagi.
            </p>
            <button
              className="btn btn-danger btn-full btn-lg"
              onClick={() => handleDeleteKasir(deleteTarget)}
            >
              Ya, Hapus
            </button>
            <button
              className="btn btn-ghost btn-full mt-8"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
