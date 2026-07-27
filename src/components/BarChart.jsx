export default function BarChart({ data, color = "var(--accent)" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3
          }}
        >
          <div
            style={{
              width: "100%",
              background: color,
              borderRadius: "3px 3px 0 0",
              height: Math.max((d.value / max) * 52, d.value > 0 ? 4 : 0),
              transition: "height 0.3s ease",
              opacity: d.today ? 1 : 0.4
            }}
          />
          <div
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              fontWeight: d.today ? 700 : 400
            }}
          >
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}
