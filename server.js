const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Разрешаем запросы с любых доменов (важно для GitHub Pages)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    } else {
        console.log('❌ Нет GOOGLE_CREDENTIALS');
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

// Обработка OPTIONS запросов (для CORS)
app.options('/save-child', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});

// Сохранение заявки
app.post('/save-child', async (req, res) => {
    // Добавляем заголовки CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const { vk_id, parent_name, child_name, child_age, child_gender, phone, contact_method, date } = req.body;
        
        console.log('📝 Получена заявка:', { child_name, child_age, phone });
        
        // Проверяем, есть ли авторизация
        if (!auth) {
            throw new Error('Нет авторизации Google Sheets');
        }

        const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
        
        // Добавляем строку в таблицу
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Заявки!A:H',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    date || new Date().toISOString(),
                    vk_id || '',
                    parent_name || '',
                    child_name || '',
                    child_age || '',
                    child_gender || '',
                    phone || '',
                    contact_method || ''
                ]]
            }
        });

        console.log('✅ Данные сохранены в Google таблицу');
        
        res.json({ 
            status: 'success', 
            message: 'Заявка успешно сохранена',
            row: response.data.updates?.updatedRange || 'неизвестно'
        });

    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Ошибка сервера при сохранении данных',
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌍 CORS разрешен для всех доменов`);
});
