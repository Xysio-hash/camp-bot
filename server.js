const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ⚠️ ЗАМЕНИТЕ на ID вашей Google Таблицы
const SPREADSHEET_ID = '13jfMRrzrSiK4lWkOx2MdIg40fjBjNtDmrxz8Y6eVyBo';

const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

app.post('/save-child-quiz', async (req, res) => {
    try {
        const data = req.body;
        
        // Строгий порядок: A=Дата, B=Vk Id, C=Имя, D=Пол, E=Возраст, F=Творчество, G=Социалка, H=Активность, I=Самостоятельность, J=Баллы, K=Телефон, L=Согласие
        const row = [
            data.date || new Date().toLocaleString('ru-RU'),    // A - Дата
            data.vk_id || '',                                     // B - Vk Id
            data.parent_name || '',                               // C - Имя Родителя
            data.child_gender || '',                              // D - Пол
            data.child_age || '',                                 // E - Возраст
            data.creativity || '',                                // F - Творчество
            data.social_preference || '',                         // G - Социалка
            data.activity_level || '',                            // H - Активность
            data.independence || '',                              // I - Самостоятельность
            data.total_score || '',                               // J - Баллы
            data.phone || '',                                     // K - Телефон
            data.consent_given ? 'Да' : ''                        // L - Согласие
        ];
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Лист1!A:L',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] }
        });
        
        console.log('✅ Данные записаны в Таблицу:', row[2], row[10]);
        res.json({ success: true, message: 'Данные сохранены' });
        
    } catch (error) {
        console.error('❌ Ошибка записи в Таблицу:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('✅ Сервер работает. Эндпоинт /save-child-quiz готов.');
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
