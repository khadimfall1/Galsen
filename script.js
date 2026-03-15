const { useMemo, useState } = React;

const STORAGE_KEY = 'galsen-bookings-react-v3';
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

const faqItems = [
  {
    title: 'How does booking work?',
    body: 'Go to Trips, enter sender details, search a route, and click Book now. Your booking is stored in your browser instantly.',
  },
  {
    title: 'How do I track package progress?',
    body: 'Open the Dashboard page to move bookings from Pending to Delivered and monitor status chips in real time.',
  },
  {
    title: 'Can I cancel or edit my booking?',
    body: 'You can cancel from the Dashboard. To change details, cancel the booking and create a new one with updated info.',
  },
  {
    title: 'Will my data be saved after refresh?',
    body: 'Yes. Bookings persist in localStorage, so the app state stays available when you refresh or switch pages.',
  },
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

  const getBookedCount = (tripId) =>
    bookings.filter((booking) => booking.tripId === tripId && booking.status !== 'Canceled').length;

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
          <p className="brand-sub">React multi-page app</p>
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
  const active = bookings.filter((booking) => !['Canceled', 'Delivered'].includes(booking.status)).length;
  const delivered = bookings.filter((booking) => booking.status === 'Delivered').length;
  const openSlots = trips.reduce((count, trip) => count + getRemainingSlots(trip), 0);

  return (
    <main>
      <section className="hero wrapper">
        <div className="hero-copy">
          <p className="eyebrow">React-powered experience</p>
          <h1>Modern parcel booking with a cleaner, premium UI</h1>
          <p>
            Inspired by contemporary component systems: cleaner spacing, better visual hierarchy,
            and clearer status-oriented interactions.
          </p>
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
      .filter(
        (trip) =>
          normalizeLocation(trip.from) === normalizeLocation(form.from) &&
          normalizeLocation(trip.to) === normalizeLocation(form.to) &&
          (!form.pickupDate || trip.date >= form.pickupDate) &&
          trip.capacityKg >= minWeight,
      )
      .map((trip) => ({ ...trip, displayedPrice: buildPrice(trip.basePrice, form.packageType) }));
  }, [form]);

  const averagePrice =
    matches.length > 0
      ? Math.round(matches.reduce((sum, trip) => sum + trip.displayedPrice, 0) / matches.length)
      : null;

  const bookTrip = (trip) => {
    if (!form.senderName.trim() || !form.senderPhone.trim()) {
      setFeedback('Please provide sender name and phone before booking.');
      return;
    }

    if (!getRemainingSlots(trip)) {
      setFeedback('No slots left for this trip.');
      return;
    }

    setBookings((prev) => [
      {
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
      },
      ...prev,
    ]);

    setFeedback(`Booking confirmed with ${trip.courier}.`);
  };

  return (
    <main className="wrapper page-main">
      <h1 className="page-title">Book a parcel trip</h1>
      <div className="search-card elevated-card">
        <div className="field-grid">
          {[
            { key: 'senderName', label: 'Sender name' },
            { key: 'senderPhone', label: 'Phone number' },
            { key: 'from', label: 'From' },
            { key: 'to', label: 'To' },
            { key: 'packageNote', label: 'Package notes', full: true },
          ].map((item) => (
            <label key={item.key} className={item.full ? 'full-width' : ''}>
              {item.label}
              <input
                value={form[item.key]}
                onChange={(event) => setForm({ ...form, [item.key]: event.target.value })}
              />
            </label>
          ))}

          <label>
            Pickup date
            <input
              type="date"
              value={form.pickupDate}
              onChange={(event) => setForm({ ...form, pickupDate: event.target.value })}
            />
          </label>

          <label>
            Package type
            <select
              value={form.packageType}
              onChange={(event) => setForm({ ...form, packageType: event.target.value })}
            >
              <option value="medium">Medium Box (up to 10kg)</option>
              <option value="large">Large Box (up to 20kg)</option>
              <option value="documents">Documents</option>
            </select>
          </label>
        </div>

        <p className="muted">
          Average price {toTitleCase(form.from)} → {toTitleCase(form.to)}:{' '}
          <strong>{averagePrice ? `€${averagePrice}` : 'Not available'}</strong>
        </p>
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
                  <button
                    className="primary-btn small"
                    disabled={!getRemainingSlots(trip)}
                    onClick={() => bookTrip(trip)}
                  >
                    Book now
                  </button>
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
    setBookings((prev) =>
      prev.map((booking) => {
        if (booking.bookingId !== bookingId) return booking;
        const index = STATUS_FLOW.indexOf(booking.status);
        if (index < 0 || index >= STATUS_FLOW.length - 1) return booking;
        return { ...booking, status: STATUS_FLOW[index + 1] };
      }),
    );
  };

  const cancelBooking = (bookingId) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.bookingId === bookingId ? { ...booking, status: 'Canceled' } : booking,
      ),
    );
  };

  return (
    <main className="wrapper page-main">
      <h1 className="page-title">My bookings dashboard</h1>
      <div className="dashboard-card elevated-card">
        <div className="bookings-list">
          {bookings.length === 0 ? (
            <p className="no-results">No bookings yet.</p>
          ) : (
            bookings.map((booking) => {
              const statusIndex = STATUS_FLOW.indexOf(booking.status);
              const canAdvance = statusIndex >= 0 && statusIndex < STATUS_FLOW.length - 1;
              return (
                <article className="booking-card" key={booking.bookingId}>
                  <div>
                    <h3>{booking.bookingId} • {booking.route}</h3>
                    <p>{booking.date} • Courier: {booking.courier}</p>
                    <p>{booking.senderName} ({booking.senderPhone}) • {booking.packageType}</p>
                  </div>
                  <div className="booking-actions">
                    <span className={`status-tag status-${booking.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {booking.status}
                    </span>
                    <button
                      className="secondary-btn small"
                      disabled={!canAdvance}
                      onClick={() => advanceStatus(booking.bookingId)}
                    >
                      Advance status
                    </button>
                    <button
                      className="ghost-btn small"
                      disabled={booking.status === 'Canceled'}
                      onClick={() => cancelBooking(booking.bookingId)}
                    >
                      Cancel
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <button className="secondary-btn" onClick={() => setBookings([])}>Clear all bookings</button>
      </div>
    </main>
  );
}

function SupportAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="accordion" role="list">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <article className={`accordion-item ${isOpen ? 'open' : ''}`} key={item.title} role="listitem">
            <button
              className="accordion-trigger"
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span>{item.title}</span>
              <span className="accordion-indicator">{isOpen ? '−' : '+'}</span>
            </button>
            <div className="accordion-content" hidden={!isOpen}>
              <p>{item.body}</p>
            </div>
          </article>
        );
      })}
    </div>
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setNotice(`Thanks ${form.name}, your message has been recorded.`);
            setForm({ name: '', email: '', message: '' });
          }}
        >
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
          <p>React JS multi-page app ready to publish.</p>
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
