// Demo data: appointments mapped by day of month (key = date number as string)
const appointments = {
  "18": [
    { time: "09:00 - 09:30", name: "Alice Brown", reason: "Check-up", age: 29, condition: "Healthy", notes: "Routine visit" },
    { time: "10:15 - 11:00", name: "Michael Green", reason: "Follow-up", age: 45, condition: "Diabetes", notes: "Monitor sugar levels" }
  ],
  "19": [
    { time: "09:30 - 10:00", name: "Sarah Lee", reason: "Consultation", age: 37, condition: "Asthma", notes: "Review inhaler use" }
  ]
};

// Elements
const calendarBar = document.querySelector(".calendar-bar");
const scheduleList = document.querySelector(".schedule-list");
const patientDetails = document.querySelector(".patient-details");

// Generate real-time calendar (7 days starting today)
function generateCalendar() {
  const today = new Date();
  const options = { weekday: "short" }; // Mon, Tue, ...
  calendarBar.innerHTML = ""; // clear old days

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);

    const dayName = date.toLocaleDateString("en-US", options);
    const dayNum = date.getDate();
    const monthName = date.toLocaleDateString("en-US", { month: "short" });

    const dayEl = document.createElement("div");
    dayEl.classList.add("day");
    dayEl.dataset.day = dayNum;

    dayEl.innerHTML = `
      <p>${dayName}</p>
      <span>${dayNum} ${monthName}</span>
    `;

    // Default active = today
    if (i === 0) {
      dayEl.classList.add("active");
      loadSchedule(dayNum);
    }

    // Click to load appointments
    dayEl.addEventListener("click", () => {
      document.querySelectorAll(".calendar-bar .day").forEach(d => d.classList.remove("active"));
      dayEl.classList.add("active");
      loadSchedule(dayNum);
    });

    calendarBar.appendChild(dayEl);
  }
}

// Load schedule for selected day
function loadSchedule(day) {
  scheduleList.innerHTML = ""; // clear
  const dayAppointments = appointments[day] || [];

  if (dayAppointments.length === 0) {
    scheduleList.innerHTML = "<p>No appointments scheduled.</p>";
    patientDetails.innerHTML = "<p>Select a patient to view details.</p>";
    return;
  }

  dayAppointments.forEach((appt, index) => {
    const item = document.createElement("div");
    item.classList.add("schedule-item");
    item.innerHTML = `
      <div class="time">${appt.time}</div>
      <div class="patient">
        <img src="images/Generic avatar.png" alt="Patient" />
        <div class="details">
          <p><strong>${appt.name}</strong></p>
          <p>${appt.reason}</p>
        </div>
      </div>
    `;

    item.addEventListener("click", () => {
      showPatientDetails(appt);
    });

    if (index === 0) showPatientDetails(appt);

    scheduleList.appendChild(item);
  });
}

// Show patient details
function showPatientDetails(appt) {
  patientDetails.innerHTML = `
    <img src="images/Generic avatar.png" alt="Patient" />
    <h2>${appt.name}</h2>
    <p><strong>Age:</strong> ${appt.age}</p>
    <p><strong>Condition:</strong> ${appt.condition}</p>
    <p><strong>Reason:</strong> ${appt.reason}</p>
    <p><strong>Notes:</strong> ${appt.notes}</p>
  `;
}

// Initialize
generateCalendar();
