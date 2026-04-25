const express = require('express');
const mysql = require('mysql2/promise'); // We use the promise version to support async/await
const cors = require('cors');

const app = express();
const PORT = 3000;


// 1. MIDDLEWARE SETUP

app.use(cors()); // Allows our frontend (HTML/JS) to talk to this backend
app.use(express.json()); // Allows Express to understand JSON data sent in requests

// ==========================================
// 2. DATABASE CONNECTION
// ==========================================

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',              
    password: 'Thinh2007@',       
    database: 'daily_tracker',  
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// 3. API ROUTES (CRUD Operations)


// READ: Get all activities
app.get('/api/activities', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM activities ORDER BY created_at DESC');
    //khi dùng pool.query thì dữ liệu sẽ trả về hai mảng 1 mảng sẽ là các thông tin mình muốn 
    // mảng 2 trả về metadata( tên bảng, loại dữ liệu bảng)
    // dùng [row] nghĩa là chỉ cho tôi mảng 1 còn mảng 2 thì kệ 
        res.json(rows); // Send the data back to the frontend as JSON
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while fetching activities' });
    }
});

// CREATE: Add a new activity
app.post('/api/activities', async (req, res) => {
    const { activity_name } = req.body; // Extract the data sent by frontend
    
    if (!activity_name) {
        return res.status(400).json({ error: 'Activity name is required' });
    }
    
    try {

        const [result] = await pool.query(
            'INSERT INTO activities (activity_name) VALUES (?)', 
            [activity_name]
        );
        res.status(201).json({ 
            message: 'Activity added!', 
            id: result.insertId, 
            activity_name, 
            is_completed: 0 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while adding activity' });
    }
});

// UPDATE: Toggle an activity as completed/uncompleted
app.put('/api/activities/:id', async (req, res) => {
    const { id } = req.params; 
    const { is_completed } = req.body; 
    
    try {
        await pool.query(
            'UPDATE activities SET is_completed = ? WHERE id = ?', 
            [is_completed, id]
        );
        res.json({ message: 'Activity updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while updating activity' });
    }
});

// DELETE: Remove an activity
app.delete('/api/activities/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query('DELETE FROM activities WHERE id = ?', [id]);
        res.json({ message: 'Activity deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while deleting activity' });
    }
});

// ==========================================
// 4. START THE SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`Server is running! API is available at http://localhost:${PORT}`);
});
