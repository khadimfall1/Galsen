const trips = [
  {
    from: 'Milan',
    to: 'Dakar',
    date: '2026-04-18',
    courier: 'Fatou Ndiaye',
    rating: 4.9,
    capacityKg: 10,
    basePrice: 35,
    verified: true,
  },
  {
    from: 'Rome',
    to: 'Dakar',
    date: '2026-04-19',
    courier: 'Mamadou Sarr',
    rating: 4.8,
    capacityKg: 20,
    basePrice: 40,
    verified: true,
  },
  {
    from: 'Turin',
    to: 'Dakar',
    date: '2026-04-20',
    courier: 'Awa Diop',
    rating: 4.7,
    capacityKg: 20,
    basePrice: 38,
    verified: true,
  },
  {
    from: 'Bologna',
    to: 'Dakar',
    date: '2026-04-21',
    courier: 'Cheikh Ba',
    rating: 4.8,
    capacityKg: 10,
    basePrice: 36,
    verified: true,
  },
  {
    from: 'Milan',
    to: 'Dakar',
    date: '2026-04-22',
    courier: 'Meryem Fall',
    rating: 4.6,
    capacityKg: 10,
    basePrice: 44,
    verified: true,
  },
  {
    from: 'Milan',
    to: 'Thiès',
    date: '2026-04-23',
    courier: 'Ibrahima Kane',
    rating: 4.9,
    capacityKg: 20,
    basePrice: 46,
    verified: true,
  },
];

const packageWeightByType = {
  medium: 10,
  large: 20,
  documents: 2,
};

const routeGrid = document.querySelector('#route-grid');
const resultContainer = document.querySelector('#search-results');
const form = document.querySelector('#trip-search-form');
const averagePrice = document.querySelector('#average-price');

function toTitleCase(value) {
  return value
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeLocation(value) {
  const cityOnly = value.split(/[\-,]/)[0] || value;
  return cityOnly
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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
      return `
        <article class="route-card">
          <p>${route}</p>
          <h3>From €${minPrice}</h3>
          <span>${items.length} trusted travelers • frequent departures</span>
        </article>
      `;
    })
    .join('');
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

function renderResults(matches, packageType, from, to) {
  if (!matches.length) {
    resultContainer.innerHTML = `
      <p class="no-results">No traveler found for ${from} → ${to}. Try another date or nearby city.</p>
    `;
    averagePrice.innerHTML = `Average price ${from} → ${to} today: <strong>Not available</strong>`;
    return;
  }

  const pricedMatches = matches.map((trip) => ({
    ...trip,
    displayedPrice: buildPrice(trip.basePrice, packageType),
  }));

  const avgPrice = Math.round(
    pricedMatches.reduce((total, item) => total + item.displayedPrice, 0) /
      pricedMatches.length,
  );

  averagePrice.innerHTML = `Average price ${from} → ${to} today: <strong>€${avgPrice}</strong>`;

  resultContainer.innerHTML = pricedMatches
    .map(
      (trip) => `
        <article class="result-card">
          <div>
            <h3>${trip.courier}</h3>
            <p>${trip.from} → ${trip.to} • ${trip.date}</p>
          </div>
          <div class="result-meta">
            <span>⭐ ${trip.rating}</span>
            <span>${trip.capacityKg}kg max</span>
            <span class="price">€${trip.displayedPrice}</span>
          </div>
        </article>
      `,
    )
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
    const sameRoute =
      normalizeLocation(trip.from) === normalizedFrom &&
      normalizeLocation(trip.to) === normalizedTo;
    const availableDate = pickupDate ? trip.date >= pickupDate : true;
    const capacityOk = trip.capacityKg >= minCapacity;
    return sameRoute && availableDate && capacityOk;
  });

  renderResults(matches, packageType, from, to);
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

renderPopularRoutes();
setupSmoothScrollButtons();
form.addEventListener('submit', searchTrips);
form.dispatchEvent(new Event('submit'));
