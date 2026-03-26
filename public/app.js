const TOTAL_DAYS = 7;

const customers = [
  { name: 'Atlas Retail', style: 'cost', laneBias: 'regional' },
  { name: 'BlueRidge Foods', style: 'service', laneBias: 'reefer' },
  { name: 'Copperline Manufacturing', style: 'balanced', laneBias: 'industrial' },
  { name: 'Delta Medical', style: 'service', laneBias: 'expedite' },
  { name: 'Elm Street Home', style: 'cost', laneBias: 'retail' },
  { name: 'Frontier Auto Parts', style: 'balanced', laneBias: 'automotive' },
  { name: 'Granite Paper Co.', style: 'cost', laneBias: 'dryvan' },
  { name: 'Harbor Fresh', style: 'service', laneBias: 'reefer' },
  { name: 'Iron Peak Building', style: 'balanced', laneBias: 'flatbed' },
  { name: 'Juniper Wellness', style: 'service', laneBias: 'expedite' }
];

const lanes = [
  { name: 'Atlanta to Chicago', miles: 715, type: 'dryvan', baseRate: 2650 },
  { name: 'Dallas to Phoenix', miles: 1065, type: 'dryvan', baseRate: 3025 },
  { name: 'Nashville to Miami', miles: 910, type: 'reefer', baseRate: 3280 },
  { name: 'Charlotte to Detroit', miles: 640, type: 'automotive', baseRate: 2410 },
  { name: 'Savannah to Memphis', miles: 525, type: 'retail', baseRate: 2185 },
  { name: 'Birmingham to Denver', miles: 1280, type: 'industrial', baseRate: 3760 },
  { name: 'Houston to St. Louis', miles: 810, type: 'flatbed', baseRate: 2890 },
  { name: 'Richmond to Newark', miles: 340, type: 'expedite', baseRate: 1960 },
  { name: 'Orlando to Columbus', miles: 920, type: 'reefer', baseRate: 3190 },
  { name: 'Kansas City to Minneapolis', miles: 440, type: 'dryvan', baseRate: 2050 }
];

const carriers = [
  { id: 'trilane', name: 'TriLane Freight', onTime: 95, rateIndex: 84, claims: 2, responsiveness: 89, capacity: 4, specialty: 'dryvan' },
  { id: 'aurora', name: 'Aurora Transit', onTime: 92, rateIndex: 87, claims: 1, responsiveness: 93, capacity: 3, specialty: 'expedite' },
  { id: 'ridgeway', name: 'Ridgeway Logistics', onTime: 88, rateIndex: 78, claims: 4, responsiveness: 82, capacity: 5, specialty: 'flatbed' },
  { id: 'coldchain', name: 'ColdChain Plus', onTime: 97, rateIndex: 91, claims: 1, responsiveness: 86, capacity: 3, specialty: 'reefer' },
  { id: 'meridian', name: 'Meridian Cargo', onTime: 90, rateIndex: 75, claims: 3, responsiveness: 80, capacity: 6, specialty: 'retail' },
  { id: 'highline', name: 'Highline Carriers', onTime: 85, rateIndex: 70, claims: 5, responsiveness: 78, capacity: 5, specialty: 'industrial' }
];

const state = {
  day: 0,
  totals: {
    revenue: 0,
    margin: 0,
    service: 0,
    covered: 0,
    score: 0
  },
  currentLoads: [],
  assignments: {},
  dayLog: [],
  dailyCarrierCapacity: {}
};

const elements = {
  startGame: document.getElementById('start-game'),
  nextDay: document.getElementById('next-day'),
  dayLabel: document.getElementById('day-label'),
  revenueValue: document.getElementById('revenue-value'),
  marginValue: document.getElementById('margin-value'),
  serviceValue: document.getElementById('service-value'),
  coverageValue: document.getElementById('coverage-value'),
  scoreValue: document.getElementById('score-value'),
  statusTicker: document.getElementById('status-ticker'),
  loadList: document.getElementById('load-list'),
  carrierList: document.getElementById('carrier-list'),
  activityLog: document.getElementById('activity-log')
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(list) {
  return list[randomInt(0, list.length - 1)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function describePriority(style) {
  if (style === 'service') return 'Protect service and recover premium freight.';
  if (style === 'cost') return 'Defend margin with disciplined carrier spend.';
  return 'Balance service, speed, and cost across the network.';
}

function buildDailyLoads(day) {
  const loadCount = randomInt(3, 5);
  const chosenLoads = [];

  for (let index = 0; index < loadCount; index += 1) {
    const customer = randomChoice(customers);
    const lane = randomChoice(lanes);
    const urgency = randomInt(1, 3);
    const difficulty = randomInt(1, 3);
    const customerRate = lane.baseRate + urgency * 180 + randomInt(-120, 260);

    chosenLoads.push({
      id: `day${day}-load${index + 1}`,
      customerName: customer.name,
      customerStyle: customer.style,
      lane: lane.name,
      laneType: lane.type,
      miles: lane.miles,
      urgency,
      difficulty,
      customerRate,
      notes: describePriority(customer.style)
    });
  }

  return chosenLoads;
}

function resetCarrierCapacity() {
  state.dailyCarrierCapacity = Object.fromEntries(
    carriers.map((carrier) => [carrier.id, carrier.capacity])
  );
}

function carrierMatchScore(load, carrier) {
  const specialtyBoost = carrier.specialty === load.laneType ? 8 : 0;
  const urgencyBoost = load.urgency === 3 ? carrier.responsiveness * 0.12 : 0;
  const serviceFit = load.customerStyle === 'service' ? carrier.onTime * 0.35 : carrier.onTime * 0.22;
  const costFit = load.customerStyle === 'cost' ? carrier.rateIndex * 0.35 : carrier.rateIndex * 0.24;
  const claimPenalty = carrier.claims * 4;
  return Math.round(serviceFit + costFit + specialtyBoost + urgencyBoost - claimPenalty);
}

function estimateCarrierCost(load, carrier) {
  const specialtyDiscount = carrier.specialty === load.laneType ? 120 : 0;
  const urgencyPremium = load.urgency * 90;
  const difficultyPremium = load.difficulty * 70;
  const base = load.customerRate * (carrier.rateIndex / 100);
  return Math.round(base + urgencyPremium + difficultyPremium - specialtyDiscount);
}

function getSelectedCarrier(loadId) {
  return carriers.find((carrier) => carrier.id === state.assignments[loadId]) || null;
}

function updateScoreboard() {
  elements.dayLabel.textContent = state.day === 0 ? 'Not started' : `Day ${state.day} of ${TOTAL_DAYS}`;
  elements.revenueValue.textContent = formatCurrency(state.totals.revenue);
  elements.marginValue.textContent = formatCurrency(state.totals.margin);
  elements.serviceValue.textContent = Math.round(state.totals.service).toString();
  elements.coverageValue.textContent = state.totals.covered.toString();
  elements.scoreValue.textContent = Math.round(state.totals.score).toString();
}

function renderCarriers() {
  elements.carrierList.innerHTML = '';

  carriers.forEach((carrier) => {
    const remaining = state.dailyCarrierCapacity[carrier.id] ?? carrier.capacity;
    const card = document.createElement('article');
    card.className = 'carrier-card';
    card.innerHTML = `
      <header>
        <div>
          <h3>${carrier.name}</h3>
          <p class="carrier-meta">Specialty: <span class="carrier-highlight">${carrier.specialty}</span></p>
        </div>
        <span class="load-pill">Capacity ${remaining}/${carrier.capacity}</span>
      </header>
      <div class="carrier-kpis">
        <span class="kpi-badge">On-time ${carrier.onTime}%</span>
        <span class="kpi-badge">Rate Index ${carrier.rateIndex}</span>
        <span class="kpi-badge">Claims ${carrier.claims}%</span>
        <span class="kpi-badge">Response ${carrier.responsiveness}</span>
      </div>
    `;
    elements.carrierList.appendChild(card);
  });
}

function renderLoads() {
  if (!state.currentLoads.length) {
    elements.loadList.className = 'load-list empty-state';
    elements.loadList.textContent = 'All daily loads have been cleared.';
    return;
  }

  elements.loadList.className = 'load-list';
  elements.loadList.innerHTML = '';

  state.currentLoads.forEach((load) => {
    const selectedCarrier = getSelectedCarrier(load.id);
    const card = document.createElement('article');
    card.className = 'load-card';

    const options = carriers
      .map((carrier) => {
        const remaining = state.dailyCarrierCapacity[carrier.id] ?? carrier.capacity;
        const recommended = carrierMatchScore(load, carrier);
        const estimatedCost = estimateCarrierCost(load, carrier);
        return `
          <option value="${carrier.id}" ${selectedCarrier?.id === carrier.id ? 'selected' : ''}>
            ${carrier.name} | fit ${recommended} | cost ${formatCurrency(estimatedCost)} | cap ${remaining}
          </option>
        `;
      })
      .join('');

    card.innerHTML = `
      <header>
        <div>
          <h3>${load.customerName}</h3>
          <p class="load-meta">${load.lane}</p>
        </div>
        <span class="load-pill">${formatCurrency(load.customerRate)}</span>
      </header>
      <div class="load-pills">
        <span class="load-pill">${load.laneType}</span>
        <span class="load-pill">${load.miles} mi</span>
        <span class="load-pill">Urgency ${load.urgency}/3</span>
        <span class="load-pill">Complexity ${load.difficulty}/3</span>
      </div>
      <p class="load-meta">${load.notes}</p>
      <footer>
        <div>
          <span class="assignment">${selectedCarrier ? `Assigned to ${selectedCarrier.name}` : 'Awaiting assignment'}</span>
        </div>
        <div class="assign-controls">
          <select class="carrier-select" data-load-id="${load.id}">
            <option value="">Choose carrier</option>
            ${options}
          </select>
          <button class="button assign-button" data-assign-id="${load.id}">Assign</button>
        </div>
      </footer>
    `;

    elements.loadList.appendChild(card);
  });
}

function renderActivity() {
  elements.activityLog.innerHTML = '';
  if (!state.dayLog.length) {
    elements.activityLog.innerHTML = '<div class="activity-item muted">Waiting for brokerage activity.</div>';
    return;
  }

  state.dayLog
    .slice()
    .reverse()
    .forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <span class="activity-time">${entry.time}</span>
        <p>${entry.message}</p>
      `;
      elements.activityLog.appendChild(item);
    });
}

function addLog(message) {
  state.dayLog.push({
    time: `Day ${state.day}`,
    message
  });
  renderActivity();
}

function assignCarrier(loadId, carrierId) {
  const load = state.currentLoads.find((item) => item.id === loadId);
  const carrier = carriers.find((item) => item.id === carrierId);

  if (!load || !carrier) return;

  const currentCarrierId = state.assignments[loadId];
  if (currentCarrierId === carrierId) return;

  if ((state.dailyCarrierCapacity[carrierId] ?? 0) <= 0) {
    elements.statusTicker.textContent = `${carrier.name} is out of capacity today. Choose another carrier.`;
    return;
  }

  if (currentCarrierId) {
    state.dailyCarrierCapacity[currentCarrierId] += 1;
  }

  state.assignments[loadId] = carrierId;
  state.dailyCarrierCapacity[carrierId] -= 1;

  elements.statusTicker.textContent = `${load.customerName} assigned to ${carrier.name}. Review remaining loads and advance when ready.`;
  addLog(`Assigned ${carrier.name} to ${load.customerName} on ${load.lane}.`);
  renderCarriers();
  renderLoads();
}

function resolveDay() {
  const allAssigned = state.currentLoads.every((load) => Boolean(state.assignments[load.id]));

  if (!allAssigned) {
    elements.statusTicker.textContent = 'Every load needs a carrier before the day can close.';
    return;
  }

  let dayRevenue = 0;
  let dayMargin = 0;
  let dayService = 0;
  let dayScore = 0;

  state.currentLoads.forEach((load) => {
    const carrier = getSelectedCarrier(load.id);
    const fit = carrierMatchScore(load, carrier);
    const estimatedCost = estimateCarrierCost(load, carrier);
    const serviceResult = clamp(
      carrier.onTime +
        (carrier.specialty === load.laneType ? 3 : 0) +
        randomInt(-6, 4) -
        load.urgency,
      72,
      99
    );

    const margin = load.customerRate - estimatedCost;
    const score = Math.round(margin / 40 + fit + serviceResult - carrier.claims * 3);

    dayRevenue += load.customerRate;
    dayMargin += margin;
    dayService += serviceResult;
    dayScore += score;

    addLog(
      `${load.customerName}: ${carrier.name} delivered at ${serviceResult}% service with ${formatCurrency(
        margin
      )} margin.`
    );
  });

  state.totals.revenue += dayRevenue;
  state.totals.margin += dayMargin;
  state.totals.service += dayService;
  state.totals.covered += state.currentLoads.length;
  state.totals.score += dayScore;

  elements.statusTicker.textContent = `Day ${state.day} closed with ${formatCurrency(dayMargin)} margin and ${Math.round(
    dayService / state.currentLoads.length
  )} average service.`;

  if (state.day >= TOTAL_DAYS) {
    elements.nextDay.disabled = true;
    const finalRating =
      state.totals.score >= 1800 ? 'Elite brokerage week.' :
      state.totals.score >= 1350 ? 'Strong operating week.' :
      'Promising start with room to improve carrier selection.';
    addLog(`Week complete. ${finalRating}`);
    elements.statusTicker.textContent = `${finalRating} Final score: ${Math.round(state.totals.score)}. Start a new week to play again.`;
    state.currentLoads = [];
  } else {
    generateDay(state.day + 1);
  }

  updateScoreboard();
  renderCarriers();
  renderLoads();
}

function generateDay(day) {
  state.day = day;
  state.currentLoads = buildDailyLoads(day);
  state.assignments = {};
  resetCarrierCapacity();

  elements.nextDay.disabled = false;
  elements.statusTicker.textContent = `Day ${day} opened with ${state.currentLoads.length} customer loads. Match carriers based on KPI fit and capacity.`;
  addLog(`Day ${day} opened with ${state.currentLoads.length} incoming customers.`);
  updateScoreboard();
  renderCarriers();
  renderLoads();
}

function startGame() {
  state.day = 0;
  state.totals = {
    revenue: 0,
    margin: 0,
    service: 0,
    covered: 0,
    score: 0
  };
  state.currentLoads = [];
  state.assignments = {};
  state.dayLog = [];
  resetCarrierCapacity();

  elements.startGame.textContent = 'Restart Week';
  generateDay(1);
  renderActivity();
}

elements.startGame.addEventListener('click', startGame);
elements.nextDay.addEventListener('click', resolveDay);

elements.loadList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-assign-id]');
  if (!button) return;

  const loadId = button.getAttribute('data-assign-id');
  const select = elements.loadList.querySelector(`select[data-load-id="${loadId}"]`);
  if (!select || !select.value) {
    elements.statusTicker.textContent = 'Choose a carrier before assigning the load.';
    return;
  }

  assignCarrier(loadId, select.value);
});

updateScoreboard();
renderCarriers();
renderLoads();
renderActivity();
