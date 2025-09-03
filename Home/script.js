
class BusManagementSystem {
            constructor() {
                // Enhanced bus data with more realistic properties
                this.buses = this.generateBusData(15); // Generate 15 buses with realistic data
                this.routes = this.createRouteDefinitions();
                this.map = null;
                this.busMarkers = new Map(); // Using Map for better marker management
                this.routeLayers = {};
                this.currentRoute = 'all';
                this.lastUpdateTime = new Date();
                this.animationFrameId = null;
                
                this.init();
            }
            
            // Generate realistic bus data
            generateBusData(count) {
                const routes = ['5', '8', '12', '2', '15', '22', '31', '42'];
                const statuses = ['on-time', 'delayed', 'offline'];
                const drivers = [
                    'Abebe Alemu', 'Alemayehu Kebede', 'Mesfin Asrat', 
                    'Sara Hailu', 'Daniel Mekonnen', 'Hana Worku',
                    'Michael Getachew', 'Selamawit Abebe', 'Elias Girma'
                ];
                
                return Array.from({ length: count }, (_, i) => {
                    const route = routes[Math.floor(Math.random() * routes.length)];
                    const status = statuses[Math.floor(Math.random() * 3)];
                    const speed = status === 'offline' ? 0 : 
                                status === 'delayed' ? Math.floor(Math.random() * 20) + 5 : 
                                Math.floor(Math.random() * 30) + 15;
                    
                    return {
                        id: i + 1,
                        number: `AA-${Math.floor(Math.random() * 900) + 100}`,
                        route: route,
                        coords: this.getRandomLocationInAddis(),
                        status: status,
                        speed: speed,
                        driver: drivers[Math.floor(Math.random() * drivers.length)],
                        capacity: [40, 45, 50][Math.floor(Math.random() * 3)],
                        passengers: status === 'offline' ? 0 : Math.floor(Math.random() * 50),
                        fuelLevel: Math.floor(Math.random() * 100),
                        maintenanceDue: this.getRandomFutureDate(30),
                        lastMaintenance: this.getRandomPastDate(90),
                        mileage: Math.floor(Math.random() * 50000),
                    };
                });
            }
            
            // Create comprehensive route definitions
            createRouteDefinitions() {
                return {
                    '5': { 
                        name: 'Route 5 (Arat Kilo - Mexico)', 
                        color: '#e63946',
                        stops: ['Arat Kilo', 'Sidist Kilo', 'Addisu Gebeya', 'Mexico']
                    },
                    '8': { 
                        name: 'Route 8 (Mercato - Saris)', 
                        color: '#457b9d',
                        stops: ['Mercato', 'Legehar', 'Bole Bridge', 'Saris']
                    },
                    '12': { 
                        name: 'Route 12 (University - Piazza)', 
                        color: '#2a9d8f',
                        stops: ['AAU', 'Sidist Kilo', 'Arat Kilo', 'Piazza']
                    },
                    '2': { 
                        name: 'Route 2 (Ayat - Megenagna)', 
                        color: '#7209b7',
                        stops: ['Ayat', 'Bole Homes', 'Megenagna', 'Urael']
                    },
                    '15': { 
                        name: 'Route 15 (Bole - CMC)', 
                        color: '#f8961e',
                        stops: ['Bole Medhanialem', 'CMC', 'Kazanchis', 'Megenagna']
                    },
                    '22': { 
                        name: 'Route 22 (Kality - Gofa)', 
                        color: '#4cc9f0',
                        stops: ['Kality', 'Lemi Kura', 'Gofa', 'Megenagna']
                    },
                    '31': { 
                        name: 'Route 31 (Kotebe - Legehar)', 
                        color: '#ef476f',
                        stops: ['Kotebe', 'Megenagna', 'Legehar', 'Piazza']
                    },
                    '42': { 
                        name: 'Route 42 (Saris - Summit)', 
                        color: '#06d6a0',
                        stops: ['Saris', 'Summit', 'CMC', 'Bole']
                    }
                };
            }
            
            // Helper methods for data generation
            getRandomLocationInAddis() {
                // Rough bounding box for Addis Ababa
                const lat = 8.9166 + Math.random() * 0.17; // 8.9166 to 9.0866
                const lng = 38.6759 + Math.random() * 0.176; // 38.6759 to 38.8519
                return [lat, lng];
            }
            
            getRandomFutureDate(days) {
                const date = new Date();
                date.setDate(date.getDate() + Math.floor(Math.random() * days) + 1);
                return date.toISOString().split('T')[0];
            }
            
            getRandomPastDate(days) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * days));
                return date.toISOString().split('T')[0];
            }
            
            init() {
                this.initTheme();
                this.initUserDropdown();
                this.initMap();
                this.initRoutes();
                this.initBuses();
                this.initTable();
                this.addEventListeners();
                this.startSimulation();
            }
            
            initTheme() {
                const themeToggle = document.querySelector('.theme-toggle');
                const html = document.documentElement;
                
                const setTheme = (theme) => {
                    html.setAttribute('data-theme', theme);
                    themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
                    localStorage.setItem('theme', theme);
                };
                
                themeToggle.addEventListener('click', () => {
                    const currentTheme = html.getAttribute('data-theme');
                    setTheme(currentTheme === 'light' ? 'dark' : 'light');
                });
                
                // Check for saved theme or prefer color scheme
                const savedTheme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
            }
            
            initUserDropdown() {
                const userAvatar = document.getElementById('user-avatar');
                const dropdownMenu = document.getElementById('dropdown-menu');
                
                const toggleMenu = (e) => {
                    e.stopPropagation();
                    dropdownMenu.classList.toggle('show');
                };
                
                userAvatar.addEventListener('click', toggleMenu);
                document.addEventListener('click', () => dropdownMenu.classList.remove('show'));
                
                // Close menu when clicking outside
                dropdownMenu.addEventListener('click', (e) => e.stopPropagation());
            }
            
            initMap() {
                this.map = L.map('map', {
                    zoomControl: false,
                    preferCanvas: true // Better performance for many markers
                }).setView([9.0054, 38.7636], 12);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 18,
                    minZoom: 10
                }).addTo(this.map);
                
                this.addCityBoundary();
                this.updateActiveBusesCount();
                
                // Add custom zoom controls with better positioning
                L.control.zoom({
                    position: 'topright'
                }).addTo(this.map);
            }
            
            addCityBoundary() {
                const addisBoundary = L.polygon([
                    [9.0866, 38.6759], [8.9166, 38.6759],
                    [8.9166, 38.8519], [9.0866, 38.8519]
                ], {
                    color: '#4361ee',
                    weight: 2,
                    opacity: 0.5,
                    fillOpacity: 0.1,
                    interactive: false
                }).addTo(this.map);
                
                // Add city label
                L.marker([9.0054, 38.7636], {
                    icon: L.divIcon({
                        className: 'city-label',
                        html: 'Addis Ababa',
                        iconSize: [100, 20]
                    }),
                    interactive: false
                }).addTo(this.map);
            }
            
            initRoutes() {
                // Create route layers with realistic paths
                this.routeLayers = {
                    '5': this.createRouteLayer(
                        [[9.0306, 38.7636], [9.0225, 38.7700], [9.0150, 38.7750], [9.0050, 38.7850]],
                        '5'
                    ),
                    '8': this.createRouteLayer(
                        [[9.0250, 38.7450], [9.0350, 38.7500], [9.0450, 38.7600]],
                        '8'
                    ),
                    '12': this.createRouteLayer(
                        [[9.0400, 38.7600], [9.0350, 38.7550], [9.0300, 38.7500]],
                        '12'
                    ),
                    '2': this.createRouteLayer(
                        [[9.0100, 38.7800], [9.0200, 38.7700], [9.0300, 38.7600]],
                        '2'
                    ),
                    '15': this.createRouteLayer(
                        [[9.0400, 38.7700], [9.0450, 38.7650], [9.0500, 38.7600]],
                        '15'
                    ),
                    '22': this.createRouteLayer(
                        [[9.0100, 38.7500], [9.0200, 38.7400], [9.0300, 38.7300]],
                        '22'
                    ),
                    '31': this.createRouteLayer(
                        [[9.0200, 38.7600], [9.0250, 38.7550], [9.0300, 38.7500]],
                        '31'
                    ),
                    '42': this.createRouteLayer(
                        [[9.0150, 38.7700], [9.0200, 38.7650], [9.0250, 38.7600]],
                        '42'
                    )
                };
                
                this.showRoute('all');
            }
            
            createRouteLayer(coordinates, routeId) {
                const routeInfo = this.routes[routeId];
                const stops = coordinates.map((coord, i) => {
                    return L.circleMarker(coord, {
                        radius: 6,
                        fillColor: routeInfo.color,
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).bindPopup(`<b>${routeInfo.name}</b><br>Stop ${i+1}: ${routeInfo.stops[i]}`);
                });
                
                return {
                    line: L.polyline(coordinates, {
                        color: routeInfo.color,
                        weight: 4,
                        opacity: 0.7,
                        smoothFactor: 1
                    }),
                    stops: stops,
                    bounds: L.latLngBounds(coordinates)
                };
            }
            
            showRoute(routeId) {
                // First remove all existing route layers
                Object.values(this.routeLayers).forEach(route => {
                    this.map.removeLayer(route.line);
                    route.stops.forEach(stop => this.map.removeLayer(stop));
                });
                
                if (routeId === 'all') {
                    // Show all routes
                    Object.values(this.routeLayers).forEach(route => {
                        route.line.addTo(this.map);
                        route.stops.forEach(stop => stop.addTo(this.map));
                    });
                    
                    // Fit map to show all routes
                    const bounds = Object.values(this.routeLayers).reduce((acc, route) => {
                        return acc.extend(route.bounds);
                    }, L.latLngBounds([]));
                    
                    this.map.fitBounds(bounds.pad(0.1));
                } else if (this.routeLayers[routeId]) {
                    // Show specific route
                    const route = this.routeLayers[routeId];
                    route.line.addTo(this.map);
                    route.stops.forEach(stop => stop.addTo(this.map));
                    this.map.fitBounds(route.bounds.pad(0.2));
                }
                
                this.currentRoute = routeId;
                this.updateRouteSelectionUI(routeId);
            }
            
            updateRouteSelectionUI(routeId) {
                document.querySelectorAll('.route-option').forEach(option => {
                    option.classList.toggle('active', option.dataset.route === routeId);
                });
            }
            
            initBuses() {
                this.createBusMarkers();
            }
            
            busIcon(bus) {
                const colors = {
                    'on-time': '#4cc9f0',
                    'delayed': '#f8961e',
                    'offline': '#ef233c'
                };
                
                return L.divIcon({
                    className: `bus-marker ${bus.status}`,
                    html: `
                        <div class="bus-icon" style="background-color: ${colors[bus.status]}">
                            <i class="fas fa-bus"></i>
                            <span class="bus-number">${bus.number}</span>
                        </div>
                    `,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                });
            }
            
            createBusMarkers() {
                // Clear existing markers
                this.busMarkers.forEach(marker => this.map.removeLayer(marker));
                this.busMarkers.clear();
                
                // Create new markers
                this.buses.forEach(bus => {
                    const marker = L.marker(bus.coords, {
                        icon: this.busIcon(bus),
                        zIndexOffset: 1000,
                        rotationAngle: this.getBusDirection(bus)
                    }).bindPopup(this.createBusPopup(bus));
                    
                    marker.addTo(this.map);
                    marker.busId = bus.id;
                    this.busMarkers.set(bus.id, marker);
                });
            }
            
            getBusDirection(bus) {
                if (bus.status === 'offline' || !this.routeLayers[bus.route]) return 0;
                
                const routePoints = this.routeLayers[bus.route].line.getLatLngs();
                if (routePoints.length < 2) return 0;
                
                // Find nearest point on route
                let nearestIndex = 0;
                let minDistance = Infinity;
                
                routePoints.forEach((point, index) => {
                    const distance = this.calculateDistance(
                        bus.coords[0], bus.coords[1],
                        point.lat, point.lng
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestIndex = index;
                    }
                });
                
                // Get next point to determine direction
                const nextIndex = (nearestIndex + 1) % routePoints.length;
                const prevIndex = (nearestIndex - 1 + routePoints.length) % routePoints.length;
                
                const nextPoint = routePoints[nextIndex];
                const prevPoint = routePoints[prevIndex];
                
                // Calculate angle between points
                const dy = nextPoint.lat - prevPoint.lat;
                const dx = nextPoint.lng - prevPoint.lng;
                
                return Math.atan2(dy, dx) * 180 / Math.PI;
            }
            
           createBusPopup(bus) {
            const routeInfo = this.routes[bus.route] || { name: 'Unknown Route' };
            
            const statusInfo = {
                'on-time': { text: 'On Time', class: 'badge-success' },
                'delayed': { text: 'Delayed', class: 'badge-warning' },
                'offline': { text: 'Offline', class: 'badge-danger' }
            }[bus.status] || { text: 'Unknown', class: 'badge-default' };
            
            return `
                <div class="bus-popup">
                    <div class="bus-header">
                        <h4>Bus ${bus.number}</h4>
                        <span class="badge ${statusInfo.class}">${statusInfo.text}</span>
                    </div>
                    
                    <div class="bus-details">
                        <p><strong>Route:</strong> ${routeInfo.name}</p>
                        <p><strong>Driver:</strong> ${bus.driver}</p>
                        <p><strong>Passengers:</strong> ${bus.passengers}/${bus.capacity}</p>
                        <p><strong>Speed:</strong> ${bus.speed} km/h</p>
                        <p><strong>Fuel:</strong> ${bus.fuelLevel}%</p>
                        <p><strong>Mileage:</strong> ${bus.mileage.toLocaleString()} km</p>
                        <p><strong>Last Maintenance:</strong> ${bus.lastMaintenance}</p>
                        <p><strong>Next Maintenance:</strong> ${bus.maintenanceDue}</p>
                    </div>
                    
                    <div class="bus-actions">
                        <button class="btn-small btn-primary">View Details</button>
                        <button class="btn-small btn-secondary">Send Message</button>
                    </div>
                </div>
            `;
        }
            
            startSimulation() {
                // Use requestAnimationFrame for smoother animation
                const animate = () => {
                    this.updateBusPositions();
                    this.animationFrameId = requestAnimationFrame(animate);
                };
                
                this.animationFrameId = requestAnimationFrame(animate);
                
                // Update UI every second
                this.simulationInterval = setInterval(() => {
                    this.lastUpdateTime = new Date();
                    document.getElementById('last-updated').textContent = 
                        this.lastUpdateTime.toLocaleTimeString();
                    this.updateActiveBusesCount();
                }, 1000);
            }
            
            stopSimulation() {
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                }
                
                if (this.simulationInterval) {
                    clearInterval(this.simulationInterval);
                }
            }
            
            updateBusPositions() {
                this.buses.forEach(bus => {
                    if (bus.status === 'offline') return;
                    
                    const route = this.routeLayers[bus.route]?.line.getLatLngs();
                    if (!route || route.length < 2) return;
                    
                    // Find nearest point on route
                    let nearestIndex = 0;
                    let minDistance = Infinity;
                    
                    route.forEach((point, index) => {
                        const distance = this.calculateDistance(
                            bus.coords[0], bus.coords[1],
                            point.lat, point.lng
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestIndex = index;
                        }
                    });
                    
                    // Determine next point to move towards
                    const nextIndex = (nearestIndex + 1) % route.length;
                    const nextPoint = route[nextIndex];
                    
                    // Calculate movement vector
                    const latDiff = nextPoint.lat - bus.coords[0];
                    const lngDiff = nextPoint.lng - bus.coords[1];
                    
                    // Calculate distance to next point (simplified)
                    const distance = this.calculateDistance(
                        bus.coords[0], bus.coords[1],
                        nextPoint.lat, nextPoint.lng
                    );
                    
                    // Calculate movement factor based on speed (km/h to degrees per frame)
                    const speedKmPerFrame = bus.speed / 3600 / 60; // km per frame (assuming 60fps)
                    const movementFactor = speedKmPerFrame * 0.01 / distance; // Simplified scaling
                    
                    // Update bus position
                    bus.coords[0] += latDiff * movementFactor;
                    bus.coords[1] += lngDiff * movementFactor;
                    
                    // Random status changes (5% chance per second)
                    if (Math.random() < 0.0005) { 
                        const oldStatus = bus.status;
                        bus.status = ['on-time', 'delayed', 'offline'][Math.floor(Math.random() * 3)];
                        
                        if (oldStatus !== bus.status) {
                            this.addActivityLog(
                                'Bus Status Changed',
                                `Bus ${bus.number} is now ${bus.status.replace('-', ' ')}`,
                                'fas fa-bus'
                            );
                            this.updateTable();
                        }
                    }
                    
                    // Update marker
                    const marker = this.busMarkers.get(bus.id);
                    if (marker) {
                        marker.setLatLng(bus.coords);
                        
                        // Only update popup if it's open to save performance
                        if (marker.isPopupOpen()) {
                            marker.setPopupContent(this.createBusPopup(bus));
                        }
                        
                        // Update icon if status changed
                        if (!marker.options.icon.options.className.includes(bus.status)) {
                            marker.setIcon(this.busIcon(bus));
                        }
                        
                        // Update rotation
                        marker.setRotationAngle(this.getBusDirection(bus));
                    }
                });
            }
            
            calculateDistance(lat1, lon1, lat2, lon2) {
                // Simplified distance calculation (not accurate for large distances)
                return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
            }
            
            updateActiveBusesCount() {
                const activeBuses = this.buses.filter(bus => bus.status !== 'offline').length;
                document.getElementById('active-buses-count').textContent = activeBuses;
                document.getElementById('dashboard-active-buses').textContent = activeBuses;
            }
            
            initTable() {
                this.updateTable();
            }
            
            updateTable() {
                const tableBody = document.getElementById('bus-table-body');
                const fragment = document.createDocumentFragment();
                
                this.buses.forEach(bus => {
                    const row = document.createElement('tr');
                    row.dataset.busId = bus.id;
                    
                    const statusInfo = {
                        'on-time': { text: 'On Time', class: 'badge-success' },
                        'delayed': { text: 'Delayed', class: 'badge-warning' },
                        'offline': { text: 'Offline', class: 'badge-default' }
                    }[bus.status];
                    
                    const now = new Date();
                    const departureTime = new Date(now.getTime() + Math.floor(Math.random() * 3600000));
                    const arrivalTime = new Date(departureTime.getTime() + 45 * 60000);
                    
                    row.innerHTML = `
                        <td>${bus.number}</td>
                        <td>${this.routes[bus.route]?.name || 'Unknown'}</td>
                        <td>${departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>${arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>${bus.driver}</td>
                        <td><span class="badge ${statusInfo.class}">${statusInfo.text}</span></td>
                        <td>
                            <div class="table-actions">
                                <button class="btn-icon btn-edit" aria-label="Edit bus ${bus.number}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon btn-delete" aria-label="Delete bus ${bus.number}">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn-icon btn-locate" aria-label="Locate bus ${bus.number}">
                                    <i class="fas fa-map-marker-alt"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    
                    fragment.appendChild(row);
                });
                
                tableBody.innerHTML = '';
                tableBody.appendChild(fragment);
            }
            
            addActivityLog(title, description, icon) {
                const activityFeed = document.getElementById('activity-items');
                const now = new Date();
                
                const activityItem = document.createElement('article');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <div class="activity-icon" aria-hidden="true">
                        <i class="${icon}"></i>
                    </div>
                    <div class="activity-details">
                        <h3>${title}</h3>
                        <p>${description} - ${now.toLocaleTimeString()}</p>
                        <time datetime="${now.toISOString()}" class="activity-time">
                            ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </time>
                    </div>
                `;
                
                activityFeed.insertBefore(activityItem, activityFeed.firstChild);
                
                // Limit to 10 activities
                while (activityFeed.children.length > 10) {
                    activityFeed.removeChild(activityFeed.lastChild);
                }
            }
            
            addEventListeners() {
                // Route selection
                document.querySelectorAll('.route-option').forEach(option => {
                    option.addEventListener('click', () => {
                        this.showRoute(option.dataset.route);
                    });
                });
                
                // Map controls
                document.getElementById('zoom-in').addEventListener('click', () => {
                    this.map.zoomIn();
                });
                
                document.getElementById('zoom-out').addEventListener('click', () => {
                    this.map.zoomOut();
                });
                
                document.getElementById('locate-me').addEventListener('click', () => {
                    this.locateUser();
                });
                
                document.getElementById('fullscreen-btn').addEventListener('click', () => {
                    this.toggleFullscreen();
                });
                
                // Table actions
                document.getElementById('bus-table-body').addEventListener('click', (e) => {
                    const btn = e.target.closest('button');
                    if (!btn) return;
                    
                    const row = btn.closest('tr');
                    const busId = parseInt(row.dataset.busId);
                    const bus = this.buses.find(b => b.id === busId);
                    
                    if (!bus) return;
                    
                    if (btn.classList.contains('btn-edit')) {
                        this.editBus(bus);
                    } else if (btn.classList.contains('btn-delete')) {
                        this.deleteBus(bus, row);
                    } else if (btn.classList.contains('btn-locate')) {
                        this.locateBus(bus);
                    }
                });
            }
            
            locateUser() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            this.map.flyTo([position.coords.latitude, position.coords.longitude], 15);
                            L.circle([position.coords.latitude, position.coords.longitude], {
                                radius: 100,
                                color: '#4361ee',
                                fillColor: '#3a86ff',
                                fillOpacity: 0.2
                            }).addTo(this.map).bindPopup('Your location').openPopup();
                        },
                        error => {
                            console.error('Geolocation error:', error);
                            alert('Could not get your location: ' + error.message);
                        },
                        { enableHighAccuracy: true, timeout: 5000 }
                    );
                } else {
                    alert('Geolocation is not supported by your browser');
                }
            }
            
            toggleFullscreen() {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.error('Fullscreen error:', err);
                    });
                } else {
                    document.exitFullscreen();
                }
            }
            
            editBus(bus) {
                // In a real app, this would open a modal or form
                console.log('Editing bus:', bus.number);
                alert(`Editing bus ${bus.number}`);
            }
            
            deleteBus(bus, row) {
                if (confirm(`Are you sure you want to delete bus ${bus.number}?`)) {
                    row.classList.add('fade-out');
                    setTimeout(() => {
                        this.buses = this.buses.filter(b => b.id !== bus.id);
                        this.busMarkers.get(bus.id)?.remove();
                        this.busMarkers.delete(bus.id);
                        this.updateTable();
                        this.addActivityLog(
                            'Bus Removed',
                            `Bus ${bus.number} has been removed from the system`,
                            'fas fa-trash'
                        );
                    }, 300);
                }
            }
            
            locateBus(bus) {
                const marker = this.busMarkers.get(bus.id);
                if (marker) {
                    this.map.flyTo(marker.getLatLng(), 15);
                    marker.openPopup();
                }
            }
            
            // Clean up when instance is no longer needed
            destroy() {
                this.stopSimulation();
                this.map.remove();
                document.removeEventListener('click', this.handleDocumentClick);
            }
        }

        // Initialize the system when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            const bms = new BusManagementSystem();
            
            // Set current year in footer
            document.getElementById('currentYear').textContent = new Date().getFullYear();
            
            // Expose for debugging
            window.bms = bms;
        });