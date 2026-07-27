import { useState, useEffect, useCallback } from "react";
import { sb } from "../../config/supabase";
import { fmtCurrency, fmtTime } from "../../utils/helpers";
import { FiRefreshCw } from "react-icons/fi";
import { FaReceipt } from "react-icons/fa";
import BarChart from "../../components/BarChart";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    count: 0,
    tunai: 0,
    qris: 0,
    totalExpense: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayTx } = await sb
      .from("transactions")
      .select("*, transaction_items(*)")
      .gte("created_at", today.toISOString())
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (todayTx) {
      const total = todayTx.reduce((s, t) => s + t.total, 0);
      const tunai = todayTx
        .filter((t) => t.payment_method === "tunai")
        .reduce((s, t) => s + t.total, 0);
      const qris = todayTx
        .filter((t) => t.payment_method === "qris")
        .reduce((s, t) => s + t.total, 0);

      const { data: todayExp } = await sb
        .from("expenses")
        .select("amount")
        .gte("created_at", today.toISOString());
      const totalExpense = (todayExp || []).reduce((s, e) => s + e.amount, 0);

      setStats({ total, count: todayTx.length, tunai, qris, totalExpense });
      setTransactions(todayTx);

      const prodMap = {};
      todayTx.forEach((tx) => {
        (tx.transaction_items || []).forEach((item) => {
          if (!prodMap[item.product_name])
            prodMap[item.product_name] = {
              name: item.product_name,
              qty: 0,
              total: 0
            };
          prodMap[item.product_name].qty += item.quantity;
          prodMap[item.product_name].total += item.subtotal;
        });
      });
      setTopProducts(
        Object.values(prodMap)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5)
      );
    }

    const days = [];
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      days.push({ date: d, next, label: dayNames[d.getDay()], today: i === 0 });
    }
    const weekFrom = days[0].date;
    const { data: weekTx } = await sb
      .from("transactions")
      .select("total, created_at")
      .gte("created_at", weekFrom.toISOString())
      .eq("status", "completed");

    const weekChart = days.map((d) => {
      const dayTotal = (weekTx || [])
        .filter((t) => {
          const td = new Date(t.created_at);
          return td >= d.date && td < d.next;
        })
        .reduce((s, t) => s + t.total, 0);
      return { label: d.label, value: dayTotal, today: d.today };
    });
    setWeekData(weekChart);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Hari ini
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long"
            })}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <FiRefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div
              className="stat-card"
              style={{
                gridColumn: "1/-1",
                background: "var(--accent)",
                border: "none"
              }}
            >
              <div
                className="stat-label"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Total Pendapatan Hari Ini
              </div>
              <div
                className="stat-value"
                style={{ color: "#fff", fontSize: 24 }}
              >
                {fmtCurrency(stats.total)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transaksi</div>
              <div className="stat-value">{stats.count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Rata-rata</div>
              <div className="stat-value large">
                {stats.count > 0
                  ? fmtCurrency(Math.round(stats.total / stats.count))
                  : "Rp 0"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tunai</div>
              <div className="stat-value large">{fmtCurrency(stats.tunai)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">QRIS / Transfer</div>
              <div className="stat-value large">{fmtCurrency(stats.qris)}</div>
            </div>
            <div
              className="stat-card"
              style={{
                background: "var(--red-light)",
                border: "1px solid #f5c6c2"
              }}
            >
              <div className="stat-label" style={{ color: "var(--red)" }}>
                Pengeluaran
              </div>
              <div className="stat-value large" style={{ color: "var(--red)" }}>
                {fmtCurrency(stats.totalExpense)}
              </div>
            </div>
            <div
              className="stat-card"
              style={{
                background: "var(--green-light)",
                border: "1px solid #b7dfcc",
                gridColumn: "1/-1"
              }}
            >
              <div className="stat-label" style={{ color: "var(--green)" }}>
                Laba Bersih Hari Ini
              </div>
              <div
                className="stat-value"
                style={{ color: "var(--green)", fontSize: 22 }}
              >
                {fmtCurrency(Math.max(0, stats.total - stats.totalExpense))}
              </div>
            </div>
          </div>

          {weekData.length > 0 && (
            <div className="card card-padded mt-16">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12
                }}
              >
                <div className="section-title" style={{ marginBottom: 0 }}>
                  Pendapatan 7 Hari
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {fmtCurrency(weekData.reduce((s, d) => s + d.value, 0))}
                </div>
              </div>
              <BarChart data={weekData} />
            </div>
          )}

          {topProducts.length > 0 && (
            <div className="card card-padded mt-12">
              <div className="section-title">Terlaris Hari Ini</div>
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0].qty;
                return (
                  <div
                    key={i}
                    style={{
                      marginBottom: i < topProducts.length - 1 ? 10 : 0
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {p.name}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: "DM Mono",
                          color: "var(--text-secondary)"
                        }}
                      >
                        {p.qty} porsi
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: "var(--surface-2)",
                        borderRadius: 3,
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: "var(--accent)",
                          borderRadius: 3,
                          width: `${(p.qty / maxQty) * 100}%`,
                          transition: "width 0.4s ease"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card card-padded mt-12">
            <div className="section-title">Transaksi Hari Ini</div>
            {transactions.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <FaReceipt size={28} color="var(--text-muted)" />
                <p>Belum ada transaksi hari ini</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="tx-item">
                  <div>
                    <div className="tx-meta">{tx.cashier_name}</div>
                    <div className="tx-number">{tx.transaction_number}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span
                        className={`badge ${tx.payment_method === "tunai" ? "badge-amber" : "badge-blue"}`}
                      >
                        {tx.payment_method === "qris" ? "QRIS" : "Tunai"}
                      </span>
                      <span className="badge badge-green">
                        {tx.transaction_items?.length || 0} item
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="tx-amount">{fmtCurrency(tx.total)}</div>
                    <div className="tx-time">{fmtTime(tx.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
