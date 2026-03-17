const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ⚠️ ЗАМЕНИТЕ НА ID ВАШЕЙ ТАБЛИЦЫ
const SHEET_ID = '1o3sjAJIom-ZhjA2lCmoUtO9iEk7SOBFrmCw9jJ4yJq8';

// Авторизация для Google Sheets
let auth;
try {
    if (process.env.GOOGLE_CREDENTIALS) {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        console.log('✅ Авторизация через переменные окружения');
    }
} catch (error) {
    console.error('❌ Ошибка авторизации:', error);
}

// Проверка сервера
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Сервер работает!',
        timestamp: new Date().toISOString()
    });
});

// Статистика
app.get('/stats', (req, res) => {
    res.json({
        status: 'success',
        message: 'Сервер готов к работе'
    });
});

// Сохранение заявки
app.post('/save-child', async (req, res) => {
    try {
        const { vk_id, parent_name, child_name, child_age, child_gender, phone, contact_method, date } = req.body;
        
        console.log('📝 Получена заявка:', { child_name, child_age });
        
        res.json({ 
            status: 'success', 
            message: 'Заявка получена (тестовый режим)',
            data: req.body
        });

    } catch (error) {
        console.error('❌ Ошибка:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
