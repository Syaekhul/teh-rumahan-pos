import { useState, useEffect } from "react";
import { sb } from "../../config/supabase";
import { fmtCurrency, fmtDate, fmtTime } from "../../utils/helpers";
import { FiX } from "react-icons/fi";
import { FaReceipt } from "react-icons/fa";
import StrukModal from "../../components/StrukModal";

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("hari");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [strukTarget, setStrukTarget] = useState(null);

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
      .from("transactions")
      .select("*, transaction_items(*)")
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleCancel = async (tx) => {
    setCancelTarget(null);
    await sb
      .from("transactions")
      .update({ status: "cancelled" })
      .eq("id", tx.id);
    load();
  };

  const activeTotal = transactions
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + t.total, 0);
  const activeCount = transactions.filter(
    (t) => t.status === "completed"
  ).length;

  return (
    <div className="page-content">
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        Riwayat Transaksi
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
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "14px",
            marginBottom: 12
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 2
            }}
          >
            {activeCount} transaksi selesai
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "DM Mono" }}>
            {fmtCurrency(activeTotal)}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="card card-padded">
          {transactions.length === 0 ? (
            <div className="empty-state">
              <FaReceipt size={28} color="var(--text-muted)" />
              <p>Tidak ada transaksi</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="tx-item"
                style={{ opacity: tx.status === "cancelled" ? 0.5 : 1 }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div className="tx-meta">{tx.cashier_name}</div>
                    {tx.status === "cancelled" && (
                      <span className="badge badge-red">Dibatalkan</span>
                    )}
                  </div>
                  <div className="tx-number">{tx.transaction_number}</div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 4,
                      flexWrap: "wrap"
                    }}
                  >
                    <span
                      className={`badge ${tx.payment_method === "tunai" ? "badge-amber" : "badge-blue"}`}
                    >
                      {tx.payment_method === "qris" ? "QRIS" : "Tunai"}
                    </span>
                    {tx.transaction_items?.map((i) => (
                      <span
                        key={i.id}
                        className="badge"
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--text-secondary)"
                        }}
                      >
                        {i.product_name} x{i.quantity}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                    flexShrink: 0,
                    marginLeft: 8
                  }}
                >
                  <div
                    className="tx-amount"
                    style={{
                      textDecoration:
                        tx.status === "cancelled" ? "line-through" : ""
                    }}
                  >
                    {fmtCurrency(tx.total)}
                  </div>
                  <div className="tx-time">
                    {fmtDate(tx.created_at)} {fmtTime(tx.created_at)}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setStrukTarget(tx)}
                      style={{ padding: "4px 8px" }}
                    >
                      <FaReceipt size={12} />
                    </button>
                    {tx.status === "completed" && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setCancelTarget(tx)}
                        style={{ padding: "4px 8px" }}
                      >
                        <FiX size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {cancelTarget && (
        <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Batalkan Transaksi?</div>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginBottom: 8
              }}
            >
              Transaksi <strong>{cancelTarget.transaction_number}</strong> akan
              ditandai sebagai dibatalkan.
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 20
              }}
            >
              Total: {fmtCurrency(cancelTarget.total)}
            </p>
            <button
              className="btn btn-danger btn-full btn-lg"
              onClick={() => handleCancel(cancelTarget)}
            >
              Ya, Batalkan
            </button>
            <button
              className="btn btn-ghost btn-full mt-8"
              onClick={() => setCancelTarget(null)}
            >
              Kembali
            </button>
          </div>
        </div>
      )}

      {strukTarget && (
        <StrukModal tx={strukTarget} onClose={() => setStrukTarget(null)} />
      )}
    </div>
  );
}
