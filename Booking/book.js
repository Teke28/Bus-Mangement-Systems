(() => {
      'use strict';

      // Utility helpers - Added null checks and better error handling
      const $ = (sel, root = document) => {
        try {
          return root.querySelector(sel);
        } catch (e) {
          console.error(`Selector error: ${sel}`, e);
          return null;
        }
      };
      
      const $$ = (sel, root = document) => {
        try {
          return Array.from((root || document).querySelectorAll(sel));
        } catch (e) {
          console.error(`Selector error: ${sel}`, e);
          return [];
        }
      };
      
      const on = (el, ev, fn, opts) => {
        if (el && typeof fn === 'function') {
          el.addEventListener(ev, fn, opts);
        }
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
      
      const formatCurrency = v => {
        try {
          return `$${Number(v).toFixed(2)}`;
        } catch (e) {
          console.error('Currency formatting error:', e);
          return `$${0.00}`;
        }
      };
      
      const formatDate = (date) => {
        try {
          return new Date(date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        } catch (e) {
          console.error('Date formatting error:', e);
          return 'Invalid date';
        }
      };

      // Accessibility: trap focus in modal - More robust implementation
      function trapFocus(modal) {
        if (!modal) return () => {};
        
        const focusables = modal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusables.length) return () => {};
        
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        
        // Focus first element when modal opens
        setTimeout(() => first?.focus(), 50);
        
        function handleKeydown(e) {
          if (e.key !== 'Tab') return;
          
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus(); 
          }
        }
        
        modal.addEventListener('keydown', handleKeydown);
        return () => {
          modal.removeEventListener('keydown', handleKeydown);
        };
      }

      // Show loading state - Added timeout cleanup
      function showLoading(show = true) {
        const overlay = $('#loadingOverlay');
        if (!overlay) return;
        
        if (show) {
          overlay.removeAttribute('hidden');
          overlay.setAttribute('aria-busy', 'true');
          
          // Ensure loading doesn't get stuck
          overlay._loadingTimeout = setTimeout(() => {
            overlay.setAttribute('hidden', 'true');
            overlay.setAttribute('aria-busy', 'false');
            console.warn('Loading timeout exceeded');
          }, 10000);
        } else {
          clearTimeout(overlay._loadingTimeout);
          overlay.setAttribute('hidden', 'true');
          overlay.setAttribute('aria-busy', 'false');
        }
      }

      // Mobile navigation - Fixed edge cases
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
              // Wait for animation to complete before navigating
              setTimeout(() => {
                window.location.href = link.href;
              }, 300);
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

      // Search tabs - More robust tab handling
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
              
              // Focus first input or select
              const firstInput = form.querySelector('input, select');
              if (firstInput) {
                setTimeout(() => {
                  try {
                    firstInput.focus();
                  } catch (e) {
                    console.error('Focus error:', e);
                  }
                }, 100);
              }
            }
          } catch (e) {
            console.error('Tab activation error:', e);
          }
        }
        
        tabs.forEach(t => on(t, 'click', () => activateTab(t)));
        
        function initTabFromHash() {
          try {
            const hash = window.location.hash;
            if (!hash) {
              activateTab(tabs[0]);
              return;
            }
            
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
        
        // Fallback if no tab is active
        setTimeout(() => {
          if (!currentActiveTab && tabs.length) {
            activateTab(tabs[0]);
          }
        }, 500);
      }

      // Demo: Load popular routes - Added error handling
      function initPopularRoutes() {
        const popularRoutesEl = $('#popularRoutes');
        if (!popularRoutesEl) return;
        
        const sampleRoutes = [
          {
            id: 'r1',
            title: 'Mercato ↔ Saris',
            price: 20,
            duration: '1h 10m',
            type: 'Luxury',
            ac: true,
            departure: '08:00 AM',
            arrival: '09:10 PM'
          },
          {
            id: 'r2',
            title: 'Ayat ↔ Megenagna',
            price: 10,
            duration: '1h 10m',
            type: 'Standard',
            ac: true,
            departure: '07:30 AM',
            arrival: '08:40 AM'
          },
          {
            id: 'r3',
            title: 'Bole ↔ CMC',
            price: 8.00,
            duration: '0h 50m',
            type: 'Standard',
            ac: true,
            departure: '06:45 AM',
            arrival: '07:35 AM'
          },
          {
            id: 'r4',
            title: 'Arat Kilo ↔ Mexico',
            price: 25.00,
            duration: '01h 05m',
            type: 'Luxury',
            ac: true,
            departure: '07:00 AM',
            arrival: '08:05 AM'
          }
        ];
        
        window.sampleRoutes = sampleRoutes;
        
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
                    <li>
                      ${route.ac ? '<i class="fas fa-snowflake" aria-hidden="true"></i> AC' : ''}
                    </li>
                    <li><small>Dep: ${route.departure || 'N/A'} • Arr: ${route.arrival || 'N/A'}</small></li>
                  </ul>
                  <div class="route-actions">
                    <button class="btn btn-primary btn-open-seat" data-route="${route.id}" aria-label="Select seats for ${route.title || 'this route'}">
                      Select Seats
                    </button>
                    <button class="btn btn-ghost btn-book-quick" data-route="${route.id}" aria-label="Quick book for ${route.title || 'this route'}">
                      Quick Book
                    </button>
                  </div>
                </div>
              `;
              
              popularRoutesEl.appendChild(card);
            });
          } catch (e) {
            console.error('Route rendering error:', e);
            popularRoutesEl.innerHTML = '<div class="error-message" aria-live="polite">Error loading routes. Please try again.</div>';
          }
        }
        
        showLoading(true);
        setTimeout(() => {
          try {
            renderRoutes(sampleRoutes);
          } catch (e) {
            console.error('Route loading error:', e);
            renderRoutes([]);
          } finally {
            showLoading(false);
          }
        }, 800);
      }

      // Seat selection modal + booking flow - Comprehensive improvements
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
        const seatCost = 10; // Default seat cost if route doesn't specify

        function lockBodyScroll(lock = true) {
          try {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            if (lock) {
              document.body.style.overflow = 'hidden';
              if (scrollbarWidth > 0) {
                document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
              }
            } else {
              document.body.style.overflow = '';
              document.documentElement.style.paddingRight = '';
            }
          } catch (e) {
            console.error('Scroll lock error:', e);
          }
        }

        function generateSeats(rows = 10, cols = 4) {
          try {
            const seats = [];
            const letters = ['A', 'B', 'C', 'D'];
            
            for (let r = 1; r <= rows; r++) {
              for (let c = 0; c < cols; c++) {
                const id = `${r}${letters[c]}`;
                const isBooked = Math.random() < 0.1; // 10% chance booked
                seats.push({
                  id,
                  status: isBooked ? 'booked' : 'available'
                });
              }
            }
            
            return seats;
          } catch (e) {
            console.error('Seat generation error:', e);
            return [];
          }
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
            releaseTrapFocus();
          } catch (e) {
            console.error('Seat modal close error:', e);
          }
        }

        function renderSeats() {
          try {
            seatsGrid.innerHTML = '';
            
            if (!seatsState.length) {
              seatsGrid.innerHTML = '<p class="error-message">No seats available.</p>';
              return;
            }
            
            seatsState.forEach(seat => {
              if (!seat || !seat.id) return;
              
              const seatEl = create('button', {
                type: 'button',
                'data-id': seat.id,
                'aria-pressed': 'false',
                'aria-label': `Seat ${seat.id} - ${seat.status === 'booked' ? 'Booked' : 'Available'}`,
                class: `seat ${seat.status === 'booked' ? 'booked' : 'available'}`,
                disabled: seat.status === 'booked' ? 'true' : undefined
              });
              
              seatEl.innerHTML = `<small>${seat.id}</small>`;
              
              if (seat.status !== 'booked') {
                on(seatEl, 'click', () => toggleSeatSelection(seat.id));
              }
              
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
            if (idx === -1) {
              selectedSeats.push(id);
            } else {
              selectedSeats.splice(idx, 1);
            }
            
            $$('.seat', seatsGrid).forEach(btn => {
              const btnId = btn.dataset.id;
              if (!btnId) return;
              
              const isSelected = selectedSeats.includes(btnId);
              btn.classList.toggle('selected', isSelected);
              btn.setAttribute('aria-pressed', String(isSelected));
            });
            
            renderPassengerFields();
          } catch (e) {
            console.error('Seat selection error:', e);
          }
        }

        function renderPassengerFields() {
          if (!passengerForm) return;
          
          try {
            passengerForm.innerHTML = '';
            
            if (!selectedSeats.length) {
              passengerForm.innerHTML = `
                <p class="muted" aria-live="polite">
                  Please select seats to add passenger details.
                </p>
              `;
              return;
            }
            
            selectedSeats.forEach((seatId, i) => {
              if (!seatId) return;
              
              const row = create('div', { class: 'row' });
              row.innerHTML = `
                <div class="form-group">
                  <label for="name_${i}">Passenger ${i + 1} (Seat ${seatId})</label>
                  <input 
                    id="name_${i}" 
                    name="name_${i}" 
                    type="text" 
                    placeholder="Full name" 
                    required
                    aria-required="true"
                    minlength="2"
                  >
                </div>
                <div class="form-group">
                  <label for="phone_${i}">Phone</label>
                  <input 
                    id="phone_${i}" 
                    name="phone_${i}" 
                    type="tel" 
                    placeholder="Phone number" 
                    required
                    aria-required="true"
                    pattern="[0-9]{10,15}"
                    title="Please enter a valid phone number (10-15 digits)"
                  >
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
            
            if (input.required && !input.value.trim()) {
              inputValid = false;
            } else if (input.type === 'tel' && !/^[0-9]{10,15}$/.test(input.value.trim())) {
              inputValid = false;
            } else if (input.minLength && input.value.trim().length < input.minLength) {
              inputValid = false;
            }
            
            input.classList.toggle('invalid', !inputValid);
            input.setAttribute('aria-invalid', String(!inputValid));
            
            if (!inputValid) isValid = false;
          });
          
          return isValid;
        }

        function confirmBooking() {
          try {
            if (!selectedSeats.length) {
              showToast('Please select at least one seat to continue.', 'error');
              return;
            }
            
            if (!validatePassengerForm()) {
              showToast('Please fill all passenger details correctly.', 'error');
              return;
            }
            
            showLoading(true);
            
            setTimeout(() => {
              try {
                const bookingId = `SR-${Math.floor(Math.random() * 900000 + 100000)}`;
                
                // Update seat status
                seatsState.forEach(s => {
                  if (selectedSeats.includes(s.id)) s.status = 'booked';
                });
                
                // Set confirmation details
                $('#confirmationId').textContent = bookingId;
                $('#confirmationRoute').textContent = currentRoute?.title || 'Unknown Route';
                $('#confirmationDate').textContent = modalDateEl.textContent;
                $('#confirmationTime').textContent = modalTimeEl.textContent;
                $('#confirmationSeats').textContent = selectedSeats.join(', ');
                
                // Calculate total based on route price or default seat cost
                const seatPrice = currentRoute?.price || seatCost;
                $('#confirmationTotal').textContent = formatCurrency(selectedSeats.length * seatPrice);
                
                closeSeatModal();
                window.openConfirmationModal();
                showToast('Booking confirmed successfully!', 'success');
              } catch (e) {
                console.error('Booking confirmation error:', e);
                showToast('Error confirming booking. Please try again.', 'error');
              } finally {
                showLoading(false);
              }
            }, 1000);
          } catch (e) {
            console.error('Booking error:', e);
            showLoading(false);
            showToast('An error occurred. Please try again.', 'error');
          }
        }

        // Event listeners with error handling
        try {
          on(document, 'click', (e) => {
            const openSeatBtn = e.target.closest('.btn-open-seat, .btn-book-quick');
            if (openSeatBtn && openSeatBtn.dataset.route) {
              openSeatModal(openSeatBtn.dataset.route);
            }
          });
          
          on(modalClose, 'click', closeSeatModal);
          on(cancelBookingBtn, 'click', closeSeatModal);
          on(confirmBookingBtn, 'click', confirmBooking);
          
          // Close modal when clicking outside
          on(seatModal, 'click', (e) => {
            if (e.target === seatModal) {
              closeSeatModal();
            }
          });
        } catch (e) {
          console.error('Event listener error:', e);
        }
        
        window.closeSeatModal = closeSeatModal;
      }

      // Confirmation modal - Enhanced with better error handling
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
            
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            if (scrollbarWidth > 0) {
              document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
            }
            
            releaseTrapFocus = trapFocus(confirmationModal);
            setTimeout(() => printTicketBtn?.focus(), 50);
          } catch (e) {
            console.error('Confirmation modal open error:', e);
          }
        }
        
        function closeConfirmationModal() {
          try {
            confirmationModal.setAttribute('hidden', 'true');
            confirmationModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            document.documentElement.style.paddingRight = '';
            releaseTrapFocus();
          } catch (e) {
            console.error('Confirmation modal close error:', e);
          }
        }
        
        try {
          on(printTicketBtn, 'click', () => {
            try {
              window.print();
            } catch (e) {
              console.error('Print error:', e);
              showToast('Error printing ticket. Please try again.', 'error');
            }
          });
          
          on(closeConfirmation, 'click', closeConfirmationModal);
        } catch (e) {
          console.error('Confirmation modal event error:', e);
        }
        
        window.openConfirmationModal = openConfirmationModal;
        window.closeConfirmationModal = closeConfirmationModal;
      }

      // Newsletter form - Enhanced validation
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
            
            // Add error message for screen readers
            const existingError = $('#newsletterError');
            if (!existingError) {
              const errorMsg = create('div', {
                id: 'newsletterError',
                class: 'error-message',
                'aria-live': 'assertive'
              }, 'Please enter a valid email address.');
              emailInput.parentNode.appendChild(errorMsg);
            }
            
            showToast('Please enter a valid email address.', 'error');
            return;
          }
          
          showLoading(true);
          
          setTimeout(() => {
            try {
              // Remove error message if exists
              const errorMsg = $('#newsletterError');
              if (errorMsg) errorMsg.remove();
              
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
          }, 800);
        });
        
        // Real-time validation
        on($('#newsletterEmail'), 'input', function() {
          this.classList.remove('invalid');
          this.setAttribute('aria-invalid', 'false');
          
          const errorMsg = $('#newsletterError');
          if (errorMsg) errorMsg.remove();
        });
      }

      // Toast notifications - More accessible
      function showToast(message, type = 'info') {
        if (!message) return;
        
        // Remove existing toasts to prevent stacking
        $$('.toast').forEach(toast => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 300);
        });
        
        const toast = create('div', {
          class: `toast toast-${type}`,
          role: 'alert',
          'aria-live': 'assertive',
          'aria-atomic': 'true'
        }, message);
        
        document.body.appendChild(toast);
        
        // Force reflow to enable CSS transition
        void toast.offsetWidth;
        
        toast.classList.add('show');
        
        // Auto-dismiss
        const timeout = setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Allow manual dismissal
        toast._timeout = timeout;
        on(toast, 'click', () => {
          clearTimeout(toast._timeout);
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 300);
        });
      }

      // Initialize everything with error handling
      function init() {
        try {
          // Set current year
          const yearEl = $('#currentYear');
          if (yearEl) yearEl.textContent = new Date().getFullYear();
          
          // Hide initial loading overlay
          setTimeout(() => {
            const overlay = $('#loadingOverlay');
            if (overlay) overlay.hidden = true;
          }, 500);
          
          // Initialize components
          initMobileNav();
          initSearchTabs();
          initPopularRoutes();
          initSeatSelection();
          initConfirmationModal();
          initNewsletterForm();
          
          // Escape key handler
          on(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
              if ($('#seatModal')?.getAttribute('aria-hidden') === 'false') {
                window.closeSeatModal?.();
              }
              if ($('#confirmationModal')?.getAttribute('aria-hidden') === 'false') {
                window.closeConfirmationModal?.();
              }
            }
          });
          
          // Reduced motion preference
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduced-motion');
          }
          
          // Scroll reveal with IntersectionObserver
          if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('visible');
                  observer.unobserve(entry.target);
                }
              });
            }, { 
              threshold: 0.1,
              rootMargin: '0px 0px -50px 0px'
            });
            
            $$('.feature-card, .route-card, .testimonial-card, .section-title').forEach(el => {
              if (el) {
                el.classList.add('scroll-reveal');
                observer.observe(el);
              }
            });
          } else {
            $$('.scroll-reveal').forEach(el => {
              if (el) el.classList.add('visible');
            });
          }
        } catch (e) {
            console.error('Initialization error:', e);
        }
      }

      // Start the application
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        setTimeout(init, 0);
      }
    })();