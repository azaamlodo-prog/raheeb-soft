const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'database.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/database', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'raheeb-soft.html'));
});

app.listen(PORT, () => {
  console.log(`الرهيب سوفت يعمل على http://localhost:${PORT}`);
});
