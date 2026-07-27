import { useState, useEffect } from "react";
import { sb } from "./config/supabase";
import Login from "./pages/Login";
import OwnerApp from "./pages/owner/OwnerApp";
import CashierApp from "./pages/cashier/CashierApp";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek session saat pertama kali dimuat
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await sb
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setUser({ ...session.user, profile });
      }
      setLoading(false);
    });

    // Listener untuk perubahan session (misalnya login/logout)
    const { data: listener } = sb.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = (u) => setUser(u);

  const handleLogout = async () => {
    await sb.auth.signOut();
    setUser(null);
  };

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <p>Memuat aplikasi...</p>
      </div>
    );

  // Jika user belum login, tampilkan halaman login
  if (!user) return <Login onLogin={handleLogin} />;

  // Jika user sudah login, tampilkan halaman sesuai role
  if (user.profile.role === "owner") {
    return <OwnerApp user={user} onLogout={handleLogout} />;
  } else if (user.profile.role === "kasir") {
    return <CashierApp user={user} onLogout={handleLogout} />;
  } else {
    return (
      <div>
        <p>Role tidak dikenali.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }
}

export default App;
