const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Конфигурация Google Sheets
const SHEET_ID = 'ЗДЕСЬ_ID_ВАШЕЙ_ТАБЛИЦЫ'; // Вставьте ID вашей таблицы

// Авторизация для Google Sheets
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json', // Файл с ключами (получите ниже)
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Проверка сервера
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Сервер работает!' });
});

// Сохранение заявки
app.post('/save-child', async (req, res) => {
    try {
        const { vk_id, parent_name, child_name, child_age, child_gender, phone, contact_method, date } = req.body;
        
        const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
        
        // Добавляем строку в таблицу
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Заявки!A:H',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    date,
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
        
        res.json({ status: 'success', message: 'Данные сохранены' });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ status: 'error', message: 'Ошибка сервера' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
