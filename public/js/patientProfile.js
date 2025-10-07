// --------------------------
// Logout Modal Logic
// --------------------------
const logoutBtn = document.getElementById("logoutBtn");
const logoutModal = document.getElementById("logoutModal");
const confirmLogout = document.getElementById("confirmLogout");
const cancelLogout = document.getElementById("cancelLogout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    logoutModal.style.display = "flex";
  });
}

if (cancelLogout) {
  cancelLogout.addEventListener("click", () => {
    logoutModal.style.display = "none";
  });
}

if (confirmLogout) {
  confirmLogout.addEventListener("click", () => {
    localStorage.removeItem('loggedUser'); // Clear user on logout
    window.location.href = "index.html";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === logoutModal) {
    logoutModal.style.display = "none";
  }
});

// Display user name on patient profile page
(function displayUser() {
  const welcome = document.querySelector('.logged-in-text');
  if (!welcome) return;

  const user = JSON.parse(localStorage.getItem('loggedUser') || '{}');
  if (user.firstName) {
    welcome.textContent = `Welcome, ${user.firstName} ${user.lastName || ''}`;
  } else {
    welcome.textContent = 'Welcome, Guest';
  }
})();

// --------------------------
// Fetch patient info and fill form
// --------------------------
(async function fetchPatientInfo() {
  const user = JSON.parse(localStorage.getItem('loggedUser') || '{}');
  if (!user.id) return;

  try {
    const res = await fetch(`http://localhost:3000/patient/${user.id}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const data = await res.json();
    if (!data) return;

    const form = document.querySelector('.profile-form');
    if (!form) return;

    // Map form field names to API data keys
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      dateOfBirth: 'date_of_birth',
      medicalAid: 'medical_aid',
      medicalAidProvider: 'medical_aid_provider',
      planOption: 'medical_aid_plan',
      membershipNumber: 'membership_number'
    };

    Object.keys(fieldMap).forEach(key => {
      const input = form.querySelector(`input[name="${key}"]`);
      if (!input) return;

      // Format date input
      if (key === 'dateOfBirth' && data[fieldMap[key]]) {
        input.value = new Date(data[fieldMap[key]]).toISOString().split('T')[0];
      } else {
        input.value = data[fieldMap[key]] || '';
      }
    });

    // Populate profile header
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');

    if (profileName) profileName.textContent = `${data.first_name} ${data.last_name || ''}`;
    if (profileEmail) profileEmail.textContent = data.email || 'N/A';
    if (profilePhone) profilePhone.textContent = data.phone || 'N/A';

  } catch (err) {
    console.error('Failed to fetch patient info:', err);
  }
})();

// --------------------------
// Submit updated info
// --------------------------
const form = document.querySelector('.profile-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('loggedUser') || '{}');
    if (!user.id) return alert('User not logged in');

    const updatedData = {
      firstName: form.querySelector('input[name="firstName"]')?.value || '',
      lastName: form.querySelector('input[name="lastName"]')?.value || '',
      email: form.querySelector('input[name="email"]')?.value || '',
      phone: form.querySelector('input[name="phone"]')?.value || '',
      dateOfBirth: form.querySelector('input[name="dateOfBirth"]')?.value || '',
      medicalAid: form.querySelector('input[name="medicalAid"]')?.value || '',
      medicalAidProvider: form.querySelector('input[name="medicalAidProvider"]')?.value || '',
      medicalAidPlan: form.querySelector('input[name="planOption"]')?.value || '',
      membershipNumber: form.querySelector('input[name="membershipNumber"]')?.value || ''
    };

    try {
      const res = await fetch(`http://localhost:3000/patient/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      const result = await res.json();
      
      if (res.ok) {
        // Update localStorage with new user info
        localStorage.setItem('loggedUser', JSON.stringify({
          ...user,
          firstName: updatedData.firstName,
          lastName: updatedData.lastName,
          email: updatedData.email,
          phone: updatedData.phone,
          dateOfBirth: updatedData.dateOfBirth
        }));
        
        alert(result.message);
        location.reload();
      } else {
        alert(result.message || 'Update failed');
        console.error('Update error:', result);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('An error occurred while updating your profile');
    }
  });
}

// --------------------------
// Format date helper
// --------------------------
function formatDate(dateString) {
  // Split the date string to avoid timezone issues
  let dateStr = dateString;
  
  // If it's an ISO string, extract just the date part
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  
  // Parse as local date
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const options = { 
    weekday: 'short',
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

// --------------------------
// Fetch and populate appointment history from database
// --------------------------
async function populateAppointmentHistory() {
  const user = JSON.parse(localStorage.getItem('loggedUser'));
  const tbody = document.getElementById('appointmentHistory');

  if (!tbody) return;

  // Clear existing rows
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading appointments...</td></tr>';

  if (!user || !user.id) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; color:#777; font-style:italic;">
          Please log in to view appointments
        </td>
      </tr>
    `;
    return;
  }

  try {
    // Fetch appointments from database
    const response = await fetch(`http://localhost:3000/appointments/${user.id}`);
    
    if (!response.ok) throw new Error('Failed to fetch appointments');
    
    const appointments = await response.json();

    // Clear loading message
    tbody.innerHTML = '';

    if (appointments.length > 0) {
      appointments.forEach(apt => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${formatDate(apt.date)}</td>
          <td>${apt.time}</td>
          <td>Not assigned</td>
          <td><span class="status-badge confirmed">Confirmed</span></td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; color:#777; font-style:italic;">
            No appointments found
          </td>
        </tr>
      `;
    }
  } catch (err) {
    console.error('Error fetching appointments:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; color:#e74c3c;">
          Failed to load appointments
        </td>
      </tr>
    `;
  }
}

// Call this function on page load
populateAppointmentHistory();