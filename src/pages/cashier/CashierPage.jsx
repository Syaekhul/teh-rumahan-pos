import { useState, useEffect } from "react";
import { sb } from "../../config/supabase";
import { fmtCurrency, fmt, genTxNumber } from "../../utils/helpers";
import { FiCheck, FiBox, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FaReceipt, FaWallet, FaQrcode } from "react-icons/fa";

export default function CashierPage({ user }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [strukSuccess, setStrukSuccess] = useState(false);
  const [payMethod, setPayMethod] = useState("tunai");
  const [amountPaid, setAmountPaid] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sb.from("products")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setProducts(data || []));
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex)
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const paid = parseInt(amountPaid.replace(/\D/g, "")) || 0;
  const change = paid - subtotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const paidNum = parseInt(String(amountPaid).replace(/\D/g, ""), 10) || 0;
    if (payMethod === "tunai" && paidNum < subtotal) return;

    setLoading(true);
    try {
      const txNum = genTxNumber();
      const { data: tx, error: txError } = await sb
        .from("transactions")
        .insert({
          transaction_number: txNum,
          cashier_id: user.id,
          cashier_name: user.profile?.name || user.email,
          payment_method: payMethod,
          subtotal: subtotal,
          total: subtotal,
          amount_paid: payMethod === "tunai" ? paidNum : subtotal,
          change_amount:
            payMethod === "tunai" ? Math.max(0, paidNum - subtotal) : 0,
          status: "completed"
        })
        .select()
        .single();

      if (txError) {
        alert("Gagal: " + (txError.message || txError.code));
        setLoading(false);
        return;
      }

      await sb.from("transaction_items").insert(
        cart.map((i) => ({
          transaction_id: tx.id,
          product_id: i.id,
          product_name: i.name,
          product_price: i.price,
          quantity: i.qty,
          subtotal: i.price * i.qty
        }))
      );

      const txData = {
        txNum,
        total: subtotal,
        change: payMethod === "tunai" ? Math.max(0, paidNum - subtotal) : 0,
        payMethod,
        amountPaid: paidNum,
        items: [...cart]
      };
      setSuccessData(txData);

      setCart([]);
      setShowPayment(false);
      setShowSuccess(true);
      setAmountPaid("");
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  };

  // --- Render Mode Sukses / Struk ---
  if (showSuccess && successData) {
    if (strukSuccess) {
      return (
        <div className="page" style={{ overflow: "auto" }}>
          <div
            style={{ padding: "24px 20px", maxWidth: 400, margin: "0 auto" }}
          >
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Es Teh Jumbo</div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginTop: 2
                }}
              >
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
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "DM Mono"
                }}
              >
                {successData.txNum}
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
              {successData.items?.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 6
                  }}
                >
                  <span>
                    {item.name} x{item.qty}
                  </span>
                  <span style={{ fontFamily: "DM Mono" }}>
                    {fmtCurrency(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 6
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                Metode Bayar
              </span>
              <span style={{ fontWeight: 600 }}>
                {successData.payMethod === "qris" ? "QRIS / Transfer" : "Tunai"}
              </span>
            </div>
            {successData.payMethod === "tunai" && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 4
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Uang Diterima
                  </span>
                  <span style={{ fontFamily: "DM Mono" }}>
                    {fmtCurrency(successData.amountPaid)}
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
                  <span style={{ color: "var(--text-secondary)" }}>
                    Kembalian
                  </span>
                  <span
                    style={{
                      fontFamily: "DM Mono",
                      color: "var(--green)",
                      fontWeight: 700
                    }}
                  >
                    {fmtCurrency(successData.change)}
                  </span>
                </div>
              </>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 18,
                fontWeight: 700,
                borderTop: "1px solid var(--border)",
                paddingTop: 10,
                marginTop: 8,
                marginBottom: 24
              }}
            >
              <span>Total</span>
              <span style={{ fontFamily: "DM Mono" }}>
                {fmtCurrency(successData.total)}
              </span>
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => {
                setShowSuccess(false);
                setStrukSuccess(false);
              }}
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="page" style={{ justifyContent: "center" }}>
        <div className="success-screen">
          <div className="success-icon">
            <FiCheck size={28} color="var(--green)" />
          </div>
          <div className="success-title">Transaksi Berhasil</div>
          <div className="success-sub">{successData.txNum}</div>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "16px",
              marginBottom: 24,
              textAlign: "left"
            }}
          >
            <div className="summary-row">
              <span className="summary-label">Total</span>
              <span className="summary-value">
                {fmtCurrency(successData.total)}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Metode</span>
              <span
                className="summary-value"
                style={{ textTransform: "capitalize" }}
              >
                {successData.payMethod === "qris" ? "QRIS / Transfer" : "Tunai"}
              </span>
            </div>
            {successData.payMethod === "tunai" && (
              <div className="summary-row total">
                <span className="summary-label">Kembalian</span>
                <span
                  className="summary-value"
                  style={{ color: "var(--green)" }}
                >
                  {fmtCurrency(successData.change)}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-secondary btn-full btn-lg"
              onClick={() => setStrukSuccess(true)}
            >
              <FaReceipt size={16} /> Struk
            </button>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => {
                setShowSuccess(false);
                setStrukSuccess(false);
              }}
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Utama (Grid Produk) ---
  return (
    <div className="page kasir-layout">
      <div className="product-grid">
        {products.map((p) => {
          const cartItem = cart.find((i) => i.id === p.id);
          return (
            <div
              key={p.id}
              className={`product-card${cartItem ? " in-cart" : ""}`}
              onClick={() => addToCart(p)}
            >
              {cartItem && (
                <div className="product-qty-badge">{cartItem.qty}</div>
              )}
              <div className="product-name">{p.name}</div>
              <div className="product-price">{fmtCurrency(p.price)}</div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div style={{ gridColumn: "1/-1" }} className="empty-state">
            <FiBox size={32} color="var(--text-muted)" />
            <p>Belum ada produk. Minta pemilik untuk menambahkan produk.</p>
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <div className="cart-panel">
        <div
          className="cart-toggle"
          onClick={() => totalItems > 0 && setCartOpen(!cartOpen)}
        >
          <div className="cart-toggle-left">
            <FaReceipt size={18} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Keranjang</span>
            {totalItems > 0 && (
              <span className="cart-count-pill">{totalItems}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {totalItems > 0 && (
              <span className="cart-total-preview">
                {fmtCurrency(subtotal)}
              </span>
            )}
            {totalItems > 0 &&
              (cartOpen ? (
                <FiChevronDown size={16} color="var(--text-muted)" />
              ) : (
                <FiChevronUp size={16} color="var(--text-muted)" />
              ))}
          </div>
        </div>

        {cartOpen && cart.length > 0 && (
          <div className="cart-body">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-controls">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.id, -1)}
                  >
                    −
                  </button>
                  <span className="qty-display">{item.qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.id, 1)}
                  >
                    +
                  </button>
                </div>
                <div className="cart-item-price">
                  {fmtCurrency(item.price * item.qty)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "8px 16px 12px" }}>
          <button
            className="btn btn-success btn-full btn-lg"
            disabled={cart.length === 0}
            onClick={() => {
              setShowPayment(true);
              setCartOpen(false);
            }}
          >
            <FaWallet size={18} color="#fff" />
            Bayar {cart.length > 0 ? fmtCurrency(subtotal) : ""}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowPayment(false)}
        >
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Pembayaran</div>
            <div className="form-group">
              <div className="form-label">Metode Pembayaran</div>
              <div className="payment-method-grid">
                <button
                  className={`payment-method-btn${payMethod === "tunai" ? " selected" : ""}`}
                  onClick={() => setPayMethod("tunai")}
                >
                  <div style={{ marginBottom: 4 }}>
                    <FaWallet size={20} />
                  </div>
                  Tunai
                </button>
                <button
                  className={`payment-method-btn${payMethod === "qris" ? " selected" : ""}`}
                  onClick={() => setPayMethod("qris")}
                >
                  <div style={{ marginBottom: 4 }}>
                    <FaQrcode size={20} />
                  </div>
                  QRIS / Transfer
                </button>
              </div>
            </div>
            {payMethod === "tunai" && (
              <div className="form-group">
                <label className="form-label">Uang Diterima</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  inputMode="numeric"
                  style={{
                    fontSize: 18,
                    fontFamily: "var(--mono)",
                    fontWeight: 700
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 8,
                    flexWrap: "wrap"
                  }}
                >
                  {[5000, 10000, 20000, 50000]
                    .filter((n) => n >= subtotal)
                    .slice(0, 4)
                    .concat(
                      [5000, 10000, 20000, 50000].filter((n) => n < subtotal)
                        .length > 0
                        ? [Math.ceil(subtotal / 1000) * 1000]
                        : []
                    )
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .sort((a, b) => a - b)
                    .slice(0, 4)
                    .map((nom) => (
                      <button
                        key={nom}
                        className="btn btn-secondary btn-sm"
                        onClick={() => setAmountPaid(String(nom))}
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        {fmt(nom)}
                      </button>
                    ))}
                </div>

                {paid > 0 && paid >= subtotal && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "10px 12px",
                      background: "var(--green-light)",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--green)",
                        fontWeight: 600
                      }}
                    >
                      Kembalian
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: "DM Mono",
                        color: "var(--green)"
                      }}
                    >
                      {fmtCurrency(change)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "var(--radius)",
                padding: "14px",
                marginBottom: 16
              }}
            >
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="summary-row"
                  style={{ padding: "4px 0" }}
                >
                  <span className="summary-label">
                    {item.name} x{item.qty}
                  </span>
                  <span className="summary-value">
                    {fmtCurrency(item.price * item.qty)}
                  </span>
                </div>
              ))}
              <div className="summary-row total">
                <span className="summary-label">Total</span>
                <span className="summary-value">{fmtCurrency(subtotal)}</span>
              </div>
            </div>

            <button
              className="btn btn-success btn-full btn-lg"
              onClick={handleCheckout}
              disabled={loading || (payMethod === "tunai" && paid < subtotal)}
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
                  <FiCheck size={18} color="#fff" />
                  Selesaikan Transaksi
                </>
              )}
            </button>
            <button
              className="btn btn-ghost btn-full mt-8"
              onClick={() => setShowPayment(false)}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
