import { useState } from "react";
import { FiLogOut, FiMonitor, FiArrowDown } from "react-icons/fi";
import CashierPage from "./CashierPage";
import PengeluaranPage from "../shared/PengeluaranPage";

export default function CashierApp({ user, onLogout }) {
  const [tab, setTab] = useState("kasir");

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-brand">
          POS Es Teh <span>· Kasir</span>
        </div>
        <div className="topbar-right">
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {user.profile?.name}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            <FiLogOut size={16} />
          </button>
        </div>
      </div>

      <div className="page" style={{ overflow: "hidden", flex: 1 }}>
        {tab === "kasir" ? (
          <CashierPage user={user} />
        ) : (
          <PengeluaranPage user={user} />
        )}
      </div>

      <nav className="bottom-nav">
        {[
          { key: "kasir", icon: <FiMonitor size={20} />, label: "Kasir" },
          {
            key: "pengeluaran",
            icon: <FiArrowDown size={20} />,
            label: "Pengeluaran"
          }
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
