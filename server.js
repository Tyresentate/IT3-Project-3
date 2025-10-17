const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // adjust if needed
  credentials: true
}));

// Session setup (to keep user logged in)
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Database config
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'clinicdb'
};

// --------------------------
// Register route
// --------------------------

app.post('/Register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);

    const [existingUser] = await connection.execute(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.end();
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await connection.execute(
      'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword]
    );

    const [rows] = await connection.execute(
      'SELECT user_id, first_name, last_name, email FROM user WHERE user_id = ?',
      [result.insertId]
    );

    // Fetch appointments (will be empty for new user)
    const [appointments] = await connection.execute(
      'SELECT booking_id, date, time, created_at FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
      [result.insertId]
    );

    await connection.end();

    // Send user info with appointments array (matching login format)
    res.status(200).json({
      message: 'Registration successful',
      user: {
        id: rows[0].user_id,
        firstName: rows[0].first_name,
        lastName: rows[0].last_name,
        email: rows[0].email,
        appointments: appointments.map(apt => ({
          id: apt.booking_id,
          date: apt.date,
          time: apt.time,
          doctor: "Not assigned",
          status: "Confirmed"
        }))
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login route

  app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute(
      'SELECT * FROM User WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      await connection.end();
      return res.status(400).json({ message: 'No account found with this email' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await connection.end();
      return res.status(400).json({ message: 'Incorrect password' });
    }
 // Fetch user's appointments
    const [appointments] = await connection.execute(
      'SELECT booking_id, date, time, created_at FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
      [user.user_id]
    );

    await connection.end();

    res.status(200).json({
         message: 'Login successful',
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        appointments: appointments.map(apt => ({
          id: apt.booking_id,
          date: apt.date,
          time: apt.time,
          doctor: "Not assigned",
          status: "Confirmed"
        }))
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// --------------------------
// Book appointment (/book)
// --------------------------
// Book appointment (/book) - FIXED VERSION WITH DEBUG
app.post('/book', async (req, res) => {
  const { userId, date, time } = req.body;
  
  // DEBUG: Log everything we receive
  console.log('📅 Booking request received:');
  console.log('  - User ID:', userId);
  console.log('  - Date:', date);
  console.log('  - Time:', time);
  console.log('  - Full body:', req.body);

  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Insert the booking
    const [result] = await connection.execute(
      'INSERT INTO bookings (user_id, date, time) VALUES (?, ?, ?)',
      [userId, date, time]
    );
    
    console.log('✅ Booking inserted with ID:', result.insertId);
    
    // Get the newly created booking to verify what was saved
    const [newBooking] = await connection.execute(
      'SELECT booking_id, date, time, created_at FROM bookings WHERE booking_id = ?',
      [result.insertId]
    );
    
    console.log('📋 Retrieved booking from DB:', newBooking[0]);
    
    await connection.end();

    // Return the booking details in the response
    res.status(200).json({ 
      message: 'Booking successful',
      booking: {
        id: newBooking[0].booking_id,
        date: newBooking[0].date,
        time: newBooking[0].time,
        createdAt: newBooking[0].created_at
      }
    });
  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({ message: 'Booking failed' });
  }
});

// --------------------------
// Get patient info
// --------------------------
app.get('/patient/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // First check if user exists
    const [userRows] = await connection.execute(
      'SELECT user_id, first_name, last_name, email, phone, date_of_birth FROM user WHERE user_id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'User not found' });
    }

    // Then get patient info if it exists
    const [patientRows] = await connection.execute(
      'SELECT medical_aid, medical_aid_provider, medical_aid_plan, membership_number FROM patient WHERE user_id = ?',
      [userId]
    );

    await connection.end();

    // Combine the data
    const userData = {
      user_id: userRows[0].user_id,
      first_name: userRows[0].first_name,
      last_name: userRows[0].last_name,
      email: userRows[0].email,
      phone: userRows[0].phone,
      date_of_birth: userRows[0].date_of_birth,
      medical_aid: patientRows.length > 0 ? patientRows[0].medical_aid : null,
      medical_aid_provider: patientRows.length > 0 ? patientRows[0].medical_aid_provider : null,
      medical_aid_plan: patientRows.length > 0 ? patientRows[0].medical_aid_plan : null,
      membership_number: patientRows.length > 0 ? patientRows[0].membership_number : null
    };

    res.json(userData);

  } catch (err) {
    console.error('Error fetching patient info:', err);
    res.status(500).json({ 
      message: 'Failed to fetch patient info',
      error: err.message // This helps with debugging
    });
  }
});

// Also fix the UPDATE route to handle cases where patient record doesn't exist
app.put('/patient/:userId', async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, email, phone, dateOfBirth, medicalAid, medicalAidProvider, medicalAidPlan, membershipNumber } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Update User table
    await connection.execute(
      'UPDATE user SET first_name=?, last_name=?, email=?, phone=?, date_of_birth=? WHERE user_id=?',
      [firstName, lastName, email, phone, dateOfBirth, userId]
    );

    // Check if patient record exists
    const [existingPatient] = await connection.execute(
      'SELECT user_id FROM patient WHERE user_id = ?',
      [userId]
    );

    if (existingPatient.length > 0) {
      // Update existing patient record
      await connection.execute(
        'UPDATE patient SET medical_aid=?, medical_aid_provider=?, medical_aid_plan=?, membership_number=? WHERE user_id=?',
        [medicalAid, medicalAidProvider, medicalAidPlan, membershipNumber, userId]
      );
    } else {
      // Insert new patient record
      await connection.execute(
        'INSERT INTO patient (user_id, medical_aid, medical_aid_provider, medical_aid_plan, membership_number) VALUES (?, ?, ?, ?, ?)',
        [userId, medicalAid, medicalAidProvider, medicalAidPlan, membershipNumber]
      );
    }

    await connection.end();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating patient info:', err);
       res.status(500).json({ 
      message: 'Failed to update profile',
      error: err.message
    });
  }
});

app.get('/appointments/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT booking_id, date, time, created_at FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    await connection.end();
    
    res.json(rows);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ message: "Could not fetch appointments" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
