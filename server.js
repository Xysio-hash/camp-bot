const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Простейшая настройка CORS
app.use(cors());
app.use(bodyParser.json());

// Главная страница
app.get('/', (req, res) => {
    res.send('Сервер работает!');
});

// Только этот endpoint для теста
app.post('/save-child-quiz', (req, res) => {
    console.log('Получены данные:', req.body);
    res.json({ status: 'success', message: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
