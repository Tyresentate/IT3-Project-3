const welcomeText = document.getElementById("welcomeText");
const confirmationMsg = document.getElementById("confirmationMsg");
const user = JSON.parse(localStorage.getItem("loggedUser"));

// Update welcome text
if (welcomeText) {
  welcomeText.textContent = user && user.firstName
    ? `Welcome, ${user.firstName} ${user.lastName || ''}`
    : 'Welcome, Guest';
}

// Format date helper
function formatDate(dateString) {
  let dateStr = dateString;
  
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const options = { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

// Fetch latest booking from the database
async function showLatestBooking() {
  if (!user?.id || !confirmationMsg) return;

  try {
    const res = await fetch(`http://localhost:3000/appointments/${user.id}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');

    const appointments = await res.json();
    if (appointments.length === 0) {
      confirmationMsg.textContent = "No booking details found. Please make a booking before viewing this page.";
      return;
    }
    
    // Get the most recent appointment (first in array since it's ordered DESC)
    const latest = appointments[0];
    
    const bookingDate = formatDate(latest.date);
    const bookingTime = latest.time;
    
    confirmationMsg.innerHTML = `
      Your appointment has been successfully booked for 
      <strong>${bookingDate}</strong> at <strong>${bookingTime}</strong>.<br>
      You may now close this window or return to your profile.
    `;
  } catch (err) {
    console.error(err);
    confirmationMsg.textContent = "Error fetching booking details.";
  }
}

showLatestBooking();

// Logout logic
if (user) {
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const confirmLogout = document.getElementById("confirmLogout");
  const cancelLogout = document.getElementById("cancelLogout");

  logoutBtn?.addEventListener("click", e => { e.preventDefault(); logoutModal.style.display = "flex"; });
  cancelLogout?.addEventListener("click", () => logoutModal.style.display = "none");
  confirmLogout?.addEventListener("click", async () => {
    try {
      await fetch('http://localhost:3000/logout', { method: 'POST', credentials: 'include' });
      localStorage.removeItem('loggedUser'); 
      window.location.href = "index.html";
    } catch (err) {
      console.error('Logout failed', err);
    }
  });

  window.addEventListener("click", e => { if (e.target === logoutModal) logoutModal.style.display = "none"; });
}