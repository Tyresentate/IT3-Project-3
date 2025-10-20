// ViewSchedule.js - DIRECT BOOKINGS TABLE VERSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Loading ViewSchedule...');
    
    // Check if doctor is logged in
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');
    if (!loggedUser.id || !loggedUser.doctorId) {
        alert('Please login as a doctor');
        window.location.href = 'login.html';
        return;
    }

    // Update doctor name
    document.getElementById('doctorNameDisplay').textContent = `Dr. ${loggedUser.firstName} ${loggedUser.lastName}`;

    // Load bookings directly from database
    async function loadBookings() {
        console.log('📥 Fetching from /bookings endpoint...');
        
        try {
            const response = await fetch('http://localhost:3000/bookings');
            const bookings = await response.json();
            
            console.log('✅ Bookings data:', bookings);
            
            // Display the raw data
            displayBookings(bookings);
            
        } catch (error) {
            console.error('❌ Error:', error);
            document.querySelector(".schedule-list").innerHTML = '<p>Error loading bookings</p>';
        }
    }

    // Display bookings directly
    function displayBookings(bookings) {
        const scheduleList = document.querySelector(".schedule-list");
        
        if (!bookings || bookings.length === 0) {
            scheduleList.innerHTML = '<p>No bookings found in database</p>';
            return;
        }

        // Just show all bookings as a simple list
        scheduleList.innerHTML = bookings.map(booking => `
            <div class="schedule-item" style="border: 1px solid #ccc; padding: 10px; margin: 5px;">
                <strong>${booking.name || 'No name'}</strong><br>
                Date: ${booking.date} | Time: ${booking.time}<br>
                Reason: ${booking.reason || 'No reason'}
            </div>
        `).join('');

        console.log('📋 Displayed bookings:', bookings.length);
    }

    // Load bookings immediately
    loadBookings();

    // Add refresh button
    window.refreshAppointments = loadBookings;
});