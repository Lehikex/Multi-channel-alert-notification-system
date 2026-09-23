import { useState } from "react";

type Status = "Active" | "Degraded" | "Pending auth";
type Page = "Overview" | "Users" | "Sources" | "Delivery";

const sources = [
  { name: "USGS Earthquakes", type: "REST poll", category: "Disaster", status: "Active" as Status, events: "1,248", latency: "1.8s", updated: "2 min ago" },
  { name: "GDELT Global News", type: "GDELT", category: "News", status: "Active" as Status, events: "42,891", latency: "4.2s", updated: "4 min ago" },
  { name: "Polygon Market Data", type: "WebSocket", category: "Market", status: "Degraded" as Status, events: "8,420", latency: "12.7s", updated: "8 min ago" },
  { name: "NWS Alerts", type: "Webhook", category: "Disaster", status: "Pending auth" as Status, events: "—", latency: "—", updated: "Never" }
];

const users = [
  { initials: "AM", name: "Alex Morgan", email: "alex.morgan@acme.io", rules: 8, channels: "Email · Slack", state: "Active" },
  { initials: "JD", name: "Jordan Davis", email: "jordan.davis@acme.io", rules: 4, channels: "Email", state: "Active" },
  { initials: "SK", name: "Samir Khan", email: "samir.khan@acme.io", rules: 12, channels: "Slack", state: "Active" },
  { initials: "LC", name: "Laura Chen", email: "laura.chen@acme.io", rules: 0, channels: "Email", state: "Disabled" }
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    radio: "M5 8.5a10 10 0 0 0 0 7M2 5a15 15 0 0 0 0 14M19 8.5a10 10 0 0 1 0 7M22 5a15 15 0 0 1 0 14M12 12h.01",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4Z",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 11a1.7 1.7 0 0 0-.34-1.88L9 9.06l1.42-1.42.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 13.4 6.5V6h2v.5a1.7 1.7 0 0 0 1.03 1.54 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 11a1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z"
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Badge({ status }: { status: string }) {
  return <span className={`badge ${status.toLowerCase().replace(" ", "-")}`}><span />{status}</span>;
}

function App() {
  const [page, setPage] = useState<Page>("Overview");
  const [toast, setToast] = useState("");
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">✦</div><div><strong>world<span>alerts</span></strong><small>ADMIN CONSOLE</small></div></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {(["Overview", "Users", "Sources", "Delivery"] as Page[]).map((item) => (
            <button className={page === item ? "nav-item active" : "nav-item"} onClick={() => setPage(item)} key={item}>
              <Icon name={item === "Overview" ? "grid" : item === "Users" ? "users" : item === "Sources" ? "radio" : "send"} />{item}
              {item === "Sources" && <b className="nav-count">4</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Icon name="settings" />Settings</button>
          <div className="profile"><div className="avatar">JM</div><div><strong>Jamie Miller</strong><small>Administrator</small></div><span>⌄</span></div>
        </div>
      </aside>
      <main className="content">
        <header className="topbar"><div><span className="eyebrow">CONTROL CENTER</span><h1>{page}</h1></div><div className="top-actions"><span className="live"><i />All systems operational</span><button className="icon-button">⌕</button><button className="icon-button">?</button></div></header>
        {page === "Overview" ? <Overview onAction={notify} /> : page === "Sources" ? <Sources onAction={notify} /> : page === "Users" ? <Users onAction={notify} /> : <Delivery />}
      </main>
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function Overview({ onAction }: { onAction: (message: string) => void }) {
  return <div className="page-body">
    <div className="welcome"><div><h2>Good morning, Jamie <span>✦</span></h2><p>Here’s what’s happening across your alert network.</p></div><button className="primary" onClick={() => onAction("Source setup opened")}>+ Add source</button></div>
    <section className="metric-grid">
      <Metric label="Active users" value="1,284" change="+12.4%" detail="vs. last month" accent="blue" />
      <Metric label="Events processed" value="52,559" change="+8.7%" detail="last 24 hours" accent="purple" />
      <Metric label="Notifications sent" value="18,429" change="+21.3%" detail="last 24 hours" accent="orange" />
      <Metric label="Delivery rate" value="99.8%" change="+0.2%" detail="vs. last week" accent="green" />
    </section>
    <div className="split-grid">
      <section className="card chart-card"><div className="card-head"><div><h3>Event volume</h3><p>Incoming events across all sources</p></div><select><option>Last 24 hours</option><option>Last 7 days</option></select></div><div className="chart"><div className="chart-y"><span>4k</span><span>3k</span><span>2k</span><span>1k</span><span>0</span></div><div className="chart-area"><div className="grid-lines" /><svg viewBox="0 0 600 190" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6d5dfc" stopOpacity=".28" /><stop offset="1" stopColor="#6d5dfc" stopOpacity="0" /></linearGradient></defs><path d="M0 165 C35 160,35 125,70 135 S110 155,140 120 S180 140,210 105 S245 82,275 110 S310 80,340 92 S370 35,405 70 S445 85,470 50 S510 70,535 35 S575 44,600 16 V190 H0Z" fill="url(#fill)" /><path d="M0 165 C35 160,35 125,70 135 S110 155,140 120 S180 140,210 105 S245 82,275 110 S310 80,340 92 S370 35,405 70 S445 85,470 50 S510 70,535 35 S575 44,600 16" fill="none" stroke="#6d5dfc" strokeWidth="3" /></svg><div className="chart-x"><span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>Now</span></div></div></div></section>
      <section className="card"><div className="card-head"><div><h3>Source health</h3><p>Real-time connection status</p></div><button className="text-button" onClick={() => onAction("Showing all sources")}>View all →</button></div><div className="health-list">{sources.slice(0, 3).map((source) => <div className="health-row" key={source.name}><div className={`source-icon ${source.category.toLowerCase()}`}>{source.category === "Market" ? "↗" : source.category === "News" ? "N" : "◒"}</div><div className="health-name"><strong>{source.name}</strong><small>{source.type}</small></div><Badge status={source.status} /></div>)}</div></section>
    </div>
    <div className="split-grid bottom-grid"><section className="card"><div className="card-head"><div><h3>Recent activity</h3><p>Latest changes in your workspace</p></div><button className="text-button">View log →</button></div><div className="activity"><Activity icon="↗" text="Polygon Market Data recovered" time="8 minutes ago" /><Activity icon="+" text="Alex Morgan created a new rule" time="24 minutes ago" /><Activity icon="✓" text="Slack delivery verified" time="1 hour ago" /></div></section><section className="card delivery-card"><div className="card-head"><div><h3>Delivery performance</h3><p>Success rate by channel</p></div><button className="text-button" onClick={() => onAction("Delivery report opened")}>Details →</button></div><div className="delivery-row"><span className="channel-dot email" />Email <b>99.9%</b><div className="progress"><i style={{ width: "99.9%" }} /></div></div><div className="delivery-row"><span className="channel-dot slack" />Slack <b>99.6%</b><div className="progress"><i style={{ width: "99.6%" }} /></div></div></section></div>
  </div>;
}

function Metric({ label, value, change, detail, accent }: { label: string; value: string; change: string; detail: string; accent: string }) {
  return <div className="metric card"><div className={`metric-icon ${accent}`}>{accent === "blue" ? "♙" : accent === "purple" ? "◈" : accent === "orange" ? "➤" : "✓"}</div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><div><span className="positive">{change}</span><span className="metric-detail">{detail}</span></div></div>;
}

function Activity({ icon, text, time }: { icon: string; text: string; time: string }) { return <div className="activity-row"><span className="activity-icon">{icon}</span><span><strong>{text}</strong><small>{time}</small></span></div>; }

function Sources({ onAction }: { onAction: (message: string) => void }) {
  return <div className="page-body"><div className="page-toolbar"><div><p className="result-count">4 sources configured</p></div><button className="primary" onClick={() => onAction("Source setup opened")}>+ Add source</button></div><section className="card table-card"><div className="table-filters"><div className="search">⌕ <input placeholder="Search sources..." /></div><select><option>All categories</option><option>News</option><option>Market</option><option>Disaster</option></select><select><option>All statuses</option><option>Active</option><option>Degraded</option></select></div><table><thead><tr><th>Source</th><th>Category</th><th>Status</th><th>Events (24h)</th><th>Latency</th><th>Last updated</th><th /></tr></thead><tbody>{sources.map((source) => <tr key={source.name}><td><div className="table-source"><div className={`source-icon ${source.category.toLowerCase()}`}>{source.category[0]}</div><span><strong>{source.name}</strong><small>{source.type}</small></span></div></td><td>{source.category}</td><td><Badge status={source.status} /></td><td>{source.events}</td><td>{source.latency}</td><td>{source.updated}</td><td><button className="dots" onClick={() => onAction(`${source.name} menu opened`)}>•••</button></td></tr>)}</tbody></table></section></div>;
}

function Users({ onAction }: { onAction: (message: string) => void }) {
  return <div className="page-body"><div className="page-toolbar"><div><p className="result-count">1,284 total users · 1,281 active</p></div><button className="secondary" onClick={() => onAction("Invite flow opened")}>Invite user</button></div><section className="card table-card"><div className="table-filters"><div className="search">⌕ <input placeholder="Search users..." /></div><select><option>All users</option><option>Active</option><option>Disabled</option></select></div><table><thead><tr><th>User</th><th>Active rules</th><th>Channels</th><th>Status</th><th>Last active</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.email}><td><div className="table-source"><div className="avatar small">{user.initials}</div><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td><td>{user.rules}</td><td>{user.channels}</td><td><Badge status={user.state} /></td><td>Today, 9:42 AM</td><td><button className="dots" onClick={() => onAction(`${user.name} details opened`)}>•••</button></td></tr>)}</tbody></table></section></div>;
}

function Delivery() {
  return <div className="page-body"><div className="welcome"><div><h2>Delivery performance</h2><p>Monitor notification delivery across every channel.</p></div></div><section className="metric-grid"><Metric label="Sent today" value="18,429" change="+21.3%" detail="vs. yesterday" accent="orange" /><Metric label="Successful" value="18,392" change="99.8%" detail="delivery rate" accent="green" /><Metric label="Retrying" value="24" change="0.1%" detail="of all deliveries" accent="purple" /><Metric label="Failed" value="13" change="0.07%" detail="of all deliveries" accent="blue" /></section><section className="card empty-delivery"><div className="delivery-graphic">✓</div><h3>All channels are healthy</h3><p>There are no delivery incidents requiring attention.</p></section></div>;
}

export default App;
