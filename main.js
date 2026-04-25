const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fs = require('fs'); // Thêm fs để đọc file chứng chỉ SSL

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARE SETUP
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Cho phép truy cập file HTML, CSS

// ==========================================
// 2. DATABASE CONNECTION (Cập nhật kết nối Aiven Cloud)
// ==========================================

const pool = mysql.createPool({
    host: 'mysql-2c755bee-thinhnguyen672007-cc21.c.aivencloud.com', //
    user: 'avnadmin', 
    password: 'AVNS_3BtTJWUGEBOVeuI7hUx',
    database: 'defaultdb', 
    port: 18719, 
    ssl: {
        ca: fs.readFileSync(__dirname + '/ca.pem'), 
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==========================================
// 3. API ROUTES
// ==========================================

// Trang chủ gửi file HTML
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/main.html');
});

// READ: Lấy danh sách hoạt động
app.get('/api/activities', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM activities ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('Lỗi lấy dữ liệu:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// CREATE: Thêm hoạt động mới
app.post('/api/activities', async (req, res) => {
    const { activity_name } = req.body;
    if (!activity_name) return res.status(400).json({ error: 'Name required' });
    try {
        const [result] = await pool.query('INSERT INTO activities (activity_name) VALUES (?)', [activity_name]);
        res.status(201).json({ id: result.insertId, activity_name, is_completed: 0 });
    } catch (err) {
        console.error('Lỗi thêm dữ liệu:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE & DELETE (Giữ nguyên như code cũ của bạn)
app.put('/api/activities/:id', async (req, res) => {
    const { id } = req.params;
    const { is_completed } = req.body;
    try {
        await pool.query('UPDATE activities SET is_completed = ? WHERE id = ?', [is_completed, id]);
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).send(err); }
});

app.delete('/api/activities/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM activities WHERE id = ?', [id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).send(err); }
});

// 4. START THE SERVER
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});