(async function() {
  // --------------------------
  // Elements
  // --------------------------
  const monthLabel = document.getElementById('monthLabel');
  const calendarGrid = document.getElementById('calendarGrid');
  const slotGrid = document.getElementById('slotGrid');
  const bookBtn = document.getElementById('bookBtn');
  const welcome = document.querySelector('.logged-in-text');
  const bookModal = document.getElementById('bookModal');
  const bookMessage = document.getElementById('bookMessage');
  const confirmBook = document.getElementById('confirmBook');
  const cancelBook = document.getElementById('cancelBook');
  const noSlotsMsg = document.getElementById('noSlotsMsg');
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const confirmLogout = document.getElementById("confirmLogout");
  const cancelLogout = document.getElementById("cancelLogout");

  // --------------------------
  // State
  // --------------------------
  let selectedDate = new Date();
  let selectedTime = null;
  let currentDate = new Date();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  // --------------------------
  // Display Logged-in User
  // --------------------------
  function displayWelcome() {
    const welcome = document.querySelector('.logged-in-text');
    if (!welcome) return;

    const user = JSON.parse(localStorage.getItem('loggedUser'));
    if (user && user.firstName) {
      welcome.textContent = `Welcome, ${user.firstName} ${user.lastName || ''}`;
    } else {
      welcome.textContent = 'Welcome, Guest';
    }
  }
  displayWelcome();

  // --------------------------
  // Logout Modal
  // --------------------------
  if (logoutBtn) {
    logoutBtn.addEventListener("click", e => {
      e.preventDefault();
      logoutModal.style.display = "flex";
    });
  }
  if (cancelLogout) {
    cancelLogout.addEventListener("click", () => logoutModal.style.display = "none");
  }
  if (confirmLogout) {
    confirmLogout.addEventListener("click", async () => {
      try {
        await fetch('http://localhost:3000/logout', { method: 'POST', credentials: 'include' });
        localStorage.removeItem('loggedUser'); 
        if (welcome) welcome.textContent = 'Welcome, Guest';
        window.location.href = "index.html";
      } catch (err) {
        console.error('Logout failed', err);
      }
    });
  }
  window.addEventListener("click", e => { if (e.target === logoutModal) logoutModal.style.display = "none"; });

  // --------------------------
  // Calendar Renderer
  // --------------------------
  function updateCalendar() {
    monthLabel.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    calendarGrid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let firstDay = new Date(year, month, 1).getDay();
    if (firstDay === 0) firstDay = 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i < firstDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cell disabled';
      calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = day;

      const today = new Date();
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        cell.classList.add('today');
      }

      const cellDate = new Date(year, month, day);
      if (cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        cell.classList.add('disabled');
      }

      cell.tabIndex = 0;
      cell.addEventListener('click', () => {
        if (cell.classList.contains('disabled')) return;
        document.querySelectorAll("#calendarGrid .cell").forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        selectedDate = cellDate;
        generateSlots(cellDate);
      });
      cell.addEventListener('keydown', e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cell.click(); }
      });

      calendarGrid.appendChild(cell);
    }
  }

  // --------------------------
  // Slot Renderer
  // --------------------------
  function generateSlots(date) {
    slotGrid.innerHTML = '';
    noSlotsMsg.style.display = 'none';
    selectedTime = null;

    const dayOfWeek = date.getDay();
    let startHour, endHour;

    if (dayOfWeek === 0) { noSlotsMsg.style.display = 'block'; return; }
    else if (dayOfWeek === 6) { startHour = 9; endHour = 13; }
    else { startHour = 8; endHour = 16; }

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let min of [0, 30]) {
        if (hour === endHour && min > 0) continue;
        const timeStr = `${String(hour).padStart(2,"0")}:${min === 0 ? "00" : "30"}`;
        const btn = document.createElement('button');
        btn.className = 'slot';
        btn.textContent = timeStr;
        btn.addEventListener('click', () => {
          document.querySelectorAll(".slot").forEach(s => s.classList.remove('selected'));
          btn.classList.add('selected');
          selectedTime = timeStr;
        });
        slotGrid.appendChild(btn);
      }
    }
  }

  // --------------------------
  // Month Navigation
  // --------------------------
  document.getElementById("prevMonth").addEventListener("click", () => { 
    currentDate.setMonth(currentDate.getMonth() - 1); 
    updateCalendar(); 
  });
  document.getElementById("nextMonth").addEventListener("click", () => { 
    currentDate.setMonth(currentDate.getMonth() + 1); 
    updateCalendar(); 
  });

  // --------------------------
  // Booking modal
  // --------------------------
  if (bookBtn && bookModal && bookMessage && confirmBook && cancelBook) {
    bookBtn.addEventListener("click", e => {
      e.preventDefault();
      if (!selectedTime || !selectedDate) {
        alert("Please select a date and time slot before booking.");
        return;
      }
      bookMessage.textContent = `Confirm booking for ${selectedDate.toDateString()} at ${selectedTime}?`;
      bookModal.style.display = "flex";
    });

    cancelBook.addEventListener("click", () => bookModal.style.display = "none");

    confirmBook.addEventListener("click", async () => {
  try {
    const user = JSON.parse(localStorage.getItem('loggedUser'));
    if (!user) throw new Error("User not logged in");

    const payload = {
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      userId: user.id
    };

    const res = await fetch("http://localhost:3000/book", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Booking failed");
    }

    // ✅ Add booking to user's appointment history
    if (!user.appointments) user.appointments = [];
    user.appointments.push({
      date: selectedDate.toDateString(),
      time: selectedTime,
      doctor: "Not assigned", // optional, you can fill if you have doctor info
      status: "Confirmed"
    });

    // Save back to localStorage
    localStorage.setItem('loggedUser', JSON.stringify(user));

    bookModal.style.display = "none";
    window.location.href = "bookingConfirmation.html";

  } catch (err) {
    console.error(err);
    alert(err.message || "Booking failed. Please try again.");
  }
});


    window.addEventListener("click", e => { if (e.target === bookModal) bookModal.style.display = "none"; });
  }

  updateCalendar();
})();
