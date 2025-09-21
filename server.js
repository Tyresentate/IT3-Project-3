const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('.')); 

// Database connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'clinicdb'
};


app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    //validation
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    
    try {
        // Connect to the database
        const connection = await mysql.createConnection(dbConfig);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user into the database
        const [result] = await connection.execute(
            'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
            [firstName, lastName, email.toLowerCase(), hashedPassword]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            message: 'User registered successfully'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate emails
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'Email already exists' });
        } else {
            res.status(500).json({ message: 'Registration failed' });
        }
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Visit http://localhost:3000 to see your registration form');
});