// ViewSchedule.js - UPDATED VERSION WITH LOGOUT AND REAL USER DATA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Loading ViewSchedule...');
    
    // Check if user is logged in
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');
    
    if (!loggedUser.id || !loggedUser.doctorId) {
        alert('Access denied. Please login as a doctor.');
        window.location.href = 'login.html';
        return;
    }
    
    // Elements
    const calendarBar = document.querySelector(".calendar-bar");
    const scheduleList = document.querySelector(".schedule-list");
    const patientDetails = document.querySelector(".patient-details");
    const toggleBtn = document.getElementById("toggleViewBtn");
    const monthNav = document.getElementById("monthNav");
    const monthLabel = document.getElementById("monthLabel");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");
    
    // Profile elements
    const doctorNameElement = document.querySelector(".logged-in-text");

    let isMonthlyView = false;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let allAppointments = [];
    let doctorProfile = null;

    // FAKE APPOINTMENTS DATA
    const fakeAppointments = [
        {
            booking_id: 1,
            user_id: 101,
            date: new Date().toISOString().split('T')[0], // Today
            time: "09:00",
            name: "John Smith",
            reason: "Annual Checkup",
            age: "45",
            notes: "Routine physical examination"
        },
        {
            booking_id: 2,
            user_id: 102,
            date: new Date().toISOString().split('T')[0], // Today
            time: "10:30", 
            name: "Sarah Johnson",
            reason: "Follow-up Visit",
            age: "62",
            notes: "Blood pressure monitoring"
        },
        {
            booking_id: 3,
            user_id: 103,
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            time: "14:00",
            name: "Mike Davis",
            reason: "Vaccination",
            age: "28",
            notes: "Flu shot scheduled"
        },
        {
            booking_id: 4,
            user_id: 104,
            date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Day after tomorrow
            time: "11:15",
            name: "Emily Wilson",
            reason: "Consultation",
            age: "35",
            notes: "Seasonal allergy symptoms"
        }
    ];

    // Initialize logout functionality
    function initLogout() {
        const logoutBtn = document.getElementById("logoutBtn");
        const logoutModal = document.getElementById("logoutModal");
        const confirmLogout = document.getElementById("confirmLogout");
        const cancelLogout = document.getElementById("cancelLogout");

        if (!logoutBtn) {
            console.error('❌ Logout button not found!');
            return;
        }

        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (logoutModal) {
                logoutModal.style.display = "flex";
            } else {
                // Fallback: direct logout if modal doesn't exist
                performLogout();
            }
        });

        if (confirmLogout) {
            confirmLogout.addEventListener("click", performLogout);
        }

        if (cancelLogout) {
            cancelLogout.addEventListener("click", () => {
                if (logoutModal) {
                    logoutModal.style.display = "none";
                }
            });
        }

        // Close modal when clicking outside
        if (logoutModal) {
            window.addEventListener("click", (e) => {
                if (e.target === logoutModal) {
                    logoutModal.style.display = "none";
                }
            });
        }
    }

    function performLogout() {
        localStorage.removeItem('loggedUser');
        window.location.href = "index.html";
    }

    // Load doctor profile from server OR use logged-in user data
    async function loadDoctorProfile() {
        console.log('👨‍⚕️ Fetching doctor profile from server...');
        
        try {
            // Try to get the logged-in doctor's profile
            const response = await fetch('http://localhost:3000/doctor/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const profileData = await response.json();
                doctorProfile = profileData;
                console.log('✅ Doctor profile loaded:', doctorProfile);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error loading doctor profile:', error);
            console.log('📋 Using logged-in user data as fallback');
            
            // Fallback to logged-in user data
            doctorProfile = {
                id: loggedUser.id,
                name: `Dr. ${loggedUser.firstName} ${loggedUser.lastName}`,
                specialty: loggedUser.specialty || "General Practitioner",
                email: loggedUser.email,
                phone: loggedUser.phone || "(555) 123-4567"
            };
        }
        
        // Update the UI with doctor data
        updateDoctorProfileUI();
        return doctorProfile;
    }

    // Update UI with doctor profile
    function updateDoctorProfileUI() {
        if (doctorNameElement) {
            if (doctorProfile && doctorProfile.name) {
                doctorNameElement.textContent = doctorProfile.name;
                console.log('✅ Doctor name updated in UI:', doctorProfile.name);
            } else if (loggedUser.firstName) {
                // Use logged-in user data as final fallback
                doctorNameElement.textContent = `Dr. ${loggedUser.firstName} ${loggedUser.lastName}`;
                console.log('✅ Using logged-in user name:', doctorNameElement.textContent);
            } else {
                doctorNameElement.textContent = "Doctor";
                console.error('❌ No doctor name available');
            }
        } else {
            console.error('❌ Doctor name element not found');
        }
    }

    // Helper: format date as YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Load bookings from server
    async function loadBookings() {
        console.log('📥 Fetching from /bookings endpoint...');
        
        try {
            const response = await fetch('http://localhost:3000/bookings');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const bookings = await response.json();
            
            console.log('✅ Bookings received:', bookings);
            
            // Use real data if available, otherwise use fake data
            if (bookings && bookings.length > 0) {
                allAppointments = bookings;
                console.log('📊 Using REAL data from database');
            } else {
                allAppointments = fakeAppointments;
                console.log('📊 Using FAKE data for demonstration');
            }
            
            return allAppointments;
            
        } catch (error) {
            console.error('❌ Error loading bookings:', error);
            console.log('📊 Using FAKE data due to server error');
            allAppointments = fakeAppointments;
            return allAppointments;
        }
    }

    // Generate weekly calendar
    function generateCalendar() {
        const today = new Date();
        const options = { weekday: "short" };
        calendarBar.innerHTML = "";
        calendarBar.classList.remove("monthly");

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const dayName = date.toLocaleDateString("en-US", options);
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString("en-US", { month: "short" });
            const dateStr = formatDate(date);

            const dayEl = document.createElement("div");
            dayEl.classList.add("day");
            dayEl.dataset.date = dateStr;
            dayEl.innerHTML = `
                <p>${dayName}</p>
                <span>${dayNum} ${monthName}</span>
            `;

            // Show appointment count for this day
            const dayAppointments = allAppointments.filter(apt => apt.date === dateStr);
            if (dayAppointments.length > 0) {
                dayEl.innerHTML += `<div class="appointment-count">${dayAppointments.length}</div>`;
            }

            if (i === 0) {
                dayEl.classList.add('today');
                dayEl.classList.add('active');
                loadSchedule(dateStr);
            }

            dayEl.addEventListener("click", () => {
                document.querySelectorAll(".calendar-bar .day").forEach(d => d.classList.remove("active"));
                dayEl.classList.add("active");
                loadSchedule(dateStr);
            });

            calendarBar.appendChild(dayEl);
        }
    }

    // Generate monthly calendar
    function generateMonthCalendar(year, month) {
        calendarBar.innerHTML = "";
        calendarBar.classList.add("monthly");
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();
        const options = { weekday: "short" };

        monthLabel.textContent = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

        // Add empty cells for days before the first day of month
        const firstDayOfWeek = firstDay.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.classList.add("day", "empty");
            calendarBar.appendChild(emptyCell);
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            const dayName = date.toLocaleDateString("en-US", options);
            const dateStr = formatDate(date);

            const dayEl = document.createElement("div");
            dayEl.classList.add("day");
            dayEl.dataset.date = dateStr;
            dayEl.innerHTML = `
                <p>${dayName}</p>
                <span>${d}</span>
            `;

            // Show appointment count for this day
            const dayAppointments = allAppointments.filter(apt => apt.date === dateStr);
            if (dayAppointments.length > 0) {
                dayEl.innerHTML += `<div class="appointment-count">${dayAppointments.length}</div>`;
            }

            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
                if (!document.querySelector('.day.active')) {
                    dayEl.classList.add('active');
                    loadSchedule(dateStr);
                }
            }

            dayEl.addEventListener("click", () => {
                document.querySelectorAll(".calendar-bar .day").forEach(d => d.classList.remove("active"));
                dayEl.classList.add("active");
                loadSchedule(dateStr);
            });

            calendarBar.appendChild(dayEl);
        }
    }

    // Load schedule for specific date
    function loadSchedule(dateStr) {
        scheduleList.innerHTML = "<div class='loading-message'>Loading appointments...</div>";
        patientDetails.innerHTML = "<p>Select a patient to view details.</p>";

        // Filter appointments for the selected date
        const filteredAppointments = allAppointments.filter(appt => {
            if (!appt || !appt.date) return false;
            
            let apptDate = appt.date;
            if (apptDate.includes('T')) {
                apptDate = apptDate.split('T')[0];
            }
            
            return apptDate === dateStr;
        });
        
        displayAppointments(filteredAppointments);
    }

    function displayAppointments(appointments) {
        scheduleList.innerHTML = "";

        if (!Array.isArray(appointments) || appointments.length === 0) {
            scheduleList.innerHTML = `
                <div class='no-appointments'>
                    <p>No appointments scheduled for this date.</p>
                    <p class="help-text">Book an appointment through the patient portal to see it here.</p>
                </div>`;
            patientDetails.innerHTML = "<p>No patients to display.</p>";
            return;
        }

        // Sort appointments by time
        const sortedAppointments = appointments.sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeA.localeCompare(timeB);
        });

        sortedAppointments.forEach((appt, index) => {
            const item = document.createElement("div");
            item.classList.add("schedule-item");
            item.dataset.appointmentIndex = index;
            item.innerHTML = `
                <div class="time">${formatTime(appt.time)}</div>
                <div class="patient">
                    <img src="images/Generic avatar.png" alt="Patient" />
                    <div class="details">
                        <p><strong>${appt.name || 'Patient'}</strong></p>
                        <p>${appt.reason || 'Appointment'}</p>
                    </div>
                </div>
            `;

            item.addEventListener("click", () => {
                document.querySelectorAll(".schedule-item").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                showPatientDetails(appt);
            });

            if (index === 0) {
                setTimeout(() => {
                    item.classList.add("active");
                    showPatientDetails(appt);
                }, 100);
            }

            scheduleList.appendChild(item);
        });
    }

    // Format time for display
    function formatTime(timeString) {
        if (!timeString || timeString === "--:--") return '--:--';
        
        try {
            const timeParts = timeString.split(':');
            const hours = parseInt(timeParts[0]);
            const minutes = timeParts[1];
            
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            
            return `${displayHours}:${minutes} ${period}`;
        } catch (err) {
            return timeString;
        }
    }

    // Show patient details
    function showPatientDetails(appt) {
        patientDetails.innerHTML = `
            <div class="patient-details-content">
                <img src="images/Generic avatar.png" alt="Patient" />
                <h2>${appt.name || 'Patient'}</h2>
                <div class="patient-info">
                    <p><strong>Appointment Time:</strong> <span>${formatTime(appt.time)}</span></p>
                    <p><strong>Appointment Date:</strong> <span>${appt.date}</span></p>
                    <p><strong>Reason:</strong> <span>${appt.reason || 'Not specified'}</span></p>
                    <p><strong>Age:</strong> <span>${appt.age || 'Not specified'}</span></p>
                    <p><strong>Notes:</strong> <span>${appt.notes || 'No notes'}</span></p>
                </div>
            </div>
        `;
    }

    // Toggle weekly/monthly
    toggleBtn.addEventListener("click", () => {
        isMonthlyView = !isMonthlyView;
        if (isMonthlyView) {
            toggleBtn.textContent = "Switch to Weekly View";
            monthNav.style.display = "flex";
            generateMonthCalendar(currentYear, currentMonth);
        } else {
            toggleBtn.textContent = "Switch to Monthly View";
            monthNav.style.display = "none";
            generateCalendar();
        }
    });

    // Month navigation
    prevMonthBtn.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateMonthCalendar(currentYear, currentMonth);
    });

    nextMonthBtn.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateMonthCalendar(currentYear, currentMonth);
    });

    // Refresh appointments and profile
    window.refreshAppointments = async function() {
        console.log('🔄 Refreshing data...');
        await loadDoctorProfile();
        await loadBookings();
        
        // Reload current view
        if (isMonthlyView) {
            generateMonthCalendar(currentYear, currentMonth);
        } else {
            generateCalendar();
        }
        
        // Reload current date
        const activeDate = document.querySelector('.day.active')?.dataset.date;
        if (activeDate) {
            loadSchedule(activeDate);
        }
    };

    // Add refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh Data';
    refreshBtn.style.margin = '10px';
    refreshBtn.style.padding = '5px 10px';
    refreshBtn.addEventListener('click', window.refreshAppointments);
    document.querySelector('.calendar-controls').appendChild(refreshBtn);

    // Initialize application
    async function initializeApp() {
        console.log('👨‍⚕️ Initializing application...');
        
        // Initialize logout first
        initLogout();
        
        // Load profile and data
        await loadDoctorProfile();
        await loadBookings();

        console.log('✅ All data loaded, generating calendar...');
        generateCalendar();
    }

    // Start the application
    initializeApp();
});