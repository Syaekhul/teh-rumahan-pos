import { fmtCurrency, fmtDate, fmtTime } from "../utils/helpers";

export default function StrukModal({ tx, onClose }) {
  if (!tx) return null;
  const storeName = "Es Teh Jumbo";
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{storeName}</div>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
          >
            {fmtDate(tx.created_at)} {fmtTime(tx.created_at)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "DM Mono"
            }}
          >
            {tx.transaction_number}
          </div>
        </div>
        <div
          style={{
            borderTop: "1px dashed var(--border)",
            borderBottom: "1px dashed var(--border)",
            padding: "12px 0",
            marginBottom: 12
          }}
        >
          {tx.transaction_items?.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 6
              }}
            >
              <span>
                {item.product_name} x{item.quantity}
              </span>
              <span style={{ fontFamily: "DM Mono" }}>
                {fmtCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 14,
            marginBottom: 6
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>Metode</span>
          <span style={{ fontWeight: 600 }}>
            {tx.payment_method === "qris" ? "QRIS / Transfer" : "Tunai"}
          </span>
        </div>
        {tx.payment_method === "tunai" && tx.amount_paid > 0 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 4
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>Bayar</span>
              <span style={{ fontFamily: "DM Mono" }}>
                {fmtCurrency(tx.amount_paid)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 4
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>Kembali</span>
              <span style={{ fontFamily: "DM Mono" }}>
                {fmtCurrency(tx.change_amount)}
              </span>
            </div>
          </>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 16,
            fontWeight: 700,
            borderTop: "1px solid var(--border)",
            paddingTop: 10,
            marginTop: 6,
            marginBottom: 20
          }}
        >
          <span>Total</span>
          <span style={{ fontFamily: "DM Mono" }}>{fmtCurrency(tx.total)}</span>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-muted)",
            marginBottom: 20
          }}
        >
          Terima kasih sudah berbelanja!
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-full" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
