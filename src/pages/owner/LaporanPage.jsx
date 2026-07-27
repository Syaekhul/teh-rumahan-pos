import { useState, useEffect } from "react";
import { sb } from "../../config/supabase";
import { fmtCurrency } from "../../utils/helpers";
import { FaReceipt } from "react-icons/fa";
import React from "react";

export default function LaporanPage() {
  const [mode, setMode] = useState("harian");
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const load = async () => {
    setLoading(true);
    let from, to;
    if (mode === "harian") {
      from = new Date(selectedDate);
      from.setHours(0, 0, 0, 0);
      to = new Date(selectedDate);
      to.setHours(23, 59, 59, 999);
    } else {
      const [y, m] = selectedMonth.split("-").map(Number);
      from = new Date(y, m - 1, 1, 0, 0, 0, 0);
      to = new Date(y, m, 0, 23, 59, 59, 999);
    }

    const [{ data: txData }, { data: expData }] = await Promise.all([
      sb
        .from("transactions")
        .select("*, transaction_items(*)")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .eq("status", "completed")
        .order("created_at", { ascending: true }),
      sb
        .from("expenses")
        .select("*")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: true })
    ]);

    const transactions = txData || [];
    const expenses = expData || [];

    const totalPemasukan = transactions.reduce((s, t) => s + t.total, 0);
    const totalPengeluaran = expenses.reduce((s, e) => s + e.amount, 0);
    const labaBersih = totalPemasukan - totalPengeluaran;
    const jumlahTransaksi = transactions.length;
    const tunai = transactions
      .filter((t) => t.payment_method === "tunai")
      .reduce((s, t) => s + t.total, 0);
    const qris = transactions
      .filter((t) => t.payment_method === "qris")
      .reduce((s, t) => s + t.total, 0);

    let harian = [];
    if (mode === "bulanan") {
      const [y, m] = selectedMonth.split("-").map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dayFrom = new Date(y, m - 1, d, 0, 0, 0, 0);
        const dayTo = new Date(y, m - 1, d, 23, 59, 59, 999);
        const dayTx = transactions.filter((t) => {
          const td = new Date(t.created_at);
          return td >= dayFrom && td <= dayTo;
        });
        const dayExp = expenses.filter((e) => {
          const ed = new Date(e.created_at);
          return ed >= dayFrom && ed <= dayTo;
        });
        const pIn = dayTx.reduce((s, t) => s + t.total, 0);
        const pOut = dayExp.reduce((s, e) => s + e.amount, 0);
        if (pIn > 0 || pOut > 0) {
          harian.push({
            tanggal: d,
            pemasukan: pIn,
            pengeluaran: pOut,
            laba: pIn - pOut,
            jumlah: dayTx.length
          });
        }
      }
    }

    setData({
      totalPemasukan,
      totalPengeluaran,
      labaBersih,
      jumlahTransaksi,
      tunai,
      qris,
      harian,
      transactions,
      expenses,
      from,
      to
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [mode, selectedDate, selectedMonth]);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  const periodLabel =
    mode === "harian"
      ? new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        })
      : new Date(selectedMonth + "-01T00:00:00").toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric"
        });

  return (
    <div className="page-content" id="laporan-root">
      <div className="no-print">
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          Laporan
        </div>
        <div className="tabs" style={{ marginBottom: 12 }}>
          <button
            className={`tab-btn${mode === "harian" ? " active" : ""}`}
            onClick={() => setMode("harian")}
          >
            Harian
          </button>
          <button
            className={`tab-btn${mode === "bulanan" ? " active" : ""}`}
            onClick={() => setMode("bulanan")}
          >
            Bulanan
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            alignItems: "center"
          }}
        >
          {mode === "harian" ? (
            <input
              className="form-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ flex: 1 }}
            />
          ) : (
            <input
              className="form-input"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ flex: 1 }}
            />
          )}
          <button
            className="btn btn-primary"
            onClick={handlePrint}
            disabled={!data || loading}
          >
            <FaReceipt size={15} color="#fff" />
            PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : !data ? null : (
        <div id="laporan-content">
          <div
            style={{
              textAlign: "center",
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "2px solid var(--border)"
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>
              Es Teh Jumbo
            </div>
            <div
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}
            >
              Laporan {mode === "harian" ? "Harian" : "Bulanan"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              {periodLabel}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 10
              }}
            >
              Ringkasan
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                {
                  label: "Total Pemasukan",
                  value: data.totalPemasukan,
                  color: "var(--text-primary)",
                  bg: "var(--surface)"
                },
                {
                  label: "Total Pengeluaran",
                  value: data.totalPengeluaran,
                  color: "var(--red)",
                  bg: "var(--red-light)"
                },
                {
                  label: "Laba Bersih",
                  value: data.labaBersih,
                  color: data.labaBersih >= 0 ? "var(--green)" : "var(--red)",
                  bg:
                    data.labaBersih >= 0
                      ? "var(--green-light)"
                      : "var(--red-light)",
                  bold: true
                }
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    background: row.bg,
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: row.bold ? 700 : 500,
                      color: row.color
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: "DM Mono",
                      color: row.color
                    }}
                  >
                    {fmtCurrency(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-padded" style={{ marginBottom: 12 }}>
            <div className="section-title">Detail Pemasukan</div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid var(--border)"
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Jumlah Transaksi
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {data.jumlahTransaksi} transaksi
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid var(--border)"
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Tunai
              </span>
              <span
                style={{ fontSize: 13, fontWeight: 600, fontFamily: "DM Mono" }}
              >
                {fmtCurrency(data.tunai)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid var(--border)"
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                QRIS / Transfer
              </span>
              <span
                style={{ fontSize: 13, fontWeight: 600, fontFamily: "DM Mono" }}
              >
                {fmtCurrency(data.qris)}
              </span>
            </div>
            {data.jumlahTransaksi > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0"
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Rata-rata per Transaksi
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "DM Mono"
                  }}
                >
                  {fmtCurrency(
                    Math.round(data.totalPemasukan / data.jumlahTransaksi)
                  )}
                </span>
              </div>
            )}
          </div>

          {data.expenses.length > 0 && (
            <div className="card card-padded" style={{ marginBottom: 12 }}>
              <div className="section-title">Detail Pengeluaran</div>
              {(() => {
                const grouped = {};
                data.expenses.forEach((e) => {
                  if (!grouped[e.category])
                    grouped[e.category] = { total: 0, items: [] };
                  grouped[e.category].total += e.amount;
                  grouped[e.category].items.push(e);
                });
                return Object.entries(grouped).map(([cat, g], ci, arr) => (
                  <div
                    key={cat}
                    style={{
                      borderBottom:
                        ci < arr.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      paddingBottom: 8,
                      marginBottom: 8
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {cat}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "DM Mono",
                          color: "var(--red)"
                        }}
                      >
                        {fmtCurrency(g.total)}
                      </span>
                    </div>
                    {g.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          paddingLeft: 8
                        }}
                      >
                        <span
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          {item.name}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            fontFamily: "DM Mono"
                          }}
                        >
                          {fmtCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}

          {mode === "bulanan" && data.harian.length > 0 && (
            <div className="card card-padded" style={{ marginBottom: 12 }}>
              <div className="section-title">Rincian Per Hari</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr 1fr 1fr",
                  gap: "6px 10px",
                  alignItems: "center"
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-muted)"
                  }}
                >
                  Tgl
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textAlign: "right"
                  }}
                >
                  Masuk
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textAlign: "right"
                  }}
                >
                  Keluar
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textAlign: "right"
                  }}
                >
                  Laba
                </div>
                {data.harian.map((h) => (
                  <React.Fragment key={h.tanggal}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        borderTop: "1px solid var(--border)",
                        paddingTop: 5
                      }}
                    >
                      {h.tanggal}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: "DM Mono",
                        textAlign: "right",
                        borderTop: "1px solid var(--border)",
                        paddingTop: 5
                      }}
                    >
                      {fmtCurrency(h.pemasukan)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: "DM Mono",
                        textAlign: "right",
                        color: "var(--red)",
                        borderTop: "1px solid var(--border)",
                        paddingTop: 5
                      }}
                    >
                      {fmtCurrency(h.pengeluaran)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: "DM Mono",
                        textAlign: "right",
                        fontWeight: 700,
                        color: h.laba >= 0 ? "var(--green)" : "var(--red)",
                        borderTop: "1px solid var(--border)",
                        paddingTop: 5
                      }}
                    >
                      {fmtCurrency(h.laba)}
                    </div>
                  </React.Fragment>
                ))}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    borderTop: "2px solid var(--border)",
                    paddingTop: 6
                  }}
                >
                  Total
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: "DM Mono",
                    textAlign: "right",
                    fontWeight: 700,
                    borderTop: "2px solid var(--border)",
                    paddingTop: 6
                  }}
                >
                  {fmtCurrency(data.totalPemasukan)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: "DM Mono",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "var(--red)",
                    borderTop: "2px solid var(--border)",
                    paddingTop: 6
                  }}
                >
                  {fmtCurrency(data.totalPengeluaran)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: "DM Mono",
                    textAlign: "right",
                    fontWeight: 700,
                    color: data.labaBersih >= 0 ? "var(--green)" : "var(--red)",
                    borderTop: "2px solid var(--border)",
                    paddingTop: 6
                  }}
                >
                  {fmtCurrency(data.labaBersih)}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid var(--border)"
            }}
          >
            Dicetak pada{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })}{" "}
            {new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </div>
        </div>
      )}
    </div>
  );
}
