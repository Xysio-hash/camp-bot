const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

const SHEET_ID = '1vJuTqSqud9QvN4tPMtPBB46K2R08bbMhJ4YbCYg54R4'; // замените на ваш ID

let auth;
try {
    if (process.env.GOOGLE_CREDENTIALS) {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
        console.log('✅ Авторизация через переменные окружения');
    } else {
        console.log('❌ Нет GOOGLE_CREDENTIALS');
    }
} catch (error) {
    console.error('❌ Ошибка авторизации:', error);
}

app.get('/', (req, res) => res.json({ status: 'ok', message: 'Сервер работает!' }));

app.post('/save-child-quiz', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
        const { vk_id, parent_name, child_gender, child_age, tech_interest, social_preference, competitive_spirit, physical_readiness, total_score, phone, date } = req.body;
        console.log('📝 Получена заявка:', { parent_name, child_age, total_score });
        
        if (!auth) throw new Error('Нет авторизации Google Sheets');
        
        const techMap = { very: 'Очень увлекается', somewhat: 'Интересуется, но не фанат', little: 'Не особо', not: 'Совсем не интересуется' };
        const socialMap = { team: 'В команде', friends: 'С 1-2 друзьями', mixed: 'По настроению', alone: 'Один' };
        const competitiveMap = { very: 'Обожает соревнования', sometimes: 'Нравится, но не расстраивается', rarely: 'Не любит соревноваться', never: 'Избегает соревнований' };
        const physicalMap = { excellent: 'Отлично', good: 'Хорошо', average: 'Средне', low: 'Слабо' };
        
        const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Тесты!A:M',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    date || new Date().toISOString(),
                    vk_id || '',
                    parent_name || '',
                    child_gender === 'boy' ? 'Мальчик' : 'Девочка',
                    child_age || '',
                    techMap[tech_interest] || tech_interest,
                    socialMap[social_preference] || social_preference,
                    competitiveMap[competitive_spirit] || competitive_spirit,
                    physicalMap[physical_readiness] || physical_readiness,
                    total_score || 0,
                    phone || '',
                    '✅ Подходит',
                    'Киберразведчик'
                ]]
            }
        });
        console.log('✅ Данные сохранены в Google таблицу');
        res.json({ status: 'success', message: 'Сохранено' });
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));
