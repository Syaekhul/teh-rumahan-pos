import { useState } from "react";
import {
  FiBarChart2,
  FiArrowDown,
  FiFileText,
  FiBox,
  FiUser
} from "react-icons/fi";
import DashboardPage from "./DashboardPage";
import PengeluaranPage from "../shared/PengeluaranPage";
import LaporanPage from "./LaporanPage";
import ProductsPage from "./ProductsPage";
import RiwayatPage from "./RiwayatPage";
import AkunPage from "./AkunPage";

export default function OwnerApp({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");

  const pages = {
    dashboard: <DashboardPage />,
    pengeluaran: <PengeluaranPage user={user} />,
    laporan: <LaporanPage />,
    riwayat: <RiwayatPage />,
    products: <ProductsPage />,
    akun: <AkunPage user={user} onLogout={onLogout} />
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-brand">
          POS Es Teh <span>· Owner</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {user.profile?.name}
        </div>
      </div>

      <div className="page" style={{ overflow: "hidden", flex: 1 }}>
        {pages[tab]}
      </div>

      <nav className="bottom-nav">
        {[
          {
            key: "dashboard",
            icon: <FiBarChart2 size={20} />,
            label: "Dashboard"
          },
          {
            key: "pengeluaran",
            icon: <FiArrowDown size={20} />,
            label: "Keluar"
          },
          { key: "laporan", icon: <FiFileText size={20} />, label: "Laporan" },
          { key: "products", icon: <FiBox size={20} />, label: "Produk" },
          { key: "akun", icon: <FiUser size={20} />, label: "Akun" }
        ].map((n) => (
          <button
            key={n.key}
            className={`nav-item${tab === n.key ? " active" : ""}`}
            onClick={() => setTab(n.key)}
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
