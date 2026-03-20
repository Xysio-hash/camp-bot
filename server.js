const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Разрешаем запросы с любых доменов
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
app.options('/save-child-quiz', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});

// Сохранение результатов теста (новый endpoint)
app.post('/save-child-quiz', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const { 
            vk_id, 
            parent_name, 
            child_gender, 
            child_age, 
            tech_interest, 
            social_preference, 
            competitive_spirit, 
            physical_readiness,
            total_score,
            phone,
            date 
        } = req.body;
        
        console.log('📝 Получены результаты теста:', { parent_name, child_age, total_score });
        
        // Проверяем, есть ли авторизация
        if (!auth) {
            throw new Error('Нет авторизации Google Sheets');
        }

        // Преобразуем значения ответов в читаемый вид
        const techMap = {
            'very': 'Очень увлекается',
            'somewhat': 'Интересуется, но не фанат',
            'little': 'Не особо',
            'not': 'Совсем не интересуется'
        };
        
        const socialMap = {
            'team': 'В команде',
            'friends': 'С 1-2 друзьями',
            'mixed': 'По настроению',
            'alone': 'Один'
        };
        
        const competitiveMap = {
            'very': 'Обожает соревнования',
            'sometimes': 'Нравится, но не расстраивается',
            'rarely': 'Не любит соревноваться',
            'never': 'Избегает соревнований'
        };
        
        const physicalMap = {
            'excellent': 'Отлично',
            'good': 'Хорошо',
            'average': 'Средне',
            'low': 'Слабо'
        };
        
        const genderText = child_gender === 'Мальчик' ? 'Мальчик' : 'Девочка';
        
        const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
        
        // Добавляем строку в таблицу
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Тесты!A:M',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    date || new Date().toISOString(),
                    vk_id || '',
                    parent_name || '',
                    genderText,
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

        console.log('✅ Результаты сохранены в Google таблицу');
        
        res.json({ 
            status: 'success', 
            message: 'Результаты успешно сохранены',
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

// Старый endpoint для совместимости (если нужно)
app.post('/save-child', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ status: 'success', message: 'Используйте /save-child-quiz' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌍 CORS разрешен для всех доменов`);
    console.log(`📊 Endpoint для тестов: /save-child-quiz`);
});
