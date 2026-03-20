const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

const SHEET_ID = '1o3sjAJIom-ZhjA2lCmoUtO9iEk7SOBFrmCw9jJ4yJq8';

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

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Сервер работает!' });
});

app.post('/save-child-quiz', async (req, res) => {
    console.log('📥 Получен запрос');
    console.log('📦 Тело:', req.body);
    
    try {
        const { parent_name, child_age, total_score } = req.body;
        
        if (!auth) {
            throw new Error('Нет авторизации Google Sheets');
        }

        const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Тесты!A:M',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    new Date().toISOString(),
                    req.body.vk_id || '',
                    parent_name || '',
                    req.body.child_gender === 'boy' ? 'Мальчик' : 'Девочка',
                    child_age || '',
                    req.body.tech_interest || '',
                    req.body.social_preference || '',
                    req.body.competitive_spirit || '',
                    req.body.physical_readiness || '',
                    total_score || 0,
                    req.body.phone || '',
                    '✅ Подходит',
                    'Летний детский лагерь'
                ]]
            }
        });

        console.log('✅ Сохранено');
        res.json({ status: 'success', message: 'Сохранено' });

    } catch (error) {
        console.error('❌ Ошибка:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));
