import { useState, useEffect } from "react";
import { sb } from "../../config/supabase";
import { fmtCurrency } from "../../utils/helpers";
import { FiPlus, FiEdit2, FiTrash2, FiBox } from "react-icons/fi";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Minuman",
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await sb.from("products").select("*").order("name");
    setProducts(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const openForm = (p = null) => {
    setEditing(p);
    setForm(
      p
        ? {
            name: p.name,
            price: String(p.price),
            category: p.category,
            is_active: p.is_active
          }
        : { name: "", price: "", category: "Minuman", is_active: true }
    );
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setLoading(true);
    const payload = {
      name: form.name,
      price: parseInt(form.price),
      category: form.category,
      is_active: form.is_active
    };
    if (editing) {
      await sb.from("products").update(payload).eq("id", editing.id);
    } else {
      await sb.from("products").insert(payload);
    }
    await load();
    setShowForm(false);
    setLoading(false);
  };

  const handleToggle = async (p) => {
    await sb
      .from("products")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus produk ini?")) return;
    await sb.from("products").delete().eq("id", id);
    load();
  };

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
        <div style={{ fontSize: 16, fontWeight: 700 }}>Produk</div>
        <button className="btn btn-primary btn-sm" onClick={() => openForm()}>
          <FiPlus size={14} />
          Tambah
        </button>
      </div>

      <div className="card card-padded">
        {products.map((p) => (
          <div key={p.id} className="product-list-item">
            <div className="product-list-info">
              <div
                className="product-list-name"
                style={{
                  color: p.is_active
                    ? "var(--text-primary)"
                    : "var(--text-muted)"
                }}
              >
                {p.name}
              </div>
              <div className="product-list-price">{fmtCurrency(p.price)}</div>
              <span
                className={`badge mt-8 ${p.is_active ? "badge-green" : "badge-amber"}`}
                style={{ marginTop: 4 }}
              >
                {p.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <div className="product-list-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleToggle(p)}
              >
                {p.is_active ? "Nonaktif" : "Aktif"}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => openForm(p)}
              >
                <FiEdit2 size={13} />
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(p.id)}
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="empty-state">
            <FiBox size={28} color="var(--text-muted)" />
            <p>Belum ada produk</p>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">
              {editing ? "Edit Produk" : "Tambah Produk"}
            </div>
            <div className="form-group">
              <label className="form-label">Nama Produk</label>
              <input
                className="form-input"
                placeholder="Es Teh Jumbo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Harga (Rp)</label>
              <input
                className="form-input"
                type="number"
                placeholder="5000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                inputMode="numeric"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option>Minuman</option>
                <option>Makanan</option>
                <option>Lainnya</option>
              </select>
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleSave}
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
                "Simpan"
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
    </div>
  );
}
