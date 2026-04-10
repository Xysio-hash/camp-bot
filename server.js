const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ID вашей Google Таблицы (замените на свой)
const SPREADSHEET_ID = '13jfMRrzrSiK4lWkOx2MdIg40fjBjNtDmrxz8Y6eVyBo';

// Настройка Google Sheets API через сервисный аккаунт
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

// Эндпоинт для сохранения данных квиза
app.post('/save-child-quiz', async (req, res) => {
    try {
        const data = req.body;
        
        // Подготовка строки для таблицы (порядок соответствует вашим колонкам)
        const row = [
            data.date || new Date().toLocaleString('ru-RU'),           // Дата
            data.vk_id || '',                                          // Vk Id
            data.parent_name || '',                                    // Имя Родителя
            data.child_gender || '',                                   // Пол
            data.child_age || '',                                      // Возраст
            data.social_preference || '',                              // Социальная
            data.competitive_spirit || '',                             // Соревновательность
            data.physical_readiness || '',                             // Физиология
            data.total_score || '',                                    // Баллы
            data.phone || ''                                           // Телефон
        ];
        
        // Запись в Google Таблицу
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Лист1!A:J',  // Колонки A-J (10 колонок)
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] }
        });
        
        console.log('✅ Данные записаны в Google Таблицу:', row[2], row[9]);
        res.json({ success: true, message: 'Данные сохранены' });
        
    } catch (error) {
        console.error('❌ Ошибка записи в Таблицу:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Тестовый эндпоинт
app.get('/', (req, res) => {
    res.send('✅ Сервер работает. Эндпоинт /save-child-quiz готов.');
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
