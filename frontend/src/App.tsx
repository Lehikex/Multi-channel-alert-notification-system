import { useState, type FormEvent } from "react";

type Status = "Active" | "Degraded" | "Pending auth";
type Page = "Overview" | "Users" | "Sources" | "Delivery" | "Settings";
type SourceCategory = "News" | "Market" | "Disaster";
type SourceDraft = { name: string; category: SourceCategory; type: string; endpoint: string; supportsFiltering: boolean };
type Source = SourceDraft & { id: number; status: Status; events: string; latency: string; updated: string };

const initialSources: Source[] = [
  { id: 1, name: "USGS Earthquakes", type: "REST poll", category: "Disaster", status: "Active", events: "1,248", latency: "1.8s", updated: "2 min ago", endpoint: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson", supportsFiltering: false },
  { id: 2, name: "GDELT Global News", type: "GDELT", category: "News", status: "Active", events: "42,891", latency: "4.2s", updated: "4 min ago", endpoint: "https://api.gdeltproject.org/api/v2/doc/doc", supportsFiltering: true },
  { id: 3, name: "Polygon Market Data", type: "WebSocket", category: "Market", status: "Degraded", events: "8,420", latency: "12.7s", updated: "8 min ago", endpoint: "wss://socket.polygon.io/stocks", supportsFiltering: true },
  { id: 4, name: "NWS Alerts", type: "Webhook", category: "Disaster", status: "Pending auth", events: "—", latency: "—", updated: "Never", endpoint: "https://api.weather.gov/alerts", supportsFiltering: false }
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
  const [sourceList, setSourceList] = useState<Source[]>(initialSources);
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
              {item === "Sources" && <b className="nav-count">{sourceList.length}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className={page === "Settings" ? "nav-item active" : "nav-item"} onClick={() => setPage("Settings")}><Icon name="settings" />Settings</button>
          <div className="profile"><div className="avatar">JM</div><div><strong>Jamie Miller</strong><small>Administrator</small></div><span>⌄</span></div>
        </div>
      </aside>
      <main className="content">
        <header className="topbar"><div><span className="eyebrow">CONTROL CENTER</span><h1>{page}</h1></div><div className="top-actions"><span className="live"><i />All systems operational</span><button className="icon-button">⌕</button><button className="icon-button">?</button></div></header>
        {page === "Overview" ? <Overview onAction={notify} sources={sourceList} /> : page === "Sources" ? <Sources sources={sourceList} setSources={setSourceList} onAction={notify} /> : page === "Users" ? <Users onAction={notify} /> : page === "Delivery" ? <Delivery /> : <Settings onAction={notify} />}
      </main>
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function Overview({ onAction, sources }: { onAction: (message: string) => void; sources: Source[] }) {
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

function Sources({ sources, setSources, onAction }: { sources: Source[]; setSources: (sources: Source[]) => void; onAction: (message: string) => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("All statuses");
  const [editing, setEditing] = useState<Source | null>(null);
  const [viewing, setViewing] = useState<Source | null>(null);
  const visibleSources = sources.filter((source) =>
    `${source.name} ${source.type}`.toLowerCase().includes(search.toLowerCase()) &&
    (category === "All categories" || source.category === category) &&
    (status === "All statuses" || source.status === status)
  );
  const saveSource = (draft: SourceDraft, id?: number) => {
    if (id) {
      setSources(sources.map((source) => source.id === id ? { ...source, ...draft, updated: "Just now" } : source));
      onAction(`${draft.name} updated`);
    } else {
      setSources([...sources, { ...draft, id: Date.now(), status: draft.type === "Webhook" ? "Pending auth" : "Active", events: "—", latency: "—", updated: "Just now" }]);
      onAction(`${draft.name} added`);
    }
    setEditing(null);
  };
  const toggleSource = (source: Source) => {
    const nextStatus: Status = source.status === "Active" ? "Degraded" : "Active";
    setSources(sources.map((item) => item.id === source.id ? { ...item, status: nextStatus, updated: "Just now" } : item));
    onAction(`${source.name} marked ${nextStatus.toLowerCase()}`);
  };
  const deleteSource = (source: Source) => {
    if (!window.confirm(`Delete ${source.name}? Active rules using this source may stop matching.`)) return;
    setSources(sources.filter((item) => item.id !== source.id));
    onAction(`${source.name} deleted`);
  };
  return <div className="page-body"><div className="page-toolbar"><div><p className="result-count">{sources.length} sources configured · {visibleSources.length} shown</p></div><button className="primary" onClick={() => setEditing({ id: 0, name: "", type: "REST poll", category: "News", status: "Active", events: "—", latency: "—", updated: "Just now", endpoint: "", supportsFiltering: false })}>+ Add source</button></div><section className="card table-card"><div className="table-filters"><div className="search">⌕ <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sources..." /></div><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option><option>News</option><option>Market</option><option>Disaster</option></select><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Active</option><option>Degraded</option><option>Pending auth</option></select></div><table><thead><tr><th>Source</th><th>Category</th><th>Status</th><th>Events (24h)</th><th>Latency</th><th>Last updated</th><th /></tr></thead><tbody>{visibleSources.map((source) => <tr key={source.id}><td><div className="table-source"><div className={`source-icon ${source.category.toLowerCase()}`}>{source.category[0]}</div><span><strong>{source.name}</strong><small>{source.type}</small></span></div></td><td>{source.category}</td><td><Badge status={source.status} /></td><td>{source.events}</td><td>{source.latency}</td><td>{source.updated}</td><td><div className="row-actions"><button className="action-link" onClick={() => setViewing(source)}>View</button><button className="action-link" onClick={() => setEditing(source)}>Edit</button><button className="action-link danger" onClick={() => deleteSource(source)}>Delete</button><button className="dots" onClick={() => toggleSource(source)}>•••</button></div></td></tr>)}</tbody></table>{visibleSources.length === 0 && <div className="empty-table">No sources match the current filters.</div>}</section>{editing && <SourceEditor source={editing.id ? editing : null} onClose={() => setEditing(null)} onSave={saveSource} />}{viewing && <SourceDetails source={viewing} onClose={() => setViewing(null)} onEdit={() => { setViewing(null); setEditing(viewing); }} />}</div>;
}

function SourceEditor({ source, onClose, onSave }: { source: Source | null; onClose: () => void; onSave: (draft: SourceDraft, id?: number) => void }) {
  const [draft, setDraft] = useState<SourceDraft>(source ? { name: source.name, category: source.category, type: source.type, endpoint: source.endpoint, supportsFiltering: source.supportsFiltering } : { name: "", category: "News", type: "REST poll", endpoint: "", supportsFiltering: false });
  const update = (field: keyof SourceDraft, value: string | boolean) => setDraft({ ...draft, [field]: value });
  const submit = (event: FormEvent) => { event.preventDefault(); if (!draft.name.trim() || !draft.endpoint.trim()) return; onSave({ ...draft, name: draft.name.trim(), endpoint: draft.endpoint.trim() }, source?.id); };
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="modal-head"><div><span className="eyebrow">SOURCE REGISTRY</span><h2>{source ? "Edit source" : "Add source"}</h2></div><button type="button" className="close-button" onClick={onClose}>×</button></div><p className="modal-intro">Configure the adapter connection and filtering capability for this source.</p><label>Source name<input required value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. USGS Earthquakes" /></label><div className="form-grid"><label>Category<select value={draft.category} onChange={(event) => update("category", event.target.value as SourceCategory)}><option>News</option><option>Market</option><option>Disaster</option></select></label><label>Adapter class<select value={draft.type} onChange={(event) => update("type", event.target.value)}><option>REST poll</option><option>WebSocket</option><option>Webhook</option><option>GDELT</option><option>RSS</option></select></label></div><label>Endpoint<input required value={draft.endpoint} onChange={(event) => update("endpoint", event.target.value)} placeholder="https://api.example.com/events" /></label><label className="check-row"><input type="checkbox" checked={draft.supportsFiltering} onChange={(event) => update("supportsFiltering", event.target.checked)} /><span><strong>Supports source filtering</strong><small>Allow the rule aggregator to update this source's query.</small></span></label><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" type="submit">{source ? "Save changes" : "Create source"}</button></div></form></div>;
}

function SourceDetails({ source, onClose, onEdit }: { source: Source; onClose: () => void; onEdit: () => void }) {
  return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><span className="eyebrow">SOURCE DETAILS</span><h2>{source.name}</h2></div><button className="close-button" onClick={onClose}>×</button></div><div className="detail-status"><Badge status={source.status} /><span>{source.type} adapter</span></div><dl className="source-details"><dt>Category</dt><dd>{source.category}</dd><dt>Endpoint</dt><dd className="break">{source.endpoint}</dd><dt>Events (24h)</dt><dd>{source.events}</dd><dt>Latency</dt><dd>{source.latency}</dd><dt>Filtering</dt><dd>{source.supportsFiltering ? "Supported" : "Not supported"}</dd><dt>Last updated</dt><dd>{source.updated}</dd></dl><div className="modal-actions"><button className="secondary" onClick={onClose}>Close</button><button className="primary" onClick={onEdit}>Edit source</button></div></div></div>;
}

function Users({ onAction }: { onAction: (message: string) => void }) {
  return <div className="page-body"><div className="page-toolbar"><div><p className="result-count">1,284 total users · 1,281 active</p></div><button className="secondary" onClick={() => onAction("Invite flow opened")}>Invite user</button></div><section className="card table-card"><div className="table-filters"><div className="search">⌕ <input placeholder="Search users..." /></div><select><option>All users</option><option>Active</option><option>Disabled</option></select></div><table><thead><tr><th>User</th><th>Active rules</th><th>Channels</th><th>Status</th><th>Last active</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.email}><td><div className="table-source"><div className="avatar small">{user.initials}</div><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td><td>{user.rules}</td><td>{user.channels}</td><td><Badge status={user.state} /></td><td>Today, 9:42 AM</td><td><button className="dots" onClick={() => onAction(`${user.name} details opened`)}>•••</button></td></tr>)}</tbody></table></section></div>;
}

function Delivery() {
  return <div className="page-body"><div className="welcome"><div><h2>Delivery performance</h2><p>Monitor notification delivery across every channel.</p></div></div><section className="metric-grid"><Metric label="Sent today" value="18,429" change="+21.3%" detail="vs. yesterday" accent="orange" /><Metric label="Successful" value="18,392" change="99.8%" detail="delivery rate" accent="green" /><Metric label="Retrying" value="24" change="0.1%" detail="of all deliveries" accent="purple" /><Metric label="Failed" value="13" change="0.07%" detail="of all deliveries" accent="blue" /></section><section className="card empty-delivery"><div className="delivery-graphic">✓</div><h3>All channels are healthy</h3><p>There are no delivery incidents requiring attention.</p></section></div>;
}

function Settings({ onAction }: { onAction: (message: string) => void }) {
  const [tab, setTab] = useState<"queue" | "dispatch">("queue");
  return <div className="page-body"><div className="welcome"><div><h2>Platform settings</h2><p>Configure the queues and delivery providers for your alert network.</p></div><span className="config-readonly">Environment managed</span></div><div className="settings-tabs" role="tablist"><button className={tab === "queue" ? "settings-tab active" : "settings-tab"} onClick={() => setTab("queue")} role="tab" aria-selected={tab === "queue"}><span>↔</span>Message queue<small>Event bus and dispatch queue</small></button><button className={tab === "dispatch" ? "settings-tab active" : "settings-tab"} onClick={() => setTab("dispatch")} role="tab" aria-selected={tab === "dispatch"}><span>➤</span>Dispatch services<small>Email and Slack delivery</small></button></div>{tab === "queue" ? <><div className="settings-grid"><section className="card settings-card"><div className="card-head"><div><h3>Event bus</h3><p>Replayable event stream for normalized events</p></div><Badge status="Active" /></div><div className="settings-body"><Setting label="Provider" value="Amazon MSK Serverless" /><Setting label="Topic" value="world-events" /><Setting label="Consumer group" value="rule-engine" /><Setting label="Security" value="IAM authentication" /></div></section><section className="card settings-card"><div className="card-head"><div><h3>Dispatch queue</h3><p>SQS queue for channel delivery jobs</p></div><Badge status="Active" /></div><div className="settings-body"><Setting label="Provider" value="Amazon SQS" /><Setting label="Batch size" value="10 messages" /><Setting label="Visibility timeout" value="120 seconds" /><Setting label="Max retries" value="5 attempts" /></div></section></div><section className="card queue-note"><div className="queue-note-icon">↔</div><div><h3>Queue settings are environment managed</h3><p>Queue URLs, brokers, and credentials are loaded by the backend. Secrets are never exposed in this admin view.</p></div><button className="secondary" onClick={() => onAction("Queue health check requested")}>Test connection</button></section></> : <><div className="settings-grid"><section className="card settings-card"><div className="card-head"><div><h3>Email dispatch</h3><p>Transactional email provider configuration</p></div><Badge status="Active" /></div><div className="settings-body"><Setting label="Provider" value="Amazon SES" /><Setting label="From address" value="alerts@example.com" /><Setting label="Region" value="us-east-1" /><Setting label="Credentials" value="Configured securely" /></div></section><section className="card settings-card"><div className="card-head"><div><h3>Slack dispatch</h3><p>Incoming webhook delivery configuration</p></div><Badge status="Active" /></div><div className="settings-body"><Setting label="Provider" value="Incoming webhook" /><Setting label="Webhook" value="Configured securely" /><Setting label="Request timeout" value="5 seconds" /><Setting label="Rate limit" value="5 / second" /></div></section></div><section className="card queue-note"><div className="queue-note-icon">➤</div><div><h3>Dispatch settings are environment managed</h3><p>Provider credentials, SMTP passwords, and Slack webhook URLs are loaded by the backend. Secrets are never exposed in this admin view.</p></div><button className="secondary" onClick={() => onAction("Dispatch health check requested")}>Test connection</button></section></>}</div>;
}

function Setting({ label, value }: { label: string; value: string }) {
  return <div className="setting-row"><span>{label}</span><strong>{value}</strong></div>;
}

export default App;
