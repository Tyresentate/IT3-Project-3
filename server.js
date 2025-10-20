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
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Database config
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'clinicdb'
};

// --------------------------
// Register patient
// --------------------------
app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

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

    const [appointments] = await connection.execute(
      'SELECT booking_id, date, time, created_at FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
      [result.insertId]
    );

    await connection.end();

    res.status(200).json({ 
      message: 'Patient registered successfully', 
      userId: result.insertId,
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to register patient', error: err.message });
  }
});

// --------------------------
// Register doctor
// --------------------------
app.post('/registerDoctor', async (req, res) => {
  const { userId, specialization, roomNumber, contactNumber } = req.body;
  if (!userId || !specialization || !roomNumber || !contactNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [existing] = await connection.execute(
      'SELECT * FROM doctor WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      await connection.end();
      return res.status(400).json({ message: 'Doctor already registered for this user' });
    }

    await connection.execute(
      'INSERT INTO doctor (user_id, specialization, room_number, contact_number) VALUES (?, ?, ?, ?)',
      [userId, specialization, roomNumber, contactNumber]
    );

    await connection.end();
    res.status(200).json({ message: 'Doctor registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to register doctor', error: err.message });
  }
});

// --------------------------
// Login
// --------------------------
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT * FROM user WHERE email = ?', [email]);

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

    const [doctor] = await connection.execute(
      'SELECT doctor_id, specialization, room_number, contact_number FROM doctor WHERE user_id = ?',
      [user.user_id]
    );

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
        phone: user.phone || '',
        dateOfBirth: user.date_of_birth || '',
        appointments: appointments.map(apt => ({
          id: apt.booking_id,
          date: apt.date,
          time: apt.time,
          doctor: "Not assigned",
          status: "Confirmed"
        })),
        doctorId: doctor[0]?.doctor_id || null,
        specialization: doctor[0]?.specialization || null,
        roomNumber: doctor[0]?.room_number || null,
        contactNumber: doctor[0]?.contact_number || null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// --------------------------
// Book appointment
// --------------------------
app.post('/book', async (req, res) => {
  const { userId, date, time } = req.body;
  console.log('Booking received:', { userId, date, time });

  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('INSERT INTO bookings (user_id, date, time) VALUES (?, ?, ?)', [userId, date, time]);
    await connection.end();

    res.status(200).json({ message: 'Booking successful' });
  } catch (err) {
    console.error('❌ Booking error:', err);
    res.status(500).json({ message: 'Booking failed', error: err.message });
  }
});

// --------------------------
// Get ALL bookings (FIXED - NO CONDITION KEYWORD)
// --------------------------
app.get('/bookings', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [bookings] = await connection.execute(`
      SELECT 
        b.booking_id,
        b.user_id,
        b.date,
        b.time,
        b.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        'General Consultation' as reason,
        TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) as age,
        'No additional notes' as notes
      FROM bookings b
      JOIN user u ON b.user_id = u.user_id
      ORDER BY b.date DESC, b.time DESC
    `);

    await connection.end();
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message });
  }
});

// --------------------------
// Get appointments for doctor (FIXED)
// --------------------------
app.get('/appointments', async (req, res) => {
  const { date } = req.query;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [appointments] = await connection.execute(`
      SELECT 
        b.booking_id as id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        b.time,
        'Checkup' as reason,
        TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) as age,
        'No additional notes' as notes
      FROM bookings b
      JOIN user u ON b.user_id = u.user_id
      WHERE b.date = ?
      ORDER BY b.time
    `, [date]);

    await connection.end();
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch appointments', error: err.message });
  }
});

// --------------------------
// Get appointments for specific user
// --------------------------
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

// --------------------------
// Get appointments for specific user (alternative endpoint)
// --------------------------
app.get('/bookings/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [appointments] = await connection.execute(`
      SELECT 
        booking_id as id,
        date,
        time,
        created_at,
        'General Checkup' as reason,
        'Confirmed' as status,
        'Not assigned' as doctor
      FROM bookings 
      WHERE user_id = ? 
      ORDER BY date DESC, time DESC
    `, [userId]);

    await connection.end();
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch user appointments', error: err.message });
  }
});

// --------------------------
// Update user profile
// --------------------------
app.patch('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { firstName, lastName, phone } = req.body;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE user SET first_name = ?, last_name = ?, phone = ? WHERE user_id = ?',
      [firstName, lastName, phone, userId]
    );
    
    await connection.end();
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
});

// --------------------------
// Get patient info
// --------------------------
app.get('/patient/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [userRows] = await connection.execute(
      'SELECT user_id, first_name, last_name, email, phone, date_of_birth FROM user WHERE user_id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'User not found' });
    }

    const [patientRows] = await connection.execute(
      'SELECT medical_aid, medical_aid_provider, medical_aid_plan, membership_number FROM patient WHERE user_id = ?',
      [userId]
    );

    await connection.end();

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
      error: err.message
    });
  }
});

// --------------------------
// Update patient info
// --------------------------
app.put('/patient/:userId', async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, email, phone, dateOfBirth, medicalAid, medicalAidProvider, medicalAidPlan, membershipNumber } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);

    await connection.execute(
      'UPDATE user SET first_name=?, last_name=?, email=?, phone=?, date_of_birth=? WHERE user_id=?',
      [firstName, lastName, email, phone, dateOfBirth, userId]
    );

    const [existingPatient] = await connection.execute(
      'SELECT user_id FROM patient WHERE user_id = ?',
      [userId]
    );

    if (existingPatient.length > 0) {
      await connection.execute(
        'UPDATE patient SET medical_aid=?, medical_aid_provider=?, medical_aid_plan=?, membership_number=? WHERE user_id=?',
        [medicalAid, medicalAidProvider, medicalAidPlan, membershipNumber, userId]
      );
    } else {
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

// --------------------------
// Patient Info Endpoints
// --------------------------

// Get all patients (users who are not doctors)
app.get('/patients', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [patients] = await connection.execute(`
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.date_of_birth,
        TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) as age
      FROM user u
      WHERE u.user_id NOT IN (SELECT user_id FROM doctor)
      ORDER BY u.first_name, u.last_name
    `);

    await connection.end();
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch patients', error: err.message });
  }
});

// Get specific patient info
app.get('/patient/:id', async (req, res) => {
  const patientId = req.params.id;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [patient] = await connection.execute(`
      SELECT 
        user_id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) as age
      FROM user 
      WHERE user_id = ?
    `, [patientId]);

    if (patient.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Patient not found' });
    }

    const [patientInfo] = await connection.execute(`
      SELECT * FROM patient_info WHERE user_id = ?
    `, [patientId]);

    await connection.end();

    res.json({
      ...patient[0],
      info: patientInfo[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch patient info', error: err.message });
  }
});

// Save/Update patient info
app.post('/patient-info', async (req, res) => {
  const {
    userId,
    gender,
    language,
    height,
    weight,
    ethnicity,
    address,
    allergies,
    medicalNotes,
    deliveryType,
    drugLine1,
    drugLine2,
    drugBrand1,
    drugGeneric1,
    drugDosage1,
    drugPack1,
    drugForm1,
    drugManufacturer1,
    drugBrand2,
    drugGeneric2,
    drugDosage2,
    drugPack2,
    drugForm2,
    drugManufacturer2,
    drugBrand3,
    drugGeneric3,
    drugDosage3,
    drugPack3,
    drugForm3,
    drugManufacturer3
  } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [existing] = await connection.execute(
      'SELECT * FROM patient_info WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      await connection.execute(`
        UPDATE patient_info SET 
          gender = ?, language = ?, height = ?, weight = ?, ethnicity = ?, address = ?,
          allergies = ?, medical_notes = ?, delivery_type = ?, drug_line_1 = ?, drug_line_2 = ?,
          drug_brand_1 = ?, drug_generic_1 = ?, drug_dosage_1 = ?, drug_pack_1 = ?, drug_form_1 = ?, drug_manufacturer_1 = ?,
          drug_brand_2 = ?, drug_generic_2 = ?, drug_dosage_2 = ?, drug_pack_2 = ?, drug_form_2 = ?, drug_manufacturer_2 = ?,
          drug_brand_3 = ?, drug_generic_3 = ?, drug_dosage_3 = ?, drug_pack_3 = ?, drug_form_3 = ?, drug_manufacturer_3 = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        gender, language, height, weight, ethnicity, address,
        allergies, medicalNotes, deliveryType, drugLine1, drugLine2,
        drugBrand1, drugGeneric1, drugDosage1, drugPack1, drugForm1, drugManufacturer1,
        drugBrand2, drugGeneric2, drugDosage2, drugPack2, drugForm2, drugManufacturer2,
        drugBrand3, drugGeneric3, drugDosage3, drugPack3, drugForm3, drugManufacturer3,
        userId
      ]);
    } else {
      await connection.execute(`
        INSERT INTO patient_info (
          user_id, gender, language, height, weight, ethnicity, address,
          allergies, medical_notes, delivery_type, drug_line_1, drug_line_2,
          drug_brand_1, drug_generic_1, drug_dosage_1, drug_pack_1, drug_form_1, drug_manufacturer_1,
          drug_brand_2, drug_generic_2, drug_dosage_2, drug_pack_2, drug_form_2, drug_manufacturer_2,
          drug_brand_3, drug_generic_3, drug_dosage_3, drug_pack_3, drug_form_3, drug_manufacturer_3
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, gender, language, height, weight, ethnicity, address,
        allergies, medicalNotes, deliveryType, drugLine1, drugLine2,
        drugBrand1, drugGeneric1, drugDosage1, drugPack1, drugForm1, drugManufacturer1,
        drugBrand2, drugGeneric2, drugDosage2, drugPack2, drugForm2, drugManufacturer2,
        drugBrand3, drugGeneric3, drugDosage3, drugPack3, drugForm3, drugManufacturer3
      ]);
    }

    await connection.end();
    res.status(200).json({ message: 'Patient information saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save patient information', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});