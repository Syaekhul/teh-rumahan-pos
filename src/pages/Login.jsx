import { useState } from "react";
import { sb } from "../config/supabase";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { LuCupSoda } from "react-icons/lu";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // State baru untuk menangani OTP
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 1. Fungsi Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Jika error karena email belum diverifikasi, tampilkan form OTP
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setShowOTP(true);
        setSuccessMsg(
          "Email belum diverifikasi. Kami telah mengirimkan kode OTP ke email Anda."
        );
      } else {
        setError("Email atau password salah.");
      }
      setLoading(false);
      return;
    }

    // Jika login sukses (sudah terverifikasi)
    const { data: profile } = await sb
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    onLogin({ ...data.user, profile });
    setLoading(false);
  };

  // 2. Fungsi Handle Verifikasi OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await sb.auth.verifyOtp({
      email: email,
      token: otp,
      type: "signup" // Tipe verifikasi untuk akun baru
    });

    if (error) {
      setError("Kode OTP salah atau sudah kadaluarsa.");
      setLoading(false);
      return;
    }

    // Jika OTP benar, Supabase otomatis membuat sesi (session) login
    if (data.session) {
      const { data: profile } = await sb
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      onLogin({ ...data.user, profile });
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-logo">
        <LuCupSoda size={26} color="#fff" />
      </div>
      <div className="login-title">POS Es Teh</div>
      <div className="login-sub">
        {showOTP ? "Verifikasi Akun Kasir" : "Masuk untuk melanjutkan"}
      </div>

      <div className="card card-padded login-card">
        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {!showOTP ? (
          // --- TAMPILAN FORM LOGIN BIASA ---
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="form-input"
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex"
                  }}
                >
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              type="submit"
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
                "Masuk"
              )}
            </button>
          </form>
        ) : (
          // --- TAMPILAN FORM VERIFIKASI OTP ---
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Kode Verifikasi (6 Digit)</label>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="XXXXXX"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                style={{
                  fontFamily: "DM Mono",
                  fontSize: 20,
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontWeight: 700
                }}
              />
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 10,
                  textAlign: "center"
                }}
              >
                Cek kotak masuk atau folder spam di email{" "}
                <strong>{email}</strong>.
              </p>
            </div>
            <button
              className="btn btn-success btn-full btn-lg"
              type="submit"
              disabled={loading || otp.length < 6}
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
                "Verifikasi & Masuk"
              )}
            </button>
            <button
              className="btn btn-ghost btn-full mt-8"
              type="button"
              onClick={() => {
                setShowOTP(false);
                setError("");
                setSuccessMsg("");
              }}
              disabled={loading}
            >
              Kembali ke Login
            </button>
          </form>
        )}
      </div>

      {!showOTP && (
        <p
          style={{
            marginTop: 20,
            fontSize: 13,
            color: "var(--text-muted)",
            textAlign: "center"
          }}
        >
          Belum punya akun? Hubungi pemilik toko.
        </p>
      )}
    </div>
  );
}
