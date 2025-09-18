// Elements
const calendarBar = document.querySelector(".calendar-bar");
const scheduleList = document.querySelector(".schedule-list");
const patientDetails = document.querySelector(".patient-details");

// Toggle and Month navigation
const toggleBtn = document.getElementById("toggleViewBtn");
const monthNav = document.getElementById("monthNav");
const monthLabel = document.getElementById("monthLabel");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

let isMonthlyView = false;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Helper: format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
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
    dayEl.dataset.day = dayNum;
    dayEl.dataset.date = dateStr;
    dayEl.innerHTML = `<p>${dayName}</p><span>${dayNum} ${monthName}</span>`;

    if (i === 0) {
      dayEl.classList.add("active");
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
  const options = { weekday: "short" };

  monthLabel.textContent = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dayName = date.toLocaleDateString("en-US", options);
    const dateStr = formatDate(date);

    const dayEl = document.createElement("div");
    dayEl.classList.add("day");
    dayEl.dataset.day = d;
    dayEl.dataset.date = dateStr;
    dayEl.innerHTML = `<p>${dayName}</p><span>${d}</span>`;

    if (d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
      dayEl.classList.add("active");
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

// Load schedule from backend
function loadSchedule(dateStr) {
  scheduleList.innerHTML = "";
  patientDetails.innerHTML = "<p>Loading appointments...</p>";

  fetch(`http://localhost:5000/appointments?date=${dateStr}`)
    .then(res => {
      if (!res.ok) throw new Error("Error loading appointments");
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        scheduleList.innerHTML = "<p>No appointments scheduled.</p>";
        patientDetails.innerHTML = "<p>Select a patient to view details.</p>";
        return;
      }

      data.forEach((appt, index) => {
        // Use safe placeholders
        const name = appt.name || "N/A";
        const reason = appt.reason || "N/A";
        const time = appt.time || "N/A";

        const item = document.createElement("div");
        item.classList.add("schedule-item");
        item.innerHTML = `
          <div class="time">${time}</div>
          <div class="patient">
            <img src="images/Generic avatar.png" alt="Patient" />
            <div class="details">
              <p><strong>${name}</strong></p>
              <p>${reason}</p>
            </div>
          </div>
        `;

        item.addEventListener("click", () => {
          document.querySelectorAll(".schedule-item").forEach(i => i.classList.remove("active"));
          item.classList.add("active");
          showPatientDetails(appt);
        });

        // Show first appointment by default
        if (index === 0) {
          item.classList.add("active");
          showPatientDetails(appt);
        }

        scheduleList.appendChild(item);
      });
    })
    .catch(err => {
      scheduleList.innerHTML = "<p>Error loading appointments.</p>";
      patientDetails.innerHTML = "<p>Error loading appointments.</p>";
      console.error(err);
    });
}

// Show patient details safely
function showPatientDetails(appt) {
  const name = appt.name || "N/A";
  const age = appt.age || "N/A";
  const condition = appt.condition || "N/A";
  const reason = appt.reason || "N/A";
  const notes = appt.notes || "N/A";

  patientDetails.innerHTML = `
    <img src="images/Generic avatar.png" alt="Patient" />
    <h2>${name}</h2>
    <p><strong>Age:</strong> ${age}</p>
    <p><strong>Condition:</strong> ${condition}</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p><strong>Notes:</strong> ${notes}</p>
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

// Initialize
generateCalendar();
