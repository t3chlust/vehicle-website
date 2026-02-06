const express = require('express');
const path = require('path');
const { SMSRu } = require('node-sms-ru');

const app = express();

// Инициализация SMS.RU с API ключом
const smsru = new SMSRu('A1D81123-7ABC-927E-9F79-5AD4357DFD9A');

// Хранилище кодов подтверждения (номер телефона => {код, время создания})
const verificationCodes = new Map();

// TTL для кода подтверждения (10 минут)
const CODE_TTL = 10 * 60 * 1000;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/manufacturer.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'manufacturer.html'));
});

// Генерация случайного 4-значного кода
function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// POST /send-sms - отправка кода подтверждения
app.post('/send-sms', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Номер телефона не предоставлен' });
    }

    // Специальная обработка для админского номера
    const ADMIN_PHONE = '+79829817369';
    if (phone === ADMIN_PHONE) {
      // Для админа используем фиксированный код "1" без отправки СМС
      const code = '1';
      verificationCodes.set(phone, {
        code: code,
        createdAt: Date.now()
      });
      console.log(`✅ Админский номер ${phone} - код установлен на: ${code}`);
      
      return res.json({ 
        success: true, 
        message: 'Код подтверждения готов (админский номер)',
        smsId: 'admin-local-001'
      });
    }

    // Генерируем код для обычных номеров
    const code = generateCode();
    
    // Сохраняем код с временем создания
    verificationCodes.set(phone, {
      code: code,
      createdAt: Date.now()
    });

    // Подготавливаем сообщение
    const message = `Ваш код подтверждения: ${code}`;

    // Отправляем СМС через SMS.RU с параметром test=1
    const sendResult = await smsru.sendSms({
      to: phone,
      msg: message
      // test: 1  // Тестовый режим - СМС не будет реально отправлена
    });

    // Результат успешно получен
    if (sendResult.status === 'OK') {
      const smsData = sendResult.sms[phone];
      if (smsData && smsData.status === 'OK') {
        console.log(`✅ СМС отправлена на ${phone} (ID: ${smsData.sms_id})`);
        
        res.json({ 
          success: true, 
          message: 'Код подтверждения отправлен на номер ' + phone,
          smsId: smsData.sms_id
        });
      } else {
        console.error('❌ Ошибка при отправке СМС на номер:', smsData);
        res.status(500).json({ 
          success: false, 
          error: 'Ошибка при отправке СМС: ' + (smsData?.status || 'Неизвестная ошибка')
        });
      }
    } else {
      console.error('❌ Ошибка при отправке СМС:', sendResult);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при отправке СМС: ' + (sendResult.status || 'Неизвестная ошибка')
      });
    }

  } catch (error) {
    console.error('❌ Ошибка на сервере:', error);
    res.status(500).json({ success: false, error: 'Ошибка на сервере: ' + error.message });
  }
});

// POST /verify-code - проверка кода подтверждения
app.post('/verify-code', (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, error: 'Не предоставлены номер телефона или код' });
    }

    // Проверяем наличие кода
    const storedData = verificationCodes.get(phone);
    
    if (!storedData) {
      return res.status(400).json({ success: false, error: 'Код не был отправлен или истёк срок действия' });
    }

    // Проверяем TTL
    if (Date.now() - storedData.createdAt > CODE_TTL) {
      verificationCodes.delete(phone);
      return res.status(400).json({ success: false, error: 'Код истёк. Запросите новый код' });
    }

    // Проверяем правильность кода
    if (storedData.code === code) {
      // Удаляем использованный код
      verificationCodes.delete(phone);
      console.log(`✅ Код подтвержден для ${phone}`);
      
      res.json({ success: true, message: 'Код подтвержден успешно' });
    } else {
      res.status(400).json({ success: false, error: 'Неверный код подтверждения' });
    }

  } catch (error) {
    console.error('❌ Ошибка на сервере:', error);
    res.status(500).json({ success: false, error: 'Ошибка на сервере: ' + error.message });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Сайт запущен на порту 3000');
});

