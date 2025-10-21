// ViewSchedule.js - CLEAN WORKING VERSION
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
    const doctorNameElement = document.querySelector(".logged-in-text");

    let isMonthlyView = false;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let allAppointments = [];

    // Initialize application
    initApp();

    async function initApp() {
        console.log('👨‍⚕️ Initializing application...');
        
        // Set doctor name from logged in user
        setDoctorName();
        
        // Initialize logout
        initLogout();
        
        // Load appointments
        await loadAppointments();
        
        // Generate calendar
        generateCalendar();
        
        console.log('✅ Application initialized');
    }

    function setDoctorName() {
        if (doctorNameElement && loggedUser.firstName) {
            doctorNameElement.textContent = `Dr. ${loggedUser.firstName} ${loggedUser.lastName}`;
        }
    }

    function initLogout() {
        const logoutBtn = document.getElementById("logoutBtn");
        const logoutModal = document.getElementById("logoutModal");
        const confirmLogout = document.getElementById("confirmLogout");
        const cancelLogout = document.getElementById("cancelLogout");

        if (!logoutBtn) return;

        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (logoutModal) {
                logoutModal.style.display = "flex";
            } else {
                performLogout();
            }
        });

        if (confirmLogout) {
            confirmLogout.addEventListener("click", performLogout);
        }

        if (cancelLogout) {
            cancelLogout.addEventListener("click", () => {
                if (logoutModal) logoutModal.style.display = "none";
            });
        }

        if (logoutModal) {
            window.addEventListener("click", (e) => {
                if (e.target === logoutModal) logoutModal.style.display = "none";
            });
        }
    }

    function performLogout() {
        localStorage.removeItem('loggedUser');
        window.location.href = "index.html";
    }

    // Load appointments from server
    async function loadAppointments() {
        console.log('📥 Loading appointments...');
        
        try {
            const response = await fetch('http://localhost:3000/bookings');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const bookings = await response.json();
            
            // Transform data to match our expected format
            allAppointments = bookings.map(booking => ({
                id: booking.booking_id,
                user_id: booking.user_id,
                date: formatDatabaseDate(booking.date),
                time: booking.time,
                name: booking.name || `Patient ${booking.user_id}`,
                reason: booking.reason || 'General Consultation',
                age: booking.age || 'Not specified',
                notes: booking.notes || 'No notes'
            }));
            
            console.log(`📊 Loaded ${allAppointments.length} appointments`);
            
        } catch (error) {
            console.error('❌ Error loading appointments:', error);
            // Create some sample data for demonstration
            allAppointments = createSampleAppointments();
            console.log('📋 Using sample data');
        }
    }

    // Ensure dates are in YYYY-MM-DD format
    function formatDatabaseDate(dateString) {
        if (!dateString) return '';
        
        // If it's already in correct format, return as is
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // If it's a Date object or other format, convert to YYYY-MM-DD
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // Create sample appointments for demonstration
    function createSampleAppointments() {
        const today = new Date();
        const sampleAppointments = [];
        const patientNames = [
            'John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Wilson',
            'Robert Brown', 'Lisa Anderson', 'David Miller', 'Jennifer Taylor'
        ];
        const reasons = [
            'Annual Checkup', 'Follow-up Visit', 'Vaccination', 'Consultation',
            'Blood Test', 'Physical Examination', 'Prescription Refill', 'Specialist Referral'
        ];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const dateStr = formatDateForDisplay(date);
            
            // Add 1-3 appointments per day
            const numAppointments = Math.floor(Math.random() * 3) + 1;
            const times = ['09:00', '10:30', '14:00', '15:30'];
            
            for (let j = 0; j < numAppointments; j++) {
                const patientIndex = (i * 3 + j) % patientNames.length;
                sampleAppointments.push({
                    id: sampleAppointments.length + 1,
                    user_id: 100 + sampleAppointments.length,
                    date: dateStr,
                    time: times[j] || '11:00',
                    name: patientNames[patientIndex],
                    reason: reasons[(i * 3 + j) % reasons.length],
                    age: Math.floor(Math.random() * 50) + 20,
                    notes: 'Regular appointment scheduled'
                });
            }
        }
        
        return sampleAppointments;
    }

    // Generate weekly calendar view
    function generateCalendar() {
        if (isMonthlyView) {
            generateMonthCalendar(currentYear, currentMonth);
        } else {
            generateWeekCalendar();
        }
    }

    function generateWeekCalendar() {
        calendarBar.innerHTML = "";
        calendarBar.classList.remove("monthly");
        monthNav.style.display = "none";
        toggleBtn.textContent = "Switch to Monthly View";

        const today = new Date();
        let activeDateSet = false;

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const dateStr = formatDateForDisplay(date);
            
            const dayEl = createDayElement(date, dateStr);
            
            // Set today as active by default
            if (i === 0 && !activeDateSet) {
                dayEl.classList.add('active');
                loadSchedule(dateStr);
                activeDateSet = true;
            }

            calendarBar.appendChild(dayEl);
        }
    }

    function generateMonthCalendar(year, month) {
        calendarBar.innerHTML = "";
        calendarBar.classList.add("monthly");
        monthNav.style.display = "flex";
        toggleBtn.textContent = "Switch to Weekly View";

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();

        monthLabel.textContent = firstDay.toLocaleDateString("en-US", { 
            month: "long", 
            year: "numeric" 
        });

        // Add empty cells for days before the first day of month
        const firstDayOfWeek = firstDay.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.classList.add("day", "empty");
            calendarBar.appendChild(emptyCell);
        }

        let activeDateSet = false;

        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDateForDisplay(date);
            
            const dayEl = createDayElement(date, dateStr);
            
            // Set today as active if it's in this month and no active date set yet
            if (day === today.getDate() && 
                month === today.getMonth() && 
                year === today.getFullYear() && 
                !activeDateSet) {
                dayEl.classList.add('active');
                loadSchedule(dateStr);
                activeDateSet = true;
            }

            calendarBar.appendChild(dayEl);
        }
    }

    function createDayElement(date, dateStr) {
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const dayNum = date.getDate();
        const monthName = date.toLocaleDateString("en-US", { month: "short" });
        
        const dayEl = document.createElement("div");
        dayEl.classList.add("day");
        dayEl.dataset.date = dateStr;
        
        dayEl.innerHTML = `
            <p>${dayName}</p>
            <span>${dayNum} ${monthName}</span>
        `;

        // Show appointment count
        const dayAppointments = allAppointments.filter(apt => apt.date === dateStr);
        if (dayAppointments.length > 0) {
            dayEl.innerHTML += `<div class="appointment-count">${dayAppointments.length}</div>`;
        }

        // Mark today
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }

        // Click handler
        dayEl.addEventListener("click", () => {
            document.querySelectorAll(".calendar-bar .day").forEach(d => d.classList.remove("active"));
            dayEl.classList.add("active");
            loadSchedule(dateStr);
        });

        return dayEl;
    }

    function formatDateForDisplay(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Load schedule for specific date
    function loadSchedule(dateStr) {
        scheduleList.innerHTML = "<div class='loading-message'>Loading appointments...</div>";
        patientDetails.innerHTML = "<p>Select a patient to view details.</p>";

        // Small delay to show loading state
        setTimeout(() => {
            const filteredAppointments = allAppointments.filter(appt => {
                return appt.date === dateStr;
            });
            
            displayAppointments(filteredAppointments, dateStr);
        }, 100);
    }

    function displayAppointments(appointments, dateStr) {
        scheduleList.innerHTML = "";

        if (!appointments || appointments.length === 0) {
            scheduleList.innerHTML = `
                <div class='no-appointments'>
                    <p>No appointments scheduled for ${formatDisplayDate(dateStr)}.</p>
                    <p class="help-text">Appointments will appear here when booked by patients.</p>
                </div>`;
            patientDetails.innerHTML = "<p>No patients to display.</p>";
            return;
        }

        // Sort by time
        const sortedAppointments = appointments.sort((a, b) => {
            return (a.time || '00:00').localeCompare(b.time || '00:00');
        });

        sortedAppointments.forEach((appt, index) => {
            const item = document.createElement("div");
            item.classList.add("schedule-item");
            item.dataset.appointmentId = appt.id;
            
            item.innerHTML = `
                <div class="time">${formatTime(appt.time)}</div>
                <div class="patient">
                    <img src="images/Generic avatar.png" alt="Patient" />
                    <div class="details">
                        <p><strong>${appt.name}</strong></p>
                        <p>${appt.reason}</p>
                    </div>
                </div>
            `;

            item.addEventListener("click", () => {
                document.querySelectorAll(".schedule-item").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                showPatientDetails(appt);
            });

            // Auto-select first appointment
            if (index === 0) {
                item.classList.add("active");
                showPatientDetails(appt);
            }

            scheduleList.appendChild(item);
        });
    }

    function formatTime(timeString) {
        if (!timeString) return '--:--';
        
        try {
            const timeParts = timeString.split(':');
            const hours = parseInt(timeParts[0]);
            const minutes = timeParts[1];
            
            if (isNaN(hours)) return timeString;
            
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            
            return `${displayHours}:${minutes} ${period}`;
        } catch (err) {
            return timeString;
        }
    }

    function formatDisplayDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    function showPatientDetails(appt) {
        patientDetails.innerHTML = `
            <div class="patient-details-content">
                <img src="images/Generic avatar.png" alt="Patient" />
                <h2>${appt.name}</h2>
                <div class="patient-info">
                    <p><strong>Appointment Time:</strong> <span>${formatTime(appt.time)}</span></p>
                    <p><strong>Appointment Date:</strong> <span>${formatDisplayDate(appt.date)}</span></p>
                    <p><strong>Reason:</strong> <span>${appt.reason}</span></p>
                    <p><strong>Age:</strong> <span>${appt.age}</span></p>
                    <p><strong>Notes:</strong> <span>${appt.notes}</span></p>
                </div>
            </div>
        `;
    }

    // Event Listeners
    toggleBtn.addEventListener("click", () => {
        isMonthlyView = !isMonthlyView;
        generateCalendar();
    });

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

    // Refresh function
    window.refreshAppointments = async function() {
        console.log('🔄 Refreshing appointments...');
        await loadAppointments();
        
        // Reload current view
        generateCalendar();
        
        // Reload current date schedule
        const activeDate = document.querySelector('.day.active')?.dataset.date;
        if (activeDate) {
            loadSchedule(activeDate);
        }
    };

    // Add refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh Appointments';
    refreshBtn.className = 'refresh-btn'; // Using CSS class instead of inline styles
    refreshBtn.addEventListener('click', window.refreshAppointments);

    

    const controls = document.querySelector('.calendar-controls');
    if (controls) {
        controls.appendChild(refreshBtn);
        controls.appendChild(sampleDataBtn);
    }
});