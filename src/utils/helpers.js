export const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);

export const fmtCurrency = (n) => "Rp " + fmt(n);

export const genTxNumber = () => {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRX${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}${rand}`;
};

export const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

export const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};
