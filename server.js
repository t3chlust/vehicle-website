const express = require('express');
const path = require('path');
const { SMSRu } = require('node-sms-ru');
const mysql = require('mysql2/promise');

const app = express();

// Инициализация SMS.RU с API ключом
const smsru = new SMSRu('A1D81123-7ABC-927E-9F79-5AD4357DFD9A');

// Хранилище кодов подтверждения (номер телефона => {код, время создания})
const verificationCodes = new Map();

// TTL для кода подтверждения (10 минут)
const CODE_TTL = 10 * 60 * 1000;

// Создаем пул соединений с MariaDB
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'vehicle-website',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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

    // Отправляем СМС через SMS.RU
    const sendResult = await smsru.sendSms({
      to: phone,
      msg: message,
      from: 'vezdehod.ru'
    });

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

// ========================
// API Endpoints для работы с объявлениями
// ========================

// GET /api/ads - получить все объявления с фотографиями
app.get('/api/ads', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Получаем все объявления
    const [advertisements] = await connection.query(`
      SELECT 
        a.id, a.price, a.name, a.phone, a.city, a.\`condition\`, a.sellerType, a.tender,
        a.wheel, a.color, a.mileage, a.engine, a.power, a.transmission, a.fuel, a.wheels,
        a.amphibious, a.document, a.technical, a.constructionType, a.brand,
        a.model, a.status, a.creationDate
      FROM advertisement a
      ORDER BY a.creationDate DESC
    `);

    // Получаем фотографии для каждого объявления
    const ads = await Promise.all(advertisements.map(async (ad) => {
      const [photos] = await connection.query(
        'SELECT photo FROM advertisement_photo WHERE advertisement = ?',
        [ad.id]
      );
      
      const title = [ad.brand, ad.model].filter(Boolean).join(' ').trim();

      return {
        rowIndex: ad.id,
        price: ad.price,
        name: ad.name,
        phone: ad.phone,
        city: ad.city,
        condition: ad.condition === 1 ? 'new' : 'used',
        sellerType: ad.sellerType === 1 ? 'factory' : (ad.sellerType === 2 ? 'dealer' : 'private'),
        tender: ad.tender ? 'yes' : 'no',
        wheel: ad.wheel,
        color: ad.color,
        mileage: ad.mileage,
        engine: ad.engine,
        power: ad.power,
        transmission: ad.transmission === 1 ? 'АКПП' : 'МКПП',
        fuel: ad.fuel === 1 ? 'Бензин' : 'Дизель',
        wheels: ad.wheels,
        amphibious: ad.amphibious ? 'yes' : 'no',
        document: ad.document,
        technical: ad.technical === 1 ? 'vezdehod' : (ad.technical === 2 ? 'moto' : 'trailer'),
        constructionType: ad.constructionType === 1 ? 'Цельнорамный' : 'Переломный',
        manufacturer: ad.brand,
        model: ad.model,
        status: ad.status === 1 ? 'approved' : 'pending',
        creationDate: ad.creationDate,
        photos: photos.map(p => p.photo).join(','),
        wheelFormula: ad.wheel === 1 ? 'Колёсный' : 'Гусеничный',
        title: title,
        brand: ad.brand || '',
        desc: '',
        region: '',
        docs: ad.document === 1 ? 'ЭПСМ' : 'Нет',
        capacity: 0,
        techType: ad.technical === 1 ? 'vezdehod' : (ad.technical === 2 ? 'moto' : 'trailer')
      };
    }));

    connection.release();
    res.json(ads);
  } catch (error) {
    console.error('❌ Ошибка при получении объявлений:', error);
    res.status(500).json({ error: 'Ошибка при получении объявлений: ' + error.message });
  }
});

// POST /api/ads - создать или отредактировать объявление
app.post('/api/ads', async (req, res) => {
  try {
    const {
      action, rowIndex, title, brand, model, price, desc, name, phone, photos,
      engine, power, transmission, fuel, wheels, city, condition, sellerType,
      tender, wheelFormula, color, mileage, amphibious, docs, techType,
      constructionType, capacity
    } = req.body;

    const connection = await pool.getConnection();

    try {
      if (action === 'create') {
        // Вставляем новое объявление
        const conditionId = condition === 'new' ? 1 : 2;
        const sellerTypeId = sellerType === 'factory' ? 1 : (sellerType === 'dealer' ? 2 : 0);
        const transmissionId = transmission === 'АКПП' ? 1 : 2;
        const fuelId = fuel === 'Бензин' ? 1 : 2;
        const wheelId = wheelFormula === 'Колёсный' ? 1 : 2;
        const technicalId = techType === 'vezdehod' ? 1 : (techType === 'moto' ? 2 : 3);
        const constructionId = constructionType === 'Цельнорамный' ? 1 : 2;
        const documentId = docs === 'ЭПСМ' ? 1 : 0;
        const amphibiousFlag = amphibious === 'yes' ? 1 : 0;
        const tenderFlag = tender === 'yes' ? 1 : 0;

        const [result] = await connection.query(
          `INSERT INTO advertisement 
            (price, name, phone, city, condition, sellerType, tender, wheel, 
             color, mileage, engine, power, transmission, fuel, wheels, 
             amphibious, document, technical, constructionType, brand, model, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            price || 0, name, phone, city, conditionId, sellerTypeId, tenderFlag,
            wheelId, color, mileage || 0, engine, power || 0, transmissionId, fuelId,
            wheels, amphibiousFlag, documentId, technicalId, constructionId,
            brand || null, model, 2 // status = 2 (pending)
          ]
        );

        const adId = result.insertId;

        // Добавляем фотографии
        if (photos && photos.length > 0) {
          const photoUrls = photos.split(',').filter(p => p.trim());
          for (const photoUrl of photoUrls) {
            await connection.query(
              'INSERT INTO advertisement_photo (advertisement, photo) VALUES (?, ?)',
              [adId, photoUrl.trim()]
            );
          }
        }

        connection.release();
        res.json({ status: 'success', message: 'Объявление создано', id: adId });

      } else if (action === 'edit') {
        // Обновляем существующее объявление
        const conditionId = condition === 'new' ? 1 : 2;
        const sellerTypeId = sellerType === 'factory' ? 1 : (sellerType === 'dealer' ? 2 : 0);
        const transmissionId = transmission === 'АКПП' ? 1 : 2;
        const fuelId = fuel === 'Бензин' ? 1 : 2;
        const wheelId = wheelFormula === 'Колёсный' ? 1 : 2;
        const technicalId = techType === 'vezdehod' ? 1 : (techType === 'moto' ? 2 : 3);
        const constructionId = constructionType === 'Цельнорамный' ? 1 : 2;
        const documentId = docs === 'ЭПСМ' ? 1 : 0;
        const amphibiousFlag = amphibious === 'yes' ? 1 : 0;
        const tenderFlag = tender === 'yes' ? 1 : 0;

        await connection.query(
          `UPDATE advertisement SET 
            price = ?, name = ?, phone = ?, city = ?, condition = ?, sellerType = ?,
            tender = ?, wheel = ?, color = ?, mileage = ?, engine = ?, power = ?,
            transmission = ?, fuel = ?, wheels = ?, amphibious = ?, document = ?,
            technical = ?, constructionType = ?, brand = ?, model = ?
           WHERE id = ?`,
          [
            price || 0, name, phone, city, conditionId, sellerTypeId, tenderFlag,
            wheelId, color, mileage || 0, engine, power || 0, transmissionId, fuelId,
            wheels, amphibiousFlag, documentId, technicalId, constructionId,
            brand || null, model, rowIndex
          ]
        );

        // Удаляем старые фотографии
        await connection.query('DELETE FROM advertisement_photo WHERE advertisement = ?', [rowIndex]);

        // Добавляем новые фотографии
        if (photos && photos.length > 0) {
          const photoUrls = photos.split(',').filter(p => p.trim());
          for (const photoUrl of photoUrls) {
            await connection.query(
              'INSERT INTO advertisement_photo (advertisement, photo) VALUES (?, ?)',
              [rowIndex, photoUrl.trim()]
            );
          }
        }

        connection.release();
        res.json({ status: 'success', message: 'Объявление обновлено' });
      }
    } catch (err) {
      connection.release();
      throw err;
    }

  } catch (error) {
    console.error('❌ Ошибка при создании/редактировании объявления:', error);
    res.status(500).json({ status: 'error', message: 'Ошибка: ' + error.message });
  }
});

// POST /api/ads/delete - удалить объявление
app.post('/api/ads/delete', async (req, res) => {
  try {
    const { rowIndex, phone } = req.body;

    const connection = await pool.getConnection();

    try {
      // Проверяем, что объявление принадлежит пользователю
      const [ads] = await connection.query(
        'SELECT phone FROM advertisement WHERE id = ?',
        [rowIndex]
      );

      if (ads.length === 0) {
        connection.release();
        return res.status(404).json({ status: 'error', message: 'Объявление не найдено' });
      }

      if (ads[0].phone !== phone) {
        connection.release();
        return res.status(403).json({ status: 'error', message: 'Доступ запрещен' });
      }

      // Удаляем фотографии
      await connection.query('DELETE FROM advertisement_photo WHERE advertisement = ?', [rowIndex]);

      // Удаляем объявление
      await connection.query('DELETE FROM advertisement WHERE id = ?', [rowIndex]);

      connection.release();
      res.json({ status: 'success', message: 'Объявление удалено' });
    } catch (err) {
      connection.release();
      throw err;
    }

  } catch (error) {
    console.error('❌ Ошибка при удалении объявления:', error);
    res.status(500).json({ status: 'error', message: 'Ошибка: ' + error.message });
  }
});

// POST /api/ads/approve - одобрить объявление (админ)
app.post('/api/ads/approve', async (req, res) => {
  try {
    const { rowIndex } = req.body;

    const connection = await pool.getConnection();
    
    // Статус 1 = одобрено (approved)
    await connection.query('UPDATE advertisement SET status = 1 WHERE id = ?', [rowIndex]);
    
    connection.release();
    res.json({ status: 'success', message: 'Объявление одобрено' });
  } catch (error) {
    console.error('❌ Ошибка при одобрении объявления:', error);
    res.status(500).json({ status: 'error', message: 'Ошибка: ' + error.message });
  }
});

// POST /api/ads/reject - отклонить объявление (админ)
app.post('/api/ads/reject', async (req, res) => {
  try {
    const { rowIndex } = req.body;

    const connection = await pool.getConnection();
    
    // Удаляем объявление при отклонении
    await connection.query('DELETE FROM advertisement_photo WHERE advertisement = ?', [rowIndex]);
    await connection.query('DELETE FROM advertisement WHERE id = ?', [rowIndex]);
    
    connection.release();
    res.json({ status: 'success', message: 'Объявление отклонено и удалено' });
  } catch (error) {
    console.error('❌ Ошибка при отклонении объявления:', error);
    res.status(500).json({ status: 'error', message: 'Ошибка: ' + error.message });
  }
});

// ========================
// API Endpoints для производителей
// ========================

// GET /api/manufacturers - получить всех производителей с синонимами
app.get('/api/manufacturers', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Получаем всех производителей
    const [manufacturers] = await connection.query('SELECT * FROM manufacturer ORDER BY name');

    // Получаем синонимы для каждого производителя
    const result = await Promise.all(manufacturers.map(async (mfr) => {
      const [synonyms] = await connection.query(
        'SELECT name FROM manufacturer_synonym WHERE manufacturer = ?',
        [mfr.id]
      );
      
      return {
        id: mfr.id,
        name: mfr.name,
        city: mfr.city,
        logo: mfr.logo,
        vk: mfr.vk,
        youtube: mfr.youtube,
        website: mfr.website,
        rutube: mfr.rutube,
        telegram: mfr.telegram,
        synonyms: synonyms.map(s => s.name)
      };
    }));

    connection.release();
    res.json(result);
  } catch (error) {
    console.error('❌ Ошибка при получении производителей:', error);
    res.status(500).json({ error: 'Ошибка при получении производителей: ' + error.message });
  }
});

// GET /api/manufacturer-synonyms - получить данные производителей в формате для фронта
app.get('/api/manufacturer-synonyms', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Получаем производителей с синонимами
    const [manufacturers] = await connection.query(`
      SELECT 
        m.id, m.name, m.city, m.logo, m.vk, m.youtube, m.website, m.rutube, m.telegram,
        GROUP_CONCAT(ms.name SEPARATOR ',') as aliases
      FROM manufacturer m
      LEFT JOIN manufacturer_synonym ms ON m.id = ms.manufacturer
      GROUP BY m.id
      ORDER BY m.name
    `);

    // Преобразуем в формат CSV-подобный
    const csvData = manufacturers.map(m => {
      const aliases = m.aliases ? m.aliases.split(',').map(a => a.trim()) : [];
      return {
        name: m.name,
        city: m.city,
        logo: m.logo,
        vk: m.vk,
        youtube: m.youtube,
        website: m.website,
        rutube: m.rutube,
        telegram: m.telegram,
        aliases: aliases
      };
    });

    connection.release();
    res.json(csvData);
  } catch (error) {
    console.error('❌ Ошибка при получении синонимов:', error);
    res.status(500).json({ error: 'Ошибка при получении синонимов: ' + error.message });
  }
});

// ========================
// Запуск сервера
// ========================

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Сайт запущен на порту ${PORT}`);
  console.log(`📊 Подключение к MariaDB: vehicle-website`);
});

