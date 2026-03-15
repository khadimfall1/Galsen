const BOOKING_STORAGE_KEY = 'galsen-bookings-v1';
const STATUS_FLOW = ['Pending', 'Picked Up', 'In Transit', 'Delivered'];

const trips = [
  { id: 'T-1001', from: 'Milan', to: 'Dakar', date: '2026-04-18', courier: 'Fatou Ndiaye', rating: 4.9, capacityKg: 10, slots: 4, basePrice: 35 },
  { id: 'T-1002', from: 'Rome', to: 'Dakar', date: '2026-04-19', courier: 'Mamadou Sarr', rating: 4.8, capacityKg: 20, slots: 3, basePrice: 40 },
  { id: 'T-1003', from: 'Turin', to: 'Dakar', date: '2026-04-20', courier: 'Awa Diop', rating: 4.7, capacityKg: 20, slots: 2, basePrice: 38 },
  { id: 'T-1004', from: 'Bologna', to: 'Dakar', date: '2026-04-21', courier: 'Cheikh Ba', rating: 4.8, capacityKg: 10, slots: 5, basePrice: 36 },
  { id: 'T-1005', from: 'Milan', to: 'Dakar', date: '2026-04-22', courier: 'Meryem Fall', rating: 4.6, capacityKg: 10, slots: 2, basePrice: 44 },
  { id: 'T-1006', from: 'Milan', to: 'Thies', date: '2026-04-23', courier: 'Ibrahima Kane', rating: 4.9, capacityKg: 20, slots: 2, basePrice: 46 },
];

const packageWeightByType = { medium: 10, large: 20, documents: 2 };

const routeGrid = document.querySelector('#route-grid');
const resultContainer = document.querySelector('#search-results');
const form = document.querySelector('#trip-search-form');
const averagePrice = document.querySelector('#average-price');
const feedbackMessage = document.querySelector('#feedback-message');
const bookingsList = document.querySelector('#bookings-list');
const clearBookingsButton = document.querySelector('#clear-bookings');

let currentMatches = [];
let bookings = loadBookings();

function loadBookings() {
  try {
    const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookings() {
  localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings));
}

function toTitleCase(value) {
  return value.trim().toLowerCase().split(' ').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function normalizeLocation(value) {
  const cityOnly = value.split(/[\-,]/)[0] || value;
  return cityOnly.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function buildPrice(basePrice, packageType) {
  if (packageType === 'documents') {
    return Math.max(basePrice - 7, 20);
  }
  if (packageType === 'large') {
    return basePrice + 12;
  }
  return basePrice;
}

function getBookedCountForTrip(tripId) {
  return bookings.filter((booking) => booking.tripId === tripId && booking.status !== 'Canceled').length;
}

function getRemainingSlots(trip) {
  return Math.max(trip.slots - getBookedCountForTrip(trip.id), 0);
}

function setFeedback(message, tone = 'neutral') {
  feedbackMessage.textContent = message;
  feedbackMessage.className = `feedback ${tone}`;
}

function renderPopularRoutes() {
  const grouped = trips.reduce((acc, trip) => {
    const key = `${trip.from} → ${trip.to}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(trip);
    return acc;
  }, {});

  routeGrid.innerHTML = Object.entries(grouped)
    .map(([route, items]) => {
      const minPrice = Math.min(...items.map((trip) => trip.basePrice));
      const openSlots = items.reduce((count, trip) => count + getRemainingSlots(trip), 0);
      return `
        <article class="route-card">
          <p>${route}</p>
          <h3>From €${minPrice}</h3>
          <span>${openSlots} slots open • frequent departures</span>
        </article>
      `;
    })
    .join('');
}

function renderResults(matches, packageType, fromLabel, toLabel) {
  currentMatches = matches.map((trip) => ({ ...trip, displayedPrice: buildPrice(trip.basePrice, packageType) }));

  if (!currentMatches.length) {
    resultContainer.innerHTML = `<p class="no-results">No traveler found for ${fromLabel} → ${toLabel}. Try another date or nearby city.</p>`;
    averagePrice.innerHTML = `Average price ${fromLabel} → ${toLabel} today: <strong>Not available</strong>`;
    return;
  }

  const avgPrice = Math.round(currentMatches.reduce((total, item) => total + item.displayedPrice, 0) / currentMatches.length);
  averagePrice.innerHTML = `Average price ${fromLabel} → ${toLabel} today: <strong>€${avgPrice}</strong>`;

  resultContainer.innerHTML = currentMatches
    .map((trip) => {
      const remaining = getRemainingSlots(trip);
      const full = remaining === 0;
      return `
        <article class="result-card">
          <div>
            <h3>${trip.courier}</h3>
            <p>${trip.from} → ${trip.to} • ${trip.date}</p>
            <p class="muted">${full ? 'Fully booked' : `${remaining} slot(s) available`}</p>
          </div>
          <div class="result-meta">
            <span>⭐ ${trip.rating}</span>
            <span>${trip.capacityKg}kg max</span>
            <span class="price">€${trip.displayedPrice}</span>
            <button class="primary-btn small" type="button" data-book-trip-id="${trip.id}" ${full ? 'disabled' : ''}>Book now</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function searchTrips(event) {
  event.preventDefault();
  const fromInput = document.querySelector('#from').value;
  const toInput = document.querySelector('#to').value;
  const from = toTitleCase(fromInput);
  const to = toTitleCase(toInput);
  const normalizedFrom = normalizeLocation(fromInput);
  const normalizedTo = normalizeLocation(toInput);
  const pickupDate = document.querySelector('#pickup-date').value;
  const packageType = document.querySelector('#package-type').value;
  const minCapacity = packageWeightByType[packageType];

  const matches = trips.filter((trip) => {
    const sameRoute = normalizeLocation(trip.from) === normalizedFrom && normalizeLocation(trip.to) === normalizedTo;
    const availableDate = pickupDate ? trip.date >= pickupDate : true;
    const capacityOk = trip.capacityKg >= minCapacity;
    return sameRoute && availableDate && capacityOk;
  });

  setFeedback(`Showing ${matches.length} matching traveler(s).`, 'neutral');
  renderResults(matches, packageType, from, to);
}

function makeBookingId() {
  return `GP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function createBooking(tripId) {
  const senderName = document.querySelector('#sender-name').value.trim();
  const senderPhone = document.querySelector('#sender-phone').value.trim();
  const packageType = document.querySelector('#package-type').value;
  const packageNote = document.querySelector('#package-note').value.trim();

  if (!senderName || !senderPhone) {
    setFeedback('Please provide sender name and phone number before booking.', 'error');
    return;
  }

  const trip = currentMatches.find((item) => item.id === tripId);
  if (!trip) {
    setFeedback('Please run a search again before booking this trip.', 'error');
    return;
  }

  if (getRemainingSlots(trip) === 0) {
    setFeedback('This trip has no remaining slots.', 'error');
    renderResults(currentMatches, packageType, trip.from, trip.to);
    return;
  }

  bookings.unshift({
    bookingId: makeBookingId(),
    tripId: trip.id,
    route: `${trip.from} → ${trip.to}`,
    date: trip.date,
    courier: trip.courier,
    senderName,
    senderPhone,
    packageType,
    packageNote,
    price: trip.displayedPrice,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  });

  saveBookings();
  renderBookings();
  renderPopularRoutes();
  searchTrips(new Event('submit', { cancelable: true }));
  setFeedback(`Booking created successfully for ${trip.courier}.`, 'success');
}

function renderBookings() {
  if (!bookings.length) {
    bookingsList.innerHTML = '<p class="no-results">No bookings yet. Search and click “Book now” to create one.</p>';
    return;
  }

  bookingsList.innerHTML = bookings
    .map((booking) => {
      const statusIndex = STATUS_FLOW.indexOf(booking.status);
      const canAdvance = statusIndex >= 0 && statusIndex < STATUS_FLOW.length - 1;
      return `
        <article class="booking-card">
          <div>
            <h3>${booking.bookingId} • ${booking.route}</h3>
            <p>${booking.date} • Courier: ${booking.courier}</p>
            <p>${booking.senderName} (${booking.senderPhone}) • ${booking.packageType}</p>
            <p class="muted">${booking.packageNote || 'No special note'}</p>
          </div>
          <div class="booking-actions">
            <span class="status-tag status-${booking.status.toLowerCase().replace(/\s+/g, '-')}">${booking.status}</span>
            <button type="button" class="secondary-btn small" data-advance-booking-id="${booking.bookingId}" ${canAdvance ? '' : 'disabled'}>Advance status</button>
            <button type="button" class="ghost-btn small" data-cancel-booking-id="${booking.bookingId}" ${booking.status === 'Canceled' ? 'disabled' : ''}>Cancel</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function advanceBooking(bookingId) {
  const booking = bookings.find((item) => item.bookingId === bookingId);
  if (!booking) {
    return;
  }

  const currentIndex = STATUS_FLOW.indexOf(booking.status);
  if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) {
    return;
  }

  booking.status = STATUS_FLOW[currentIndex + 1];
  saveBookings();
  renderBookings();
  setFeedback(`Booking ${booking.bookingId} updated to ${booking.status}.`, 'success');
}

function cancelBooking(bookingId) {
  const booking = bookings.find((item) => item.bookingId === bookingId);
  if (!booking || booking.status === 'Canceled') {
    return;
  }

  booking.status = 'Canceled';
  saveBookings();
  renderBookings();
  renderPopularRoutes();
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  setFeedback(`Booking ${booking.bookingId} was canceled.`, 'error');
}

function setupSmoothScrollButtons() {
  const buttons = document.querySelectorAll('[data-scroll-target]');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.scrollTarget);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function setupActions() {
  resultContainer.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-book-trip-id]');
    if (trigger) {
      createBooking(trigger.dataset.bookTripId);
    }
  });

  bookingsList.addEventListener('click', (event) => {
    const advanceButton = event.target.closest('[data-advance-booking-id]');
    if (advanceButton) {
      advanceBooking(advanceButton.dataset.advanceBookingId);
      return;
    }

    const cancelButton = event.target.closest('[data-cancel-booking-id]');
    if (cancelButton) {
      cancelBooking(cancelButton.dataset.cancelBookingId);
    }
  });

  clearBookingsButton.addEventListener('click', () => {
    bookings = [];
    saveBookings();
    renderBookings();
    renderPopularRoutes();
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    setFeedback('All bookings cleared.', 'neutral');
  });
}

renderPopularRoutes();
renderBookings();
setupSmoothScrollButtons();
setupActions();
form.addEventListener('submit', searchTrips);
form.dispatchEvent(new Event('submit', { cancelable: true }));
