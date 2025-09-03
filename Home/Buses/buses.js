
        // Sample bus data
        const busData = [
            { id: "BUS-001", route: "Megenagna - Piazza", status: "on-time", driver: "Abebe K.", passengers: 42, speed: "32 km/h", nextStop: "Megenagna", location: [9.005, 38.763], eta: "5 min" },
            { id: "BUS-002", route: "Merkato - Bole", status: "delayed", driver: "Tigist H.", passengers: 38, speed: "28 km/h", nextStop: "Bole Bridge", location: [9.018, 38.752], eta: "12 min" },
            { id: "BUS-003", route: "Ayat - CMC", status: "on-time", driver: "Samuel M.", passengers: 45, speed: "35 km/h", nextStop: "CMC", location: [9.027, 38.771], eta: "8 min" },
            { id: "BUS-004", route: "Kality - Saris", status: "maintenance", driver: "Dawit A.", passengers: 0, speed: "0 km/h", nextStop: "Depot", location: [8.991, 38.742], eta: "N/A" },
            { id: "BUS-005", route: "Gurd Shola - Mexico", status: "on-time", driver: "Hanna T.", passengers: 36, speed: "30 km/h", nextStop: "Gurd Shola", location: [9.012, 38.733], eta: "3 min" },
            { id: "BUS-006", route: "Legehar - Bambis", status: "delayed", driver: "Meron G.", passengers: 41, speed: "25 km/h", nextStop: "Bambis", location: [9.022, 38.745], eta: "15 min" },
            { id: "BUS-007", route: "Saris - Summit", status: "offline", driver: "Yonas K.", passengers: 0, speed: "0 km/h", nextStop: "Depot", location: [9.035, 38.781], eta: "N/A" },
            { id: "BUS-008", route: "Bole - Atlas", status: "on-time", driver: "Selam W.", passengers: 39, speed: "33 km/h", nextStop: "Atlas", location: [9.028, 38.792], eta: "7 min" }
        ];

        // DOM elements
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const searchInput = document.getElementById('searchInput');
        const filterOptions = document.querySelectorAll('.filter-option');
        const busList = document.getElementById('busList');
        const currentTime = document.getElementById('currentTime');
        const themeToggle = document.getElementById('themeToggle');
        const activeBusGrid = document.getElementById('activeBusGrid');
        const mapActiveBuses = document.getElementById('mapActiveBuses');
        const mapLastUpdated = document.getElementById('mapLastUpdated');
        const totalBuses = document.getElementById('totalBuses');
        const activeBuses = document.getElementById('activeBuses');

        // Initialize map
        const map = L.map('map').setView([9.005, 38.763], 12);
        
        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Bus markers
        const busMarkers = {};

        // Initialize the dashboard
        function initDashboard() {
            updateTime();
            setInterval(updateTime, 1000);
            
            renderBusList();
            renderActiveBusGrid();
            updateMap();
            
            // Set initial counts
            totalBuses.textContent = busData.length;
            const activeCount = busData.filter(bus => bus.status === 'on-time' || bus.status === 'delayed').length;
            activeBuses.textContent = activeCount;
            mapActiveBuses.textContent = activeCount;
        }

        // Update current time
        function updateTime() {
            const now = new Date();
            currentTime.textContent = now.toLocaleTimeString();
            mapLastUpdated.textContent = now.toLocaleTimeString();
        }

        // Render bus list in sidebar
        function renderBusList() {
            busList.innerHTML = '';
            
            busData.forEach(bus => {
                const busItem = document.createElement('div');
                busItem.className = 'bus-item';
                busItem.dataset.status = bus.status;
                busItem.innerHTML = `
                    <div class="bus-item-header">
                        <span class="bus-id">${bus.id}</span>
                        <span class="bus-status status-${bus.status}">${formatStatus(bus.status)}</span>
                    </div>
                    <div class="bus-route">${bus.route}</div>
                    <div class="bus-info">
                        <span>Driver: ${bus.driver}</span>
                        <span>${bus.passengers} passengers</span>
                    </div>
                `;
                
                busItem.addEventListener('click', () => {
                    focusOnBus(bus);
                });
                
                busList.appendChild(busItem);
            });
        }

        // Render active bus grid
        function renderActiveBusGrid() {
            activeBusGrid.innerHTML = '';
            
            const activeBuses = busData.filter(bus => bus.status === 'on-time' || bus.status === 'delayed');
            
            activeBuses.forEach(bus => {
                const busCard = document.createElement('div');
                busCard.className = 'bus-card';
                busCard.innerHTML = `
                    <div class="bus-card-header">
                        <span>${bus.id}</span>
                        <span class="bus-status status-${bus.status}">${formatStatus(bus.status)}</span>
                    </div>
                    <div class="bus-card-body">
                        <div class="bus-card-route">${bus.route}</div>
                        <div class="bus-card-details">
                            <div class="bus-card-detail">
                                <span class="detail-label">Driver</span>
                                <span class="detail-value">${bus.driver}</span>
                            </div>
                            <div class="bus-card-detail">
                                <span class="detail-label">Passengers</span>
                                <span class="detail-value">${bus.passengers}</span>
                            </div>
                            <div class="bus-card-detail">
                                <span class="detail-label">Speed</span>
                                <span class="detail-value">${bus.speed}</span>
                            </div>
                            <div class="bus-card-detail">
                                <span class="detail-label">Next Stop</span>
                                <span class="detail-value">${bus.nextStop}</span>
                            </div>
                        </div>
                    </div>
                    <div class="bus-card-footer">
                        <span>ETA: ${bus.eta}</span>
                        <div class="bus-card-actions">
                            <button class="btn-track" data-bus-id="${bus.id}">Track</button>
                        </div>
                    </div>
                `;
                
                activeBusGrid.appendChild(busCard);
            });
        }

        // Update map with bus locations
        function updateMap() {
            // Clear existing markers
            Object.values(busMarkers).forEach(marker => {
                map.removeLayer(marker);
            });
            
            // Add markers for each bus
            busData.forEach(bus => {
                if (bus.status !== 'offline' && bus.status !== 'maintenance') {
                    const icon = L.divIcon({
                        className: `bus-marker ${bus.status}`,
                        html: `<i class="fas fa-bus ${bus.status}"></i>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });
                    
                    const marker = L.marker(bus.location, { icon }).addTo(map);
                    marker.bindPopup(`
                        <strong>${bus.id}</strong><br>
                        ${bus.route}<br>
                        Status: ${formatStatus(bus.status)}<br>
                        Passengers: ${bus.passengers}<br>
                        Next stop: ${bus.nextStop}
                    `);
                    
                    busMarkers[bus.id] = marker;
                }
            });
        }

        // Format status for display
        function formatStatus(status) {
            return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
        }

        // Focus on a specific bus on the map
        function focusOnBus(bus) {
            if (busMarkers[bus.id]) {
                map.setView(bus.location, 15);
                busMarkers[bus.id].openPopup();
            }
        }

        // Event listeners
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        });

        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const busItems = busList.querySelectorAll('.bus-item');
            
            busItems.forEach(item => {
                const busId = item.querySelector('.bus-id').textContent.toLowerCase();
                const busRoute = item.querySelector('.bus-route').textContent.toLowerCase();
                
                if (busId.includes(searchTerm) || busRoute.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });

        filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                filterOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                option.classList.add('active');
                
                const filter = option.dataset.filter;
                const busItems = busList.querySelectorAll('.bus-item');
                
                busItems.forEach(item => {
                    if (filter === 'all' || item.dataset.status === filter) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });

        // Initialize the dashboard
        initDashboard();

        // Simulate real-time updates
        setInterval(() => {
            // Randomly update some bus statuses and locations
            busData.forEach(bus => {
                if (bus.status === 'on-time' || bus.status === 'delayed') {
                    // Slightly adjust location
                    bus.location[0] += (Math.random() - 0.5) * 0.001;
                    bus.location[1] += (Math.random() - 0.5) * 0.001;
                    
                    // Randomly change passenger count
                    bus.passengers = Math.floor(Math.random() * 10) + 35;
                }
            });
            
            updateMap();
        }, 10000);
    