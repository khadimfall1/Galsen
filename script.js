const { useMemo, useState } = React;

const STORAGE_KEY = 'galsen-bookings-react-v2';
const STATUS_FLOW = ['Pending', 'Picked Up', 'In Transit', 'Delivered'];
const PACKAGE_WEIGHT = { medium: 10, large: 20, documents: 2 };
const trips = [
  { id: 'T-1001', from: 'Milan', to: 'Dakar', date: '2026-04-18', courier: 'Fatou Ndiaye', rating: 4.9, capacityKg: 10, slots: 4, basePrice: 35 },
  { id: 'T-1002', from: 'Rome', to: 'Dakar', date: '2026-04-19', courier: 'Mamadou Sarr', rating: 4.8, capacityKg: 20, slots: 3, basePrice: 40 },
  { id: 'T-1003', from: 'Turin', to: 'Dakar', date: '2026-04-20', courier: 'Awa Diop', rating: 4.7, capacityKg: 20, slots: 2, basePrice: 38 },
  { id: 'T-1004', from: 'Bologna', to: 'Dakar', date: '2026-04-21', courier: 'Cheikh Ba', rating: 4.8, capacityKg: 10, slots: 5, basePrice: 36 },
  { id: 'T-1005', from: 'Milan', to: 'Dakar', date: '2026-04-22', courier: 'Meryem Fall', rating: 4.6, capacityKg: 10, slots: 2, basePrice: 44 },
  { id: 'T-1006', from: 'Milan', to: 'Thies', date: '2026-04-23', courier: 'Ibrahima Kane', rating: 4.9, capacityKg: 20, slots: 2, basePrice: 46 },
];

const norm = (value) => (value.split(/[\-,]/)[0] || value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const title = (value) => value.trim().toLowerCase().split(' ').filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(' ');
const price = (basePrice, type) => (type === 'documents' ? Math.max(basePrice - 7, 20) : type === 'large' ? basePrice + 12 : basePrice);
const bookingId = () => `GP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function useBookings() {
  const [bookings, setBookings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  const bookedCount = (tripId) => bookings.filter((b) => b.tripId === tripId && b.status !== 'Canceled').length;
  const remaining = (trip) => Math.max(trip.slots - bookedCount(trip.id), 0);

  return { bookings, setBookings, remaining };
}

function Nav() {
  const page = document.body.dataset.page;
  return (
    <header className="topbar wrapper">
      <div className="brand"><span className="brand-mark">G</span><div><p className="brand-name">Galsen Parcel</p><p className="brand-sub">React multi-page app</p></div></div>
      <nav className="nav-links">
        <a href="./index.html" className={page === 'home' ? 'active' : ''}>Home</a>
        <a href="./trips.html" className={page === 'trips' ? 'active' : ''}>Trips</a>
        <a href="./dashboard.html" className={page === 'dashboard' ? 'active' : ''}>Dashboard</a>
        <a href="./support.html" className={page === 'support' ? 'active' : ''}>Support</a>
      </nav>
      <a className="ghost-btn" href="./trips.html">Book now</a>
    </header>
  );
}

function HomePage({ bookings, remaining }) {
  const active = bookings.filter((b) => !['Canceled', 'Delivered'].includes(b.status)).length;
  const delivered = bookings.filter((b) => b.status === 'Delivered').length;
  const openSlots = trips.reduce((s, t) => s + remaining(t), 0);
  return (
    <main>
      <section className="hero wrapper">
        <div className="hero-copy">
          <p className="eyebrow">Now in React JS</p>
          <h1>Publish-ready multi-page parcel marketplace</h1>
          <p>Search and booking are now rendered by React components on each page.</p>
          <div className="hero-cta">
            <a className="primary-btn" href="./trips.html">Find travelers</a>
            <a className="secondary-btn" href="./dashboard.html">View dashboard</a>
          </div>
        </div>
        <div className="search-card">
          <h2>Live platform stats</h2>
          <div className="stats-grid">
            <article className="stat-card"><h3>{trips.length}</h3><p>Published trips</p></article>
            <article className="stat-card"><h3>{active}</h3><p>Active bookings</p></article>
            <article className="stat-card"><h3>{delivered}</h3><p>Delivered</p></article>
            <article className="stat-card"><h3>{openSlots}</h3><p>Open slots</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}

function TripsPage({ setBookings, remaining }) {
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({ senderName: '', senderPhone: '', from: 'Milan', to: 'Dakar', pickupDate: '2026-04-18', packageType: 'medium', packageNote: '' });

  const matches = useMemo(() => {
    const min = PACKAGE_WEIGHT[form.packageType];
    return trips
      .filter((t) => norm(t.from) === norm(form.from) && norm(t.to) === norm(form.to) && (!form.pickupDate || t.date >= form.pickupDate) && t.capacityKg >= min)
      .map((t) => ({ ...t, displayedPrice: price(t.basePrice, form.packageType) }));
  }, [form]);

  const avg = matches.length ? Math.round(matches.reduce((s, t) => s + t.displayedPrice, 0) / matches.length) : null;

  const book = (trip) => {
    if (!form.senderName.trim() || !form.senderPhone.trim()) {
      setFeedback('Please provide sender name and phone before booking.');
      return;
    }
    if (!remaining(trip)) {
      setFeedback('No slots left for this trip.');
      return;
    }
    setBookings((prev) => [{ bookingId: bookingId(), tripId: trip.id, route: `${trip.from} → ${trip.to}`, date: trip.date, courier: trip.courier, senderName: form.senderName.trim(), senderPhone: form.senderPhone.trim(), packageType: form.packageType, packageNote: form.packageNote.trim(), price: trip.displayedPrice, status: 'Pending', createdAt: new Date().toISOString() }, ...prev]);
    setFeedback(`Booking confirmed with ${trip.courier}.`);
  };

  return (
    <main className="wrapper page-main">
      <h1 className="page-title">Book a parcel trip</h1>
      <div className="search-card">
        <div className="field-grid">
          {['senderName','senderPhone','from','to','packageNote'].map((key) => (
            <label key={key} className={key === 'packageNote' ? 'full-width' : ''}>{key === 'senderName' ? 'Sender name' : key === 'senderPhone' ? 'Phone number' : key === 'packageNote' ? 'Package notes' : key === 'from' ? 'From' : 'To'}
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </label>
          ))}
          <label>Pickup date <input type="date" value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} /></label>
          <label>Package type
            <select value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value })}>
              <option value="medium">Medium Box (up to 10kg)</option>
              <option value="large">Large Box (up to 20kg)</option>
              <option value="documents">Documents</option>
            </select>
          </label>
        </div>
        <p className="muted">Average price {title(form.from)} → {title(form.to)}: <strong>{avg ? `€${avg}` : 'Not available'}</strong></p>
        <p className="feedback neutral">{feedback || `Found ${matches.length} matching traveler(s).`}</p>
        <div className="results">
          {!matches.length ? <p className="no-results">No traveler found for this route/date.</p> : matches.map((trip) => (
            <article key={trip.id} className="result-card">
              <div><h3>{trip.courier}</h3><p>{trip.from} → {trip.to} • {trip.date}</p><p className="muted">{remaining(trip)} slot(s) available</p></div>
              <div className="result-meta"><span>⭐ {trip.rating}</span><span>{trip.capacityKg}kg max</span><span className="price">€{trip.displayedPrice}</span><button className="primary-btn small" disabled={!remaining(trip)} onClick={() => book(trip)}>Book now</button></div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function DashboardPage({ bookings, setBookings }) {
  const advance = (bookingId) => setBookings((prev) => prev.map((b) => {
    if (b.bookingId !== bookingId) return b;
    const i = STATUS_FLOW.indexOf(b.status);
    return i >= 0 && i < STATUS_FLOW.length - 1 ? { ...b, status: STATUS_FLOW[i + 1] } : b;
  }));
  const cancel = (bookingId) => setBookings((prev) => prev.map((b) => (b.bookingId === bookingId ? { ...b, status: 'Canceled' } : b)));

  return (
    <main className="wrapper page-main">
      <h1 className="page-title">My bookings dashboard</h1>
      <div className="dashboard-card">
        <div className="bookings-list">
          {!bookings.length ? <p className="no-results">No bookings yet.</p> : bookings.map((b) => {
            const idx = STATUS_FLOW.indexOf(b.status);
            return (
              <article className="booking-card" key={b.bookingId}>
                <div><h3>{b.bookingId} • {b.route}</h3><p>{b.date} • Courier: {b.courier}</p><p>{b.senderName} ({b.senderPhone}) • {b.packageType}</p></div>
                <div className="booking-actions"><span className={`status-tag status-${b.status.toLowerCase().replace(/\s+/g, '-')}`}>{b.status}</span><button className="secondary-btn small" disabled={idx < 0 || idx >= STATUS_FLOW.length - 1} onClick={() => advance(b.bookingId)}>Advance status</button><button className="ghost-btn small" disabled={b.status === 'Canceled'} onClick={() => cancel(b.bookingId)}>Cancel</button></div>
              </article>
            );
          })}
        </div>
        <button className="secondary-btn" onClick={() => setBookings([])}>Clear all bookings</button>
      </div>
    </main>
  );
}

function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [ok, setOk] = useState('');
  return (
    <main className="wrapper page-main">
      <h1 className="page-title">Support center</h1>
      <div className="search-card">
        <h2>Contact support</h2>
        <form onSubmit={(e) => { e.preventDefault(); setOk(`Thanks ${form.name}, your message has been recorded.`); setForm({ name: '', email: '', message: '' }); }}>
          <div className="field-grid">
            <label>Name <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Email <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="full-width">Message <input required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
          </div>
          <button className="primary-btn" type="submit">Send message</button>
        </form>
        <p className="feedback success">{ok}</p>
      </div>
    </main>
  );
}

function Footer() {
  return <footer><div className="wrapper footer-grid"><div><p className="brand-name">Galsen Parcel</p><p>React JS multi-page app ready to publish.</p></div><div><p className="footer-title">Product</p><a href="./trips.html">Trips</a><a href="./dashboard.html">Dashboard</a></div><div><p className="footer-title">Support</p><a href="./support.html">Contact</a></div></div></footer>;
}

function App() {
  const { bookings, setBookings, remaining } = useBookings();
  const page = document.body.dataset.page;
  return (
    <>
      <Nav />
      {page === 'home' && <HomePage bookings={bookings} remaining={remaining} />}
      {page === 'trips' && <TripsPage setBookings={setBookings} remaining={remaining} />}
      {page === 'dashboard' && <DashboardPage bookings={bookings} setBookings={setBookings} />}
      {page === 'support' && <SupportPage />}
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
