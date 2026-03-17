const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ⚠️ ЗАМЕНИТЕ НА ID ВАШЕЙ GOOGLE ТАБЛИЦЫ
// Как найти: https://docs.google.com/spreadsheets/d/XXXXXX/edit -> XXXXXX это ID
const SHEET_ID = '1o3sjAJIom-ZhjA2lCmoUtO9iEk7SOBFrmCw9jJ4yJq8';

// Авторизация для Google Sheets
let auth;
try {
    // Пытаемся получить credentials из переменной окружения (на Render)
    if (process.env.GOOGLE_CREDENTIALS) {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        console.log('✅ Авторизация через переменные окружения');
    } else {
        // Если нет переменной окружения, пробуем локальный файл (для разработки)
        const credentials = require('./credentials.json');
        auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        console.log('✅ Авторизация через локальный файл');
    }
} catch (error) {
    console.error('❌ Ошибка авторизации:', error);
    process.exit(1);
}

// Проверка сервера
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Сервер работает!',
        timestamp: new Date().toISOString()
    });
});

// Сохранение заявки в детский лагерь
app.post('/save-child', async (req, res) => {
    try {
        const { 
            vk_id, 
            parent_name, 
            child_name, 
            child_age, 
            child_gender, 
            phone, 
            contact_method, 
            date 
        } = req.body;

        // Проверка обязательных полей
        if (!vk_id || !parent_name || !child_name || !child_age || !child_gender || !phone || !contact_method) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Заполните все обязательные поля' 
            });
        }

        console.log('📝 Получена заявка:', { child_name, child_age, phone });

        const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
        
        // Добавляем строку в таблицу
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Заявки!A:H', // Предполагается, что лист называется "Заявки"
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    date || new Date().toISOString(),
                    vk_id,
                    parent_name,
                    child_name,
                    child_age,
                    child_gender,
                    phone,
                    contact_method
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

// Получение статистики (опционально)
app.get('/stats', async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Заявки!A:H',
        });

        const rows = response.data.values || [];
        const totalApplications = rows.length - 1; // минус заголовок

        res.json({
            status: 'success',
            total_applications: totalApplications,
            last_update: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Ошибка получения статистики' 
        });
    }
});

// Health check для Render
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Endpoints:`);
    console.log(`   GET  / - проверка`);
    console.log(`   POST /save-child - сохранение заявки`);
    console.log(`   GET  /stats - статистика`);
});
