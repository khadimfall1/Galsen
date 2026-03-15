const { useMemo, useState } = React;

const STORAGE_KEY = 'galsen-bookings-react-v4';
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

const packageTypeOptions = [
  { key: 'medium', label: 'Medium Box (up to 10kg)' },
  { key: 'large', label: 'Large Box (up to 20kg)' },
  { key: 'documents', label: 'Documents' },
];

const faqItems = [
  { title: 'How does booking work?', body: 'Go to Trips, enter sender details, search a route, and click Book now.' },
  { title: 'How do I track package progress?', body: 'Open Dashboard and advance your booking status from Pending to Delivered.' },
  { title: 'Can I cancel or edit my booking?', body: 'You can cancel from Dashboard. To edit details, cancel and re-book.' },
  { title: 'Will my data be saved after refresh?', body: 'Yes, bookings are saved in localStorage and shared across pages.' },
];

const normalizeLocation = (value) =>
  (value.split(/[\-,]/)[0] || value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const toTitleCase = (value) =>
  value
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');

const buildPrice = (basePrice, packageType) => {
  if (packageType === 'documents') return Math.max(basePrice - 7, 20);
  if (packageType === 'large') return basePrice + 12;
  return basePrice;
};

const makeBookingId = () => `GP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

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

  const getBookedCount = (tripId) => bookings.filter((booking) => booking.tripId === tripId && booking.status !== 'Canceled').length;
  const getRemainingSlots = (trip) => Math.max(trip.slots - getBookedCount(trip.id), 0);

  return { bookings, setBookings, getRemainingSlots };
}

function Nav() {
  const page = document.body.dataset.page;
  return (
    <header className="topbar wrapper">
      <div className="brand">
        <span className="brand-mark">G</span>
        <div>
          <p className="brand-name">Galsen Parcel</p>
          <p className="brand-sub">React + React Aria inspired UI</p>
        </div>
      </div>
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

function HomePage({ bookings, getRemainingSlots }) {
  const active = bookings.filter((b) => !['Canceled', 'Delivered'].includes(b.status)).length;
  const delivered = bookings.filter((b) => b.status === 'Delivered').length;
  const openSlots = trips.reduce((count, trip) => count + getRemainingSlots(trip), 0);

  return (
    <main>
      <section className="hero wrapper">
        <div className="hero-copy">
          <p className="eyebrow">React-driven experience</p>
          <h1>Polished parcel booking UI with accessible component patterns</h1>
          <p>Built around reusable patterns and enhanced with React Aria style interactions.</p>
          <div className="hero-cta">
            <a className="primary-btn" href="./trips.html">Find travelers</a>
            <a className="secondary-btn" href="./dashboard.html">Open dashboard</a>
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

function PackageTypePicker({ value, onChange }) {
  const rac = window.ReactAriaComponents;

  if (!rac) {
    return (
      <label>
        Package type
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {packageTypeOptions.map((item) => (
            <option value={item.key} key={item.key}>{item.label}</option>
          ))}
        </select>
      </label>
    );
  }

  const { Select, Label, Button, SelectValue, Popover, ListBox, ListBoxItem } = rac;

  return (
    <div className="rac-field">
      <Select selectedKey={value} onSelectionChange={(key) => onChange(String(key))}>
        <Label className="rac-label">Package type</Label>
        <Button className="rac-trigger">
          <SelectValue />
          <span aria-hidden="true">▾</span>
        </Button>
        <Popover className="rac-popover">
          <ListBox className="rac-listbox">
            {packageTypeOptions.map((item) => (
              <ListBoxItem id={item.key} key={item.key} className="rac-item">
                {item.label}
              </ListBoxItem>
            ))}
          </ListBox>
        </Popover>
      </Select>
    </div>
  );
}

function TripsPage({ setBookings, getRemainingSlots }) {
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({
    senderName: '',
    senderPhone: '',
    from: 'Milan',
    to: 'Dakar',
    pickupDate: '2026-04-18',
    packageType: 'medium',
    packageNote: '',
  });

  const matches = useMemo(() => {
    const minWeight = PACKAGE_WEIGHT[form.packageType];
    return trips
      .filter((trip) => normalizeLocation(trip.from) === normalizeLocation(form.from) && normalizeLocation(trip.to) === normalizeLocation(form.to) && (!form.pickupDate || trip.date >= form.pickupDate) && trip.capacityKg >= minWeight)
      .map((trip) => ({ ...trip, displayedPrice: buildPrice(trip.basePrice, form.packageType) }));
  }, [form]);

  const averagePrice = matches.length ? Math.round(matches.reduce((sum, t) => sum + t.displayedPrice, 0) / matches.length) : null;

  const bookTrip = (trip) => {
    if (!form.senderName.trim() || !form.senderPhone.trim()) {
      setFeedback('Please provide sender name and phone before booking.');
      return;
    }
    if (!getRemainingSlots(trip)) {
      setFeedback('No slots left for this trip.');
      return;
    }

    setBookings((prev) => [{
      bookingId: makeBookingId(),
      tripId: trip.id,
      route: `${trip.from} → ${trip.to}`,
      date: trip.date,
      courier: trip.courier,
      senderName: form.senderName.trim(),
      senderPhone: form.senderPhone.trim(),
      packageType: form.packageType,
      packageNote: form.packageNote.trim(),
      price: trip.displayedPrice,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }, ...prev]);

    setFeedback(`Booking confirmed with ${trip.courier}.`);
  };

  return (
    <main className="wrapper page-main">
      <h1 className="page-title">Book a parcel trip</h1>
      <div className="search-card elevated-card">
        <div className="field-grid">
          <label>Sender name <input value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} /></label>
          <label>Phone number <input value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} /></label>
          <label>From <input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></label>
          <label>To <input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></label>
          <label>Pickup date <input type="date" value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} /></label>
          <PackageTypePicker value={form.packageType} onChange={(value) => setForm({ ...form, packageType: value })} />
          <label className="full-width">Package notes <input value={form.packageNote} onChange={(e) => setForm({ ...form, packageNote: e.target.value })} /></label>
        </div>

        <p className="muted">Average price {toTitleCase(form.from)} → {toTitleCase(form.to)}: <strong>{averagePrice ? `€${averagePrice}` : 'Not available'}</strong></p>
        <p className="feedback neutral">{feedback || `Found ${matches.length} matching traveler(s).`}</p>

        <div className="results">
          {matches.length === 0 ? (
            <p className="no-results">No traveler found for this route/date.</p>
          ) : (
            matches.map((trip) => (
              <article key={trip.id} className="result-card">
                <div>
                  <h3>{trip.courier}</h3>
                  <p>{trip.from} → {trip.to} • {trip.date}</p>
                  <p className="muted">{getRemainingSlots(trip)} slot(s) available</p>
                </div>
                <div className="result-meta">
                  <span>⭐ {trip.rating}</span>
                  <span>{trip.capacityKg}kg max</span>
                  <span className="price">€{trip.displayedPrice}</span>
                  <button className="primary-btn small" disabled={!getRemainingSlots(trip)} onClick={() => bookTrip(trip)}>Book now</button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function DashboardPage({ bookings, setBookings }) {
  const advanceStatus = (bookingId) => {
    setBookings((prev) => prev.map((booking) => {
      if (booking.bookingId !== bookingId) return booking;
      const idx = STATUS_FLOW.indexOf(booking.status);
      if (idx < 0 || idx >= STATUS_FLOW.length - 1) return booking;
      return { ...booking, status: STATUS_FLOW[idx + 1] };
    }));
  };

  const cancelBooking = (bookingId) => {
    setBookings((prev) => prev.map((booking) => booking.bookingId === bookingId ? { ...booking, status: 'Canceled' } : booking));
  };

  return (
    <main className="wrapper page-main">
      <h1 className="page-title">My bookings dashboard</h1>
      <div className="dashboard-card elevated-card">
        <div className="bookings-list">
          {bookings.length === 0 ? <p className="no-results">No bookings yet.</p> : bookings.map((booking) => {
            const statusIdx = STATUS_FLOW.indexOf(booking.status);
            const canAdvance = statusIdx >= 0 && statusIdx < STATUS_FLOW.length - 1;
            return (
              <article className="booking-card" key={booking.bookingId}>
                <div>
                  <h3>{booking.bookingId} • {booking.route}</h3>
                  <p>{booking.date} • Courier: {booking.courier}</p>
                  <p>{booking.senderName} ({booking.senderPhone}) • {booking.packageType}</p>
                </div>
                <div className="booking-actions">
                  <span className={`status-tag status-${booking.status.toLowerCase().replace(/\s+/g, '-')}`}>{booking.status}</span>
                  <button className="secondary-btn small" disabled={!canAdvance} onClick={() => advanceStatus(booking.bookingId)}>Advance status</button>
                  <button className="ghost-btn small" disabled={booking.status === 'Canceled'} onClick={() => cancelBooking(booking.bookingId)}>Cancel</button>
                </div>
              </article>
            );
          })}
        </div>
        <button className="secondary-btn" onClick={() => setBookings([])}>Clear all bookings</button>
      </div>
    </main>
  );
}

function SupportAccordion() {
  const rac = window.ReactAriaComponents;

  if (!rac) {
    const [openIndex, setOpenIndex] = useState(0);
    return (
      <div className="accordion" role="list">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <article className={`accordion-item ${isOpen ? 'open' : ''}`} key={item.title} role="listitem">
              <button className="accordion-trigger" type="button" aria-expanded={isOpen} onClick={() => setOpenIndex(isOpen ? -1 : index)}>
                <span>{item.title}</span>
                <span className="accordion-indicator">{isOpen ? '−' : '+'}</span>
              </button>
              <div className="accordion-content" hidden={!isOpen}><p>{item.body}</p></div>
            </article>
          );
        })}
      </div>
    );
  }

  const { DisclosureGroup, Disclosure, DisclosurePanel, Heading, Button } = rac;

  return (
    <DisclosureGroup className="accordion" defaultExpandedKeys={[faqItems[0].title]}>
      {faqItems.map((item) => (
        <Disclosure id={item.title} key={item.title} className="accordion-item">
          {({ isExpanded }) => (
            <>
              <Heading>
                <Button className="accordion-trigger">
                  <span>{item.title}</span>
                  <span className="accordion-indicator">{isExpanded ? '−' : '+'}</span>
                </Button>
              </Heading>
              <DisclosurePanel className="accordion-content">
                <p>{item.body}</p>
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      ))}
    </DisclosureGroup>
  );
}

function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [notice, setNotice] = useState('');

  return (
    <main className="wrapper page-main">
      <h1 className="page-title">Support center</h1>
      <div className="search-card elevated-card">
        <h2>Contact support</h2>
        <form onSubmit={(event) => {
          event.preventDefault();
          setNotice(`Thanks ${form.name}, your message has been recorded.`);
          setForm({ name: '', email: '', message: '' });
        }}>
          <div className="field-grid">
            <label>Name <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Email <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="full-width">Message <input required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
          </div>
          <button className="primary-btn" type="submit">Send message</button>
        </form>
        <p className="feedback success">{notice}</p>
      </div>

      <section className="wrapper faq-section">
        <h2 className="section-title">Frequently asked questions</h2>
        <SupportAccordion />
      </section>
    </main>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrapper footer-grid">
        <div>
          <p className="brand-name">Galsen Parcel</p>
          <p>React JS multi-page app with React Aria component usage.</p>
        </div>
        <div>
          <p className="footer-title">Product</p>
          <a href="./trips.html">Trips</a>
          <a href="./dashboard.html">Dashboard</a>
        </div>
        <div>
          <p className="footer-title">Support</p>
          <a href="./support.html">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const { bookings, setBookings, getRemainingSlots } = useBookings();
  const page = document.body.dataset.page;

  return (
    <>
      <Nav />
      {page === 'home' && <HomePage bookings={bookings} getRemainingSlots={getRemainingSlots} />}
      {page === 'trips' && <TripsPage setBookings={setBookings} getRemainingSlots={getRemainingSlots} />}
      {page === 'dashboard' && <DashboardPage bookings={bookings} setBookings={setBookings} />}
      {page === 'support' && <SupportPage />}
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
