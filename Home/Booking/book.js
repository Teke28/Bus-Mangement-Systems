(() => {
  'use strict';

  // =========================
  // CONFIG
  // =========================
  const API_BASE_URL = 'http://localhost:5000/api';

  // =========================
  // HELPERS
  // =========================
  const $ = (sel, root = document) => {
    try { return root.querySelector(sel); }
    catch (e) { console.error(`Selector error: ${sel}`, e); return null; }
  };

  const $$ = (sel, root = document) => {
    try { return Array.from((root || document).querySelectorAll(sel)); }
    catch (e) { console.error(`Selector error: ${sel}`, e); return []; }
  };

  const on = (el, ev, fn, opts) => {
    if (el && typeof fn === 'function') el.addEventListener(ev, fn, opts);
  };

  const create = (tag, attrs = {}, text = '') => {
    try {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => {
        if (v !== undefined && v !== null) el.setAttribute(k, v);
      });
      if (text) el.textContent = text;
      return el;
    } catch (e) {
      console.error('Element creation error:', e);
      return document.createTextNode('');
    }
  };

  const formatCurrency = (v) => {
    const n = Number(v);
    return isFinite(n) ? `$${n.toFixed(2)}` : '$0.00';
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const showLoading = (show = true) => {
    const overlay = $('#loadingOverlay');
    if (!overlay) return;
    if (show) {
      overlay.removeAttribute('hidden');
      overlay.setAttribute('aria-busy', 'true');
    } else {
      overlay.setAttribute('hidden', 'true');
      overlay.setAttribute('aria-busy', 'false');
    }
  };

  function trapFocus(modal) {
    if (!modal) return () => {};
    const focusables = modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return () => {};
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    setTimeout(() => first?.focus(), 50);
    function handleKeydown(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    modal.addEventListener('keydown', handleKeydown);
    return () => modal.removeEventListener('keydown', handleKeydown);
  }

  // =========================
  // TOASTS (fixed & complete)
  // =========================
  function showToast(message, type = 'info') {
    if (!message) return;

    // Remove existing toasts cleanly
    $$('.toast').forEach(t => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 200);
    });

    const toast = create('div', {
      class: `toast toast-${type}`,
      role: 'alert',
      'aria-live': 'assertive',
      'aria-atomic': 'true'
    }, message);

    document.body.appendChild(toast);

    // Force reflow for CSS transition
    void toast.offsetWidth;
    toast.classList.add('show');

    // Auto-dismiss
    const timeout = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 200);
    }, 4000);

    // Manual dismiss
    toast._timeout = timeout;
    on(toast, 'click', () => {
      clearTimeout(toast._timeout);
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 200);
    });
  }

  // =========================
  // MOBILE NAV
  // =========================
  function initMobileNav() {
    const mobileMenuBtn = $('#mobileMenuBtn');
    const mainNav = $('#mainNav');
    if (!mobileMenuBtn || !mainNav) return;

    function toggleNav(isOpen) {
      try {
        mainNav.setAttribute('aria-hidden', String(!isOpen));
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
        mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
        if (isOpen) {
          const firstFocusable = mainNav.querySelector(
            'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          setTimeout(() => firstFocusable?.focus(), 50);
        }
      } catch (e) {
        console.error('Mobile nav toggle error:', e);
      }
    }

    on(mobileMenuBtn, 'click', () => {
      const isOpen = mainNav.getAttribute('aria-hidden') === 'false';
      toggleNav(!isOpen);
    });

    $$('.nav-link', mainNav).forEach(link => {
      on(link, 'click', (e) => {
        if (window.innerWidth <= 640) {
          e.preventDefault();
          toggleNav(false);
          setTimeout(() => { window.location.href = link.href; }, 250);
        }
      });
    });

    on(document, 'click', (e) => {
      if (mainNav.getAttribute('aria-hidden') === 'false' &&
          !mainNav.contains(e.target) &&
          e.target !== mobileMenuBtn) {
        toggleNav(false);
      }
    });

    on(window, 'resize', () => {
      if (window.innerWidth > 640 && mainNav.getAttribute('aria-hidden') === 'false') {
        toggleNav(false);
      }
    });
  }

  // =========================
  // SEARCH TABS
  // =========================
  function initSearchTabs() {
    const tabs = $$('.search-tab');
    const forms = $$('.search-form');
    if (!tabs.length || !forms.length) return;

    let currentActiveTab = null;

    function activateTab(tabBtn) {
      if (!tabBtn) return;
      try {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        forms.forEach(f => {
          f.classList.remove('active');
          f.hidden = true;
        });
        const target = tabBtn.dataset.target;
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
        currentActiveTab = tabBtn;

        const form = $(`#${target}`);
        if (form) {
          form.classList.add('active');
          form.hidden = false;
          const firstInput = form.querySelector('input, select');
          if (firstInput) setTimeout(() => firstInput?.focus(), 100);
        }
      } catch (e) {
        console.error('Tab activation error:', e);
      }
    }

    tabs.forEach(t => on(t, 'click', () => activateTab(t)));

    function initTabFromHash() {
      try {
        const hash = window.location.hash;
        if (!hash) { activateTab(tabs[0]); return; }
        const btn = tabs.find(t =>
          `#${t.dataset.target}` === hash ||
          `#${t.dataset.target}` === hash.replace('#tab-', '#')
        );
        if (btn) activateTab(btn);
        else activateTab(tabs[0]);
      } catch (e) {
        console.error('Hash tab init error:', e);
        activateTab(tabs[0]);
      }
    }

    initTabFromHash();
    on(window, 'hashchange', initTabFromHash);

    setTimeout(() => {
      if (!currentActiveTab && tabs.length) activateTab(tabs[0]);
    }, 400);
  }

  // =========================
  // SEARCH FORMS
  // =========================
  function initSearchForms() {
    const oneWayForm = $('#one-way-form');
    const viewPopularBtn = $('#viewPopularBtn');

    if (oneWayForm) {
      on(oneWayForm, 'submit', (e) => {
        e.preventDefault();
        const fromCity = $('#fromCity');
        const toCity = $('#toCity');
        const departureDate = $('#departureDate');
        const passengers = $('#passengers');

        if (!fromCity?.value) { showToast('Please select a departure location', 'error'); fromCity?.focus(); return; }
        if (!toCity?.value) { showToast('Please select a destination', 'error'); toCity?.focus(); return; }
        if (fromCity.value === toCity.value) { showToast('Departure and destination cannot be the same', 'error'); fromCity.focus(); return; }
        if (!departureDate?.value) { showToast('Please select a departure date', 'error'); departureDate?.focus(); return; }
        if (!passengers?.value) { showToast('Please select number of passengers', 'error'); passengers?.focus(); return; }

        showLoading(true);
        setTimeout(() => {
          showLoading(false);
          $('#routes')?.scrollIntoView({ behavior: 'smooth' });
          showToast('Search completed! Showing available routes', 'success');
        }, 900);
      });
    }

    if (viewPopularBtn) {
      on(viewPopularBtn, 'click', () => {
        $('#routes')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // =========================
  // POPULAR ROUTES (with backend fallback)
  // =========================
  function initPopularRoutes() {
    const popularRoutesEl = $('#popularRoutes');
    const quickBookBtn = $('#quickBookBtn');
    if (!popularRoutesEl) return;

    const sampleRoutes = [
      { id: 'r1', title: 'Mercato ↔ Saris', price: 20, duration: '1h 10m', type: 'Luxury', ac: true, departure: '08:00 AM', arrival: '09:10 AM' },
      { id: 'r2', title: 'Ayat ↔ Megenagna', price: 10, duration: '1h 10m', type: 'Standard', ac: true, departure: '07:30 AM', arrival: '08:40 AM' },
      { id: 'r3', title: 'Bole ↔ CMC', price: 8, duration: '0h 50m', type: 'Standard', ac: true, departure: '06:45 AM', arrival: '07:35 AM' },
      { id: 'r4', title: 'Arat Kilo ↔ Mexico', price: 25, duration: '01h 05m', type: 'Luxury', ac: true, departure: '07:00 AM', arrival: '08:05 AM' }
    ];

    window.sampleRoutes = sampleRoutes;
    let selectedRouteId = null;

    function mapBackendBusToRoute(bus) {
      return {
        id: String(bus.id ?? bus._id ?? cryptoRandomId()),
        title: bus.title ?? `${bus.from ?? 'From'} ↔ ${bus.to ?? 'To'}`,
        price: bus.price ?? bus.fare ?? 0,
        duration: bus.duration ?? (bus.eta ? `${bus.eta}m` : 'N/A'),
        type: bus.type ?? (bus.ac ? 'Luxury' : 'Standard'),
        ac: Boolean(bus.ac ?? true),
        departure: bus.departureTime ?? 'N/A',
        arrival: bus.arrivalTime ?? 'N/A'
      };
    }

    function cryptoRandomId() {
      try {
        return `r_${crypto.getRandomValues(new Uint32Array(1))[0].toString(16)}`;
      } catch {
        return `r_${Math.floor(Math.random() * 1e9)}`;
      }
    }

    function renderRoutes(list) {
      try {
        popularRoutesEl.innerHTML = '';
        if (!list || !list.length) {
          popularRoutesEl.innerHTML = '<div class="empty-message" aria-live="polite">No popular routes found.</div>';
          return;
        }

        list.forEach(route => {
          if (!route || !route.id) return;
          const card = create('article', {
            class: 'route-card',
            'aria-labelledby': `route-title-${route.id}`,
            'data-route-id': route.id
          });

          card.innerHTML = `
            <div class="route-header">
              <i class="fas fa-route" aria-hidden="true"></i>
              <strong id="route-title-${route.id}">${route.title || 'Unknown Route'}</strong>
            </div>
            <div class="route-body">
              <div class="route-price">${formatCurrency(route.price || 0)}</div>
              <ul class="route-details">
                <li>${route.duration || 'N/A'} • ${route.type || 'Standard'}</li>
                <li>${route.ac ? '<i class="fas fa-snowflake" aria-hidden="true"></i> AC' : ''}</li>
                <li><small>Dep: ${route.departure || 'N/A'} • Arr: ${route.arrival || 'N/A'}</small></li>
              </ul>
              <div class="route-actions">
                <button class="btn btn-primary btn-open-seat" data-route="${route.id}" aria-label="Select seats for ${route.title || 'this route'}">
                  Select Seats
                </button>
                <button class="btn btn-ghost btn-quick-book" data-route="${route.id}" aria-label="Quick book for ${route.title || 'this route'}">
                  Quick Book
                </button>
              </div>
            </div>
          `;
          popularRoutesEl.appendChild(card);
        });

        $$('.route-card', popularRoutesEl).forEach(card => {
          on(card, 'click', (e) => {
            if (!e.target.closest('.btn')) {
              selectRoute(card.dataset.routeId);
            }
          });
        });

        $$('.btn-quick-book', popularRoutesEl).forEach(btn => {
          on(btn, 'click', (e) => {
            e.stopPropagation();
            quickBookRoute(btn.dataset.route);
          });
        });
      } catch (e) {
        console.error('Route rendering error:', e);
        popularRoutesEl.innerHTML = '<div class="error-message" aria-live="polite">Error loading routes. Please try again.</div>';
      }
    }

    function selectRoute(routeId) {
      if (!routeId) return;
      if (selectedRouteId === routeId) {
        selectedRouteId = null;
        $$('.route-card', popularRoutesEl).forEach(card => card.classList.remove('selected'));
        if (quickBookBtn) quickBookBtn.style.display = 'none';
      } else {
        selectedRouteId = routeId;
        $$('.route-card', popularRoutesEl).forEach(card => {
          if (card.dataset.routeId === routeId) card.classList.add('selected');
          else card.classList.remove('selected');
        });
        if (quickBookBtn) quickBookBtn.style.display = 'flex';
      }
    }

    function quickBookRoute(routeId) {
      const route = (window.sampleRoutes || []).find(r => r.id === routeId);
      if (!route) return;
      showLoading(true);
      setTimeout(() => {
        showLoading(false);
        window.openSeatModal?.(routeId);
      }, 600);
    }

    if (quickBookBtn) {
      quickBookBtn.style.display = 'none';
      on(quickBookBtn, 'click', () => {
        if (selectedRouteId) quickBookRoute(selectedRouteId);
      });
    }

    // Initial load
    async function loadRoutes() {
      showLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/buses`, { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.buses || []);
        if (!Array.isArray(list) || !list.length) {
          renderRoutes(sampleRoutes);
          showToast('No routes from backend. Showing samples.', 'info');
          return;
        }
        const normalized = list.map(mapBackendBusToRoute);
        window.sampleRoutes = normalized;
        renderRoutes(normalized);
      } catch (e) {
        console.warn('Backend unavailable, using sample routes.', e);
        renderRoutes(sampleRoutes);
        showToast('Backend unavailable. Showing sample routes.', 'info');
      } finally {
        showLoading(false);
      }
    }

    loadRoutes();
  }

  // =========================
  // SEAT SELECTION & BOOKING
  // =========================
  function initSeatSelection() {
    const seatModal = $('#seatModal');
    const modalClose = $('#modalClose');
    const seatsGrid = $('#seatsGrid');
    const cancelBookingBtn = $('#cancelBooking');
    const confirmBookingBtn = $('#confirmBooking');
    const modalRouteEl = $('#modalRoute');
    const modalDateEl = $('#modalDate');
    const modalTimeEl = $('#modalTime');
    const modalBusTypeEl = $('#modalBusType');
    const passengerForm = $('#passengerForm');

    if (!seatModal || !seatsGrid) return;

    let currentRoute = null;
    let seatsState = [];
    let selectedSeats = [];
    let releaseTrapFocus = () => {};
    const fallbackSeatPrice = 10;

    function lockBodyScroll(lock = true) {
      try {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (lock) {
          document.body.style.overflow = 'hidden';
          if (scrollbarWidth > 0) document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
        } else {
          document.body.style.overflow = '';
          document.documentElement.style.paddingRight = '';
        }
      } catch (e) { console.error('Scroll lock error:', e); }
    }

    function generateSeats(rows = 10, cols = 4) {
      try {
        const seats = [];
        const letters = ['A', 'B', 'C', 'D'];
        for (let r = 1; r <= rows; r++) {
          for (let c = 0; c < cols; c++) {
            const id = `${r}${letters[c]}`;
            const isBooked = Math.random() < 0.12;
            seats.push({ id, status: isBooked ? 'booked' : 'available' });
          }
        }
        return seats;
      } catch { return []; }
    }

    function openSeatModal(routeId) {
      try {
        const route = (window.sampleRoutes || []).find(r => r.id === routeId) || {};
        currentRoute = route;
        modalRouteEl.textContent = route.title || 'Unknown Route';
        modalDateEl.textContent = formatDate(new Date());
        modalTimeEl.textContent = route.departure || 'N/A';
        modalBusTypeEl.textContent = route.type || 'Standard';

        seatsState = generateSeats();
        selectedSeats = [];
        renderSeats();
        renderPassengerFields();

        seatModal.removeAttribute('hidden');
        seatModal.setAttribute('aria-hidden', 'false');
        lockBodyScroll(true);
        releaseTrapFocus = trapFocus(seatModal);
        setTimeout(() => modalClose?.focus(), 50);
      } catch (e) {
        console.error('Seat modal open error:', e);
        showToast('Error opening seat selection. Please try again.', 'error');
      }
    }

    function closeSeatModal() {
      try {
        seatModal.setAttribute('aria-hidden', 'true');
        seatModal.setAttribute('hidden', 'true');
        lockBodyScroll(false);
        releaseTrapFocus?.();
      } catch (e) { console.error('Seat modal close error:', e); }
    }

    function renderSeats() {
      try {
        seatsGrid.innerHTML = '';
        if (!seatsState.length) {
          seatsGrid.innerHTML = '<p class="error-message">No seats available.</p>';
          return;
        }
        seatsState.forEach(seat => {
          const seatEl = create('button', {
            type: 'button',
            'data-id': seat.id,
            'aria-pressed': 'false',
            'aria-label': `Seat ${seat.id} - ${seat.status === 'booked' ? 'Booked' : 'Available'}`,
            class: `seat ${seat.status === 'booked' ? 'booked' : 'available'}`,
            ...(seat.status === 'booked' ? { disabled: 'true' } : {})
          });
          seatEl.innerHTML = `<small>${seat.id}</small>`;
          if (seat.status !== 'booked') on(seatEl, 'click', () => toggleSeatSelection(seat.id));
          seatsGrid.appendChild(seatEl);
        });
      } catch (e) {
        console.error('Seat rendering error:', e);
        seatsGrid.innerHTML = '<p class="error-message">Error loading seats.</p>';
      }
    }

    function toggleSeatSelection(id) {
      try {
        const seat = seatsState.find(s => s.id === id);
        if (!seat || seat.status === 'booked') return;
        const idx = selectedSeats.indexOf(id);
        if (idx === -1) selectedSeats.push(id);
        else selectedSeats.splice(idx, 1);

        $$('.seat', seatsGrid).forEach(btn => {
          const btnId = btn.dataset.id;
          const isSelected = selectedSeats.includes(btnId);
          btn.classList.toggle('selected', isSelected);
          btn.setAttribute('aria-pressed', String(isSelected));
        });

        renderPassengerFields();
      } catch (e) { console.error('Seat selection error:', e); }
    }

    function renderPassengerFields() {
      if (!passengerForm) return;
      try {
        passengerForm.innerHTML = '';
        if (!selectedSeats.length) {
          passengerForm.innerHTML = `<p class="muted" aria-live="polite">Please select seats to add passenger details.</p>`;
          return;
        }
        selectedSeats.forEach((seatId, i) => {
          const row = create('div', { class: 'row' });
          row.innerHTML = `
            <div class="form-group">
              <label for="name_${i}">Passenger ${i + 1} (Seat ${seatId})</label>
              <input id="name_${i}" name="name_${i}" type="text" placeholder="Full name" required aria-required="true" minlength="2">
            </div>
            <div class="form-group">
              <label for="phone_${i}">Phone</label>
              <input id="phone_${i}" name="phone_${i}" type="tel" placeholder="Phone number" required aria-required="true" pattern="[0-9]{10,15}" title="Please enter a valid phone number (10-15 digits)">
            </div>
          `;
          passengerForm.appendChild(row);
        });
      } catch (e) {
        console.error('Passenger form error:', e);
        passengerForm.innerHTML = '<p class="error-message">Error loading passenger form.</p>';
      }
    }

    function validatePassengerForm() {
      if (!passengerForm) return false;
      let isValid = true;
      const inputs = passengerForm.querySelectorAll('input');
      inputs.forEach(input => {
        if (!input) return;
        let inputValid = true;
        const val = input.value.trim();
        if (input.required && !val) inputValid = false;
        else if (input.type === 'tel' && !/^[0-9]{10,15}$/.test(val)) inputValid = false;
        else if (input.minLength && val.length < input.minLength) inputValid = false;

        input.classList.toggle('invalid', !inputValid);
        input.setAttribute('aria-invalid', String(!inputValid));
        if (!inputValid) isValid = false;
      });
      return isValid;
    }

    async function tryCreateBookingOnBackend(payload) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
      } catch (e) {
        console.warn('Backend booking failed, using local confirmation.', e);
        return null;
      }
    }

    function confirmBooking() {
      try {
        if (!selectedSeats.length) { showToast('Please select at least one seat to continue.', 'error'); return; }
        if (!validatePassengerForm()) { showToast('Please fill all passenger details correctly.', 'error'); return; }

        showLoading(true);

        setTimeout(async () => {
          try {
            // Build payload
            const passengers = Array.from(passengerForm.querySelectorAll('.row')).map((row, i) => ({
              seat: selectedSeats[i],
              name: row.querySelector(`#name_${i}`)?.value.trim(),
              phone: row.querySelector(`#phone_${i}`)?.value.trim()
            }));
            const seatPrice = Number(currentRoute?.price ?? fallbackSeatPrice);
            const total = selectedSeats.length * (isFinite(seatPrice) ? seatPrice : fallbackSeatPrice);

            // Attempt backend booking (optional)
            const backendResp = await tryCreateBookingOnBackend({
              routeId: currentRoute?.id,
              seats: selectedSeats,
              passengers,
              date: new Date().toISOString(),
              pricePerSeat: seatPrice
            });

            const bookingId = backendResp?.bookingId || `SR-${Math.floor(Math.random() * 900000 + 100000)}`;

            // Update local seat state
            seatsState.forEach(s => { if (selectedSeats.includes(s.id)) s.status = 'booked'; });

            // Populate confirmation
            $('#confirmationId').textContent = bookingId;
            $('#confirmationRoute').textContent = currentRoute?.title || 'Unknown Route';
            $('#confirmationDate').textContent = $('#modalDate')?.textContent || formatDate(new Date());
            $('#confirmationTime').textContent = $('#modalTime')?.textContent || 'N/A';
            $('#confirmationSeats').textContent = selectedSeats.join(', ');
            $('#confirmationTotal').textContent = formatCurrency(total);

            closeSeatModal();
            window.openConfirmationModal?.();
            showToast('Booking confirmed successfully!', 'success');
          } catch (e) {
            console.error('Booking confirmation error:', e);
            showToast('Error confirming booking. Please try again.', 'error');
            showLoading(false);
          }
        }, 500);
      } catch (e) {
        console.error('Booking error:', e);
        showLoading(false);
        showToast('An error occurred. Please try again.', 'error');
      }
    }

    // Events
    on(document, 'click', (e) => {
      const openSeatBtn = e.target.closest('.btn-open-seat');
      if (openSeatBtn?.dataset.route) openSeatModal(openSeatBtn.dataset.route);
    });
    on(modalClose, 'click', closeSeatModal);
    on(cancelBookingBtn, 'click', closeSeatModal);
    on(confirmBookingBtn, 'click', confirmBooking);

    on(seatModal, 'click', (e) => { if (e.target === seatModal) closeSeatModal(); });

    // Expose globally for other modules
    window.openSeatModal = openSeatModal;
    window.closeSeatModal = closeSeatModal;
  }

  // =========================
  // CONFIRMATION MODAL
  // =========================
  function initConfirmationModal() {
    const confirmationModal = $('#confirmationModal');
    const printTicketBtn = $('#printTicket');
    const closeConfirmation = $('#closeConfirmation');
    if (!confirmationModal) return;

    let releaseTrapFocus = () => {};

    function openConfirmationModal() {
      try {
        confirmationModal.removeAttribute('hidden');
        confirmationModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const sw = window.innerWidth - document.documentElement.clientWidth;
        if (sw > 0) document.documentElement.style.paddingRight = `${sw}px`;
        releaseTrapFocus = trapFocus(confirmationModal);
        setTimeout(() => printTicketBtn?.focus(), 50);
      } catch (e) { console.error('Confirmation modal open error:', e); }
    }

    function closeConfirmationModal() {
      try {
        confirmationModal.setAttribute('hidden', 'true');
        confirmationModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        document.documentElement.style.paddingRight = '';
        releaseTrapFocus?.();
      } catch (e) { console.error('Confirmation modal close error:', e); }
    }

    on(printTicketBtn, 'click', () => {
      try { window.print(); }
      catch (e) { console.error('Print error:', e); showToast('Error printing ticket. Please try again.', 'error'); }
    });
    on(closeConfirmation, 'click', closeConfirmationModal);

    window.openConfirmationModal = openConfirmationModal;
    window.closeConfirmationModal = closeConfirmationModal;
  }

  // =========================
  // NEWSLETTER
  // =========================
  function initNewsletterForm() {
    const newsletterForm = $('#newsletterForm');
    if (!newsletterForm) return;

    on(newsletterForm, 'submit', (e) => {
      e.preventDefault();
      const emailInput = $('#newsletterEmail');
      if (!emailInput) return;

      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email || !emailRegex.test(email)) {
        emailInput.classList.add('invalid');
        emailInput.setAttribute('aria-invalid', 'true');
        if (!$('#newsletterError')) {
          const err = create('div', { id: 'newsletterError', class: 'error-message', 'aria-live': 'assertive' }, 'Please enter a valid email address.');
          emailInput.parentNode.appendChild(err);
        }
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      showLoading(true);
      setTimeout(() => {
        try {
          $('#newsletterError')?.remove();
          newsletterForm.reset();
          emailInput.classList.remove('invalid');
          emailInput.setAttribute('aria-invalid', 'false');
          showToast('Thanks for subscribing!', 'success');
        } catch (e) {
          console.error('Newsletter error:', e);
          showToast('Subscription failed. Please try again.', 'error');
        } finally {
          showLoading(false);
        }
      }, 600);
    });

    on($('#newsletterEmail'), 'input', function () {
      this.classList.remove('invalid');
      this.setAttribute('aria-invalid', 'false');
      $('#newsletterError')?.remove();
    });
  }

  // =========================
  // INIT
  // =========================
  function init() {
    try {
      // Current year
      const yearEl = $('#currentYear');
      if (yearEl) yearEl.textContent = new Date().getFullYear();

      // Hide loading overlay after initial paint
      setTimeout(() => { $('#loadingOverlay')?.setAttribute('hidden', 'true'); }, 400);

      // Components
      initMobileNav();
      initSearchTabs();
      initSearchForms();
      initPopularRoutes();
      initSeatSelection();
      initConfirmationModal();
      initNewsletterForm();

      // Global ESC handler
      on(document, 'keydown', (e) => {
        if (e.key === 'Escape') {
          if ($('#seatModal')?.getAttribute('aria-hidden') === 'false') window.closeSeatModal?.();
          if ($('#confirmationModal')?.getAttribute('aria-hidden') === 'false') window.closeConfirmationModal?.();
        }
      });

      // Reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('reduced-motion');
      }

      // Scroll reveal
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        $$('.feature-card, .route-card, .testimonial-card, .section-title').forEach(el => {
          if (el) {
            el.classList.add('scroll-reveal');
            observer.observe(el);
          }
        });
      } else {
        $$('.scroll-reveal').forEach(el => el?.classList.add('visible'));
      }
    } catch (e) {
      console.error('Initialization error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
})();