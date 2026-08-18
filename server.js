const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'database.json');
const HTML_FILE = path.join(__dirname, 'raheeb-soft.html');

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(HTML_FILE);
});

app.get('/api/database', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`الرهيب سوفت يعمل على المنفذ ${PORT}`);
});
