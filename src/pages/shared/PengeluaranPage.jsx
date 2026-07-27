import { useState, useEffect } from "react";
import { sb } from "../../config/supabase";
import { fmtCurrency, fmtTime } from "../../utils/helpers";
import { FiPlus, FiTrash2, FiArrowDown } from "react-icons/fi";

const EXPENSE_CATEGORIES = [
  "Es batu",
  "Cup / wadah",
  "Plastik",
  "Teh / bahan baku",
  "Lainnya"
];

export default function PengeluaranPage({ user }) {
  const isOwner = user.profile?.role === "owner";
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Es batu",
    amount: ""
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("hari");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const now = new Date();
    let from = new Date();
    if (filter === "hari") {
      from.setHours(0, 0, 0, 0);
    } else if (filter === "minggu") {
      from.setDate(now.getDate() - 7);
    } else {
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
    }

    const { data } = await sb
      .from("expenses")
      .select("*")
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: false });

    setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount) {
      setError("Nama dan nominal wajib diisi.");
      return;
    }
    const amount = parseInt(String(form.amount).replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) {
      setError("Nominal tidak valid.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: err } = await sb.from("expenses").insert({
      name: form.name.trim(),
      category: form.category,
      amount,
      noted_by: user.id,
      noted_by_name: user.profile?.name || user.email
    });

    if (err) {
      setError("Gagal menyimpan: " + err.message);
      setSaving(false);
      return;
    }

    setForm({ name: "", category: "Es batu", amount: "" });
    setShowForm(false);
    load();
    setSaving(false);
  };

  const handleDelete = async (exp) => {
    setDeleteTarget(null);
    await sb.from("expenses").delete().eq("id", exp.id);
    load();
  };

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0),
    count: expenses.filter((e) => e.category === cat).length
  })).filter((c) => c.count > 0);

  return (
    <div className="page-content">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>Pengeluaran</div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setShowForm(true);
            setError("");
          }}
        >
          <FiPlus size={13} />
          Catat
        </button>
      </div>

      <div className="tabs">
        {[
          ["hari", "Hari Ini"],
          ["minggu", "7 Hari"],
          ["bulan", "Bulan Ini"]
        ].map(([k, v]) => (
          <button
            key={k}
            className={`tab-btn${filter === k ? " active" : ""}`}
            onClick={() => setFilter(k)}
          >
            {v}
          </button>
        ))}
      </div>

      {!loading && (
        <div
          style={{
            background: "var(--red-light)",
            border: "1px solid #f5c6c2",
            borderRadius: "var(--radius)",
            padding: "14px",
            marginBottom: 12
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--red)",
              fontWeight: 600,
              marginBottom: 2
            }}
          >
            Total Pengeluaran
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "DM Mono",
              color: "var(--red)"
            }}
          >
            {fmtCurrency(totalExpense)}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--red)",
              opacity: 0.7,
              marginTop: 2
            }}
          >
            {expenses.length} item dicatat
          </div>
        </div>
      )}

      {!loading && byCategory.length > 0 && (
        <div className="card card-padded" style={{ marginBottom: 12 }}>
          <div className="section-title">Per Kategori</div>
          {byCategory.map((c, i, arr) => (
            <div
              key={c.cat}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom:
                  i === arr.length - 1 ? "none" : "1px solid var(--border)"
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.cat}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {c.count}x
                </div>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "DM Mono",
                  color: "var(--red)"
                }}
              >
                {fmtCurrency(c.total)}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="card card-padded">
          <div className="section-title">Rincian</div>
          {expenses.length === 0 ? (
            <div className="empty-state" style={{ padding: "20px 0" }}>
              <FiArrowDown size={28} color="var(--text-muted)" />
              <p>Belum ada pengeluaran dicatat</p>
            </div>
          ) : (
            expenses.map((exp) => (
              <div key={exp.id} className="tx-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {exp.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 3,
                      alignItems: "center"
                    }}
                  >
                    <span className="badge badge-red" style={{ fontSize: 10 }}>
                      {exp.category}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {exp.noted_by_name} · {fmtTime(exp.created_at)}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      fontFamily: "DM Mono",
                      fontWeight: 700,
                      color: "var(--red)",
                      fontSize: 14
                    }}
                  >
                    {fmtCurrency(exp.amount)}
                  </div>
                  {isOwner && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: "4px 8px" }}
                      onClick={() => setDeleteTarget(exp)}
                    >
                      <FiTrash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Catat Pengeluaran</div>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Keterangan</label>
              <input
                className="form-input"
                placeholder="cth: Es batu 2 kantong"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nominal (Rp)</label>
              <input
                className="form-input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={{ fontSize: 20, fontFamily: "DM Mono", fontWeight: 700 }}
              />
            </div>
            <button
              className="btn btn-danger btn-full btn-lg"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
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
                  <FiArrowDown size={16} color="#fff" />
                  Simpan Pengeluaran
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
            <div className="modal-title">Hapus Pengeluaran?</div>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginBottom: 6
              }}
            >
              <strong>{deleteTarget.name}</strong>
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "DM Mono",
                color: "var(--red)",
                marginBottom: 20
              }}
            >
              {fmtCurrency(deleteTarget.amount)}
            </p>
            <button
              className="btn btn-danger btn-full btn-lg"
              onClick={() => handleDelete(deleteTarget)}
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
