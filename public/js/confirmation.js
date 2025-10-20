const welcomeText = document.getElementById("welcomeText");
const confirmationMsg = document.getElementById("confirmationMsg");
const user = JSON.parse(localStorage.getItem("loggedUser"));

// Update welcome text
if (welcomeText) {
  welcomeText.textContent = user && user.firstName
    ? `Welcome, ${user.firstName} ${user.lastName || ''}`
    : 'Welcome, Guest';
}

// Format date helper - simplified for YYYY-MM-DD format
function formatDate(dateString) {
  if (!dateString) return 'Invalid Date';
  
  let dateStr = dateString;
  
  // Remove time if present (2025-10-20T00:00:00Z -> 2025-10-20)
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  
  // Parse YYYY-MM-DD format
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Format as "Monday, October 20, 2025"
  const options = { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

// Show latest booking
async function showLatestBooking() {
  if (!confirmationMsg) return;

  // First, try to get from localStorage (most recent booking)
  if (user && user.appointments && user.appointments.length > 0) {
    const latest = user.appointments[user.appointments.length - 1]; // Last item is most recent
    console.log('Latest booking from localStorage:', latest);
    
    const bookingDate = formatDate(latest.date);
    const bookingTime = latest.time;
    
    confirmationMsg.innerHTML = `
      Your appointment has been successfully booked for 
      <strong>${bookingDate}</strong> at <strong>${bookingTime}</strong>.<br>
      You may now close this window or return to your profile.
    `;
    return;
  }

  // If not in localStorage, try fetching from database
  if (!user?.id) {
    confirmationMsg.textContent = "No user logged in. Please log in to view bookings.";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/appointments/${user.id}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');

    const appointments = await res.json();
    console.log('Appointments from database:', appointments);
    
    if (appointments.length === 0) {
      confirmationMsg.textContent = "No booking details found. Please make a booking before viewing this page.";
      return;
    }
    
    // Get the most recent appointment (first in array if ordered DESC)
    const latest = appointments[0];
    
    const bookingDate = formatDate(latest.date);
    const bookingTime = latest.time;
    
    confirmationMsg.innerHTML = `
      Your appointment has been successfully booked for 
      <strong>${bookingDate}</strong> at <strong>${bookingTime}</strong>.<br>
      You may now close this window or return to your profile.
    `;
  } catch (err) {
    console.error('Error fetching from database:', err);
    confirmationMsg.textContent = "Error fetching booking details. Your booking may still be processing.";
  }
}

showLatestBooking();

// Logout logic
if (user) {
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const confirmLogout = document.getElementById("confirmLogout");
  const cancelLogout = document.getElementById("cancelLogout");

  if (logoutBtn && logoutModal && confirmLogout && cancelLogout) {
    logoutBtn.addEventListener("click", e => { 
      e.preventDefault(); 
      logoutModal.style.display = "flex"; 
    });
    
    cancelLogout.addEventListener("click", () => {
      logoutModal.style.display = "none";
    });
    
    confirmLogout.addEventListener("click", async () => {
      try {
        await fetch('http://localhost:3000/logout', { 
          method: 'POST', 
          credentials: 'include' 
        });
        localStorage.removeItem('loggedUser'); 
        window.location.href = "index.html";
      } catch (err) {
        console.error('Logout failed', err);
        // Still logout locally
        localStorage.removeItem('loggedUser');
        window.location.href = "index.html";
      }
    });

    window.addEventListener("click", e => { 
      if (e.target === logoutModal) {
        logoutModal.style.display = "none";
      }
    });
  }
}