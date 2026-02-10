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
  host: process.env.DB_HOST || 'localhost',
  user: 'root',
  password: 'rhyKrag004',
  database: 'vehicle_website',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function bitToBool(value) {
  if (Buffer.isBuffer(value)) {
    return value.length > 0 && value[0] === 1;
  }
  return value === 1 || value === true;
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatPhoneForDisplay(value) {
  const digits = normalizePhoneDigits(value);
  if (!digits) return '';

  let local = digits;
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    local = digits.slice(1);
  } else if (digits.length === 10) {
    local = digits;
  }

  if (local.length === 10) {
    return `+7 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 8)}-${local.slice(8, 10)}`;
  }

  return `+${digits}`;
}

async function getLookupTables(connection) {
  const [chassis] = await connection.query('SELECT id, name FROM chassis ORDER BY id');
  const [transmission] = await connection.query('SELECT id, name FROM transmission ORDER BY id');
  const [fuel] = await connection.query('SELECT id, name FROM fuel ORDER BY id');
  const [document] = await connection.query('SELECT id, name FROM document ORDER BY id');
  const [vehicleType] = await connection.query('SELECT id, name FROM advertisement_type ORDER BY id');
  const [constructionType] = await connection.query('SELECT id, name FROM construction_type ORDER BY id');
  const [sellerTypes] = await connection.query('SELECT id, name FROM seller_type ORDER BY id');

  return { chassis, transmission, fuel, document, vehicleType, constructionType, sellerTypes };
}

function resolveIdByName(list, value, defaultId = null) {
  if (value === null || value === undefined || value === '') return defaultId;

  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) return Number(raw);

  const target = normalizeName(raw);
  const found = list.find((item) => normalizeName(item.name) === target);
  return found ? found.id : defaultId;
}

async function findUserByPhone(connection, phoneDigits) {
  if (!phoneDigits) return null;
  const [rows] = await connection.query(
    'SELECT id, name, phone FROM user_personal_data WHERE phone = ? LIMIT 1',
    [phoneDigits]
  );
  return rows[0] || null;
}

async function ensureUserByPhone(connection, phoneDigits, name) {
  const existing = await findUserByPhone(connection, phoneDigits);
  if (existing) {
    if (name && normalizeName(name) !== normalizeName(existing.name)) {
      await connection.query('UPDATE user_personal_data SET name = ? WHERE id = ?', [name, existing.id]);
      return { ...existing, name };
    }
    return existing;
  }

  if (!name) {
    throw new Error('Пользователь не найден. Укажите имя для регистрации.');
  }

  const [result] = await connection.query(
    'INSERT INTO user_personal_data (name, phone) VALUES (?, ?)',
    [name, phoneDigits]
  );

  return {
    id: result.insertId,
    name: name,
    phone: phoneDigits
  };
}

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

// POST /api/users/exists - проверить, есть ли пользователь по телефону
app.post('/api/users/exists', async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = normalizePhoneDigits(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ status: 'error', message: 'Не указан номер телефона' });
    }
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, error: 'Номер телефона не предоставлен' });
    }

    const connection = await pool.getConnection();
    const user = await findUserByPhone(connection, normalizedPhone);
    connection.release();

    if (user) {
      return res.json({ success: true, exists: true, user });
    }

    return res.json({ success: true, exists: false });
  } catch (error) {
    console.error('❌ Ошибка при проверке пользователя:', error);
    res.status(500).json({ success: false, error: 'Ошибка на сервере: ' + error.message });
  }
});

// POST /api/users/ensure - создать пользователя при необходимости
app.post('/api/users/ensure', async (req, res) => {
  try {
    const { phone, name } = req.body;
    const normalizedPhone = normalizePhoneDigits(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, error: 'Номер телефона не предоставлен' });
    }

    const connection = await pool.getConnection();
    let user;
    try {
      user = await ensureUserByPhone(connection, normalizedPhone, name);
      connection.release();
    } catch (err) {
      connection.release();
      throw err;
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Ошибка при создании пользователя:', error);
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
        a.id, a.price, a.userId, a.city, a.\`new\` AS isNew, a.sellerType, st.name AS sellerTypeName, a.tender,
        a.chassis, c.name AS chassisName, a.color, a.mileage, a.engine, a.power,
        a.transmission, t.name AS transmissionName, a.fuel, f.name AS fuelName,
        a.wheelSize, a.amphibious, a.document, d.name AS documentName,
        a.vehicleType, vt.name AS vehicleTypeName, a.constructionType, ct.name AS constructionName,
        a.brand, a.model, a.status, a.creationDate, a.capacity,
        u.name AS userName, u.phone AS userPhone
      FROM advertisement a
      LEFT JOIN chassis c ON a.chassis = c.id
      LEFT JOIN transmission t ON a.transmission = t.id
      LEFT JOIN fuel f ON a.fuel = f.id
      LEFT JOIN document d ON a.document = d.id
      LEFT JOIN advertisement_type vt ON a.vehicleType = vt.id
      LEFT JOIN construction_type ct ON a.constructionType = ct.id
      LEFT JOIN seller_type st ON a.sellerType = st.id
      LEFT JOIN user_personal_data u ON a.userId = u.id
      ORDER BY a.creationDate DESC
    `);

    // Получаем фотографии для каждого объявления
    const ads = await Promise.all(advertisements.map(async (ad) => {
      const [photos] = await connection.query(
        'SELECT photo FROM advertisement_photo WHERE advertisement = ?',
        [ad.id]
      );
      
      const title = [ad.brand, ad.model].filter(Boolean).join(' ').trim();
      const isNew = bitToBool(ad.isNew);
      const tenderFlag = bitToBool(ad.tender);
      const amphibiousFlag = bitToBool(ad.amphibious);
      const vehicleTypeName = ad.vehicleTypeName || '';

      return {
        rowIndex: ad.id,
        price: ad.price,
        name: ad.userName,
        phone: formatPhoneForDisplay(ad.userPhone),
        city: ad.city,
        condition: isNew ? 'new' : 'used',
        sellerType: ad.sellerTypeName || '',
        sellerTypeId: ad.sellerType,
        tender: tenderFlag ? 'yes' : 'no',
        wheel: ad.chassis,
        color: ad.color,
        mileage: ad.mileage,
        engine: ad.engine,
        power: ad.power,
        transmission: ad.transmissionName || '',
        fuel: ad.fuelName || '',
        wheels: ad.wheelSize || '',
        amphibious: amphibiousFlag ? 'yes' : 'no',
        document: ad.document,
        technical: vehicleTypeName,
        constructionType: ad.constructionName || '',
        manufacturer: ad.brand,
        model: ad.model,
        status: ad.status === 1 ? 'approved' : 'pending',
        creationDate: ad.creationDate,
        photos: photos.map(p => p.photo).join(','),
        wheelFormula: ad.chassisName || '',
        title: title,
        brand: ad.brand || '',
        desc: '',
        region: '',
        docs: ad.documentName || 'Без документов',
        capacity: ad.capacity || 0,
        techType: vehicleTypeName
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
      action, rowIndex, title, brand, model, price, desc, name, phone, userId, photos,
      engine, power, transmission, fuel, wheels, city, condition, sellerType, sellerTypeId,
      tender, wheelFormula, color, mileage, amphibious, docs, techType,
      constructionType, capacity
    } = req.body;

    const connection = await pool.getConnection();
    const lookups = await getLookupTables(connection);

    const resolvedSellerTypeId = resolveIdByName(
      lookups.sellerTypes || [],
      sellerTypeId || sellerType,
      lookups.sellerTypes && lookups.sellerTypes[0] ? lookups.sellerTypes[0].id : 1
    );
    const conditionFlag = condition === 'new' ? 1 : 0;
    const tenderFlag = tender === 'yes' ? 1 : 0;
    const amphibiousFlag = amphibious === 'yes' ? 1 : 0;

    const chassisId = resolveIdByName(
      lookups.chassis,
      wheelFormula,
      lookups.chassis[0] ? lookups.chassis[0].id : null
    );

    const transmissionId = resolveIdByName(
      lookups.transmission,
      transmission,
      lookups.transmission[0] ? lookups.transmission[0].id : null
    );

    const fuelId = resolveIdByName(
      lookups.fuel,
      fuel,
      lookups.fuel[0] ? lookups.fuel[0].id : null
    );

    const defaultDocumentId = resolveIdByName(
      lookups.document,
      'Без документов',
      lookups.document[0] ? lookups.document[0].id : null
    );

    const documentId = resolveIdByName(
      lookups.document,
      docs,
      defaultDocumentId
    );

    const vehicleTypeName = techType;
    const vehicleTypeId = resolveIdByName(
      lookups.vehicleType,
      vehicleTypeName,
      lookups.vehicleType[0] ? lookups.vehicleType[0].id : null
    );

    const constructionId = resolveIdByName(
      lookups.constructionType,
      constructionType,
      lookups.constructionType[0] ? lookups.constructionType[0].id : null
    );

    const normalizedPhone = normalizePhoneDigits(phone);
    let resolvedUserId = userId ? Number(userId) : null;

    try {
      const userRecord = await ensureUserByPhone(connection, normalizedPhone, name);
      if (!resolvedUserId) {
        resolvedUserId = userRecord.id;
      }

      if (action === 'create') {
        // Вставляем новое объявление
        const [result] = await connection.query(
          `INSERT INTO advertisement 
            (price, userId, city, \`new\`, sellerType, tender, chassis, 
             color, mileage, engine, power, transmission, fuel, wheelSize, 
             amphibious, document, vehicleType, constructionType, brand, model, status, capacity)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            price || 0, resolvedUserId, city, conditionFlag, resolvedSellerTypeId, tenderFlag,
            chassisId, color, mileage || 0, engine, power || 0, transmissionId, fuelId,
            wheels || '', amphibiousFlag, documentId, vehicleTypeId, constructionId,
            brand || null, model, 2, capacity || null // status = 2 (pending)
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
        await connection.query(
          `UPDATE advertisement SET 
            price = ?, userId = ?, city = ?, \`new\` = ?, sellerType = ?,
            tender = ?, chassis = ?, color = ?, mileage = ?, engine = ?, power = ?,
            transmission = ?, fuel = ?, wheelSize = ?, amphibious = ?, document = ?,
            vehicleType = ?, constructionType = ?, brand = ?, model = ?, capacity = ?
           WHERE id = ?`,
          [
            price || 0, resolvedUserId, city, conditionFlag, resolvedSellerTypeId, tenderFlag,
            chassisId, color, mileage || 0, engine, power || 0, transmissionId, fuelId,
            wheels || '', amphibiousFlag, documentId, vehicleTypeId, constructionId,
            brand || null, model, capacity || null, rowIndex
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
    const { rowIndex, phone, userId } = req.body;

    const connection = await pool.getConnection();

    try {
      // Проверяем, что объявление принадлежит пользователю
      const [ads] = await connection.query(
        `SELECT a.userId, u.phone
         FROM advertisement a
         LEFT JOIN user_personal_data u ON a.userId = u.id
         WHERE a.id = ?`,
        [rowIndex]
      );

      if (ads.length === 0) {
        connection.release();
        return res.status(404).json({ status: 'error', message: 'Объявление не найдено' });
      }

      const storedUserId = ads[0].userId ? Number(ads[0].userId) : null;
      const storedPhone = normalizePhoneDigits(ads[0].phone);
      const requestPhone = normalizePhoneDigits(phone);
      const requestUserId = userId ? Number(userId) : null;
      if ((requestUserId && storedUserId !== requestUserId) || (!requestUserId && storedPhone !== requestPhone)) {
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
// API Endpoints для запчастей
// ========================

// GET /api/parts - получить все запчасти с фотографиями
app.get('/api/parts', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [parts] = await connection.query(`
      SELECT
        p.id, p.name AS partName, p.brand, p.date, p.price, p.userId, p.condition, p.sellerType,
        st.name AS sellerTypeName, p.city,
        u.name AS userName, u.phone AS userPhone
      FROM part p
      LEFT JOIN seller_type st ON p.sellerType = st.id
      LEFT JOIN user_personal_data u ON p.userId = u.id
      ORDER BY p.date DESC
    `);

    const payload = await Promise.all(parts.map(async (part) => {
      const [photos] = await connection.query(
        'SELECT photo FROM part_photo WHERE part = ?',
        [part.id]
      );

      return {
        rowIndex: part.id,
        title: part.partName || 'Запчасть',
        partName: part.partName || '',
        brand: part.brand || '',
        date: part.date,
        price: part.price || 0,
        city: part.city || '',
        condition: bitToBool(part.condition) ? 'new' : 'used',
        sellerType: part.sellerTypeName || '',
        sellerTypeId: part.sellerType,
        name: part.userName || '',
        phone: formatPhoneForDisplay(part.userPhone),
        photos: photos.map((p) => p.photo).join(',')
      };
    }));

    connection.release();
    res.json(payload);
  } catch (error) {
    console.error('❌ Ошибка при получении запчастей:', error);
    res.status(500).json({ error: 'Ошибка при получении запчастей: ' + error.message });
  }
});

// POST /api/parts - создать или отредактировать запчасть
app.post('/api/parts', async (req, res) => {
  try {
    const {
      action,
      rowIndex,
      partName,
      brand,
      price,
      condition,
      sellerTypeId,
      city,
      phone,
      name,
      userId,
      photos
    } = req.body;

    const connection = await pool.getConnection();
    const lookups = await getLookupTables(connection);

    const normalizedPhone = normalizePhoneDigits(phone);
    if (!normalizedPhone) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Не указан номер телефона' });
    }

    const resolvedSellerTypeId = resolveIdByName(
      lookups.sellerTypes || [],
      sellerTypeId,
      lookups.sellerTypes && lookups.sellerTypes[0] ? lookups.sellerTypes[0].id : 1
    );
    const conditionFlag = condition === 'new' ? 1 : 0;
    let resolvedUserId = userId ? Number(userId) : null;

    try {
      const userRecord = await ensureUserByPhone(connection, normalizedPhone, name);
      if (!resolvedUserId) {
        resolvedUserId = userRecord.id;
      }

      if (action === 'create') {
        const [result] = await connection.query(
          `INSERT INTO part
            (name, brand, date, price, userId, condition, sellerType, city)
           VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
          [
            partName || 'Запчасть',
            brand || null,
            price || 0,
            resolvedUserId,
            conditionFlag,
            resolvedSellerTypeId,
            city || null
          ]
        );

        const partId = result.insertId;

        if (photos && photos.length > 0) {
          const photoUrls = photos.split(',').filter((p) => p.trim());
          for (const photoUrl of photoUrls) {
            await connection.query(
              'INSERT INTO part_photo (part, photo) VALUES (?, ?)',
              [partId, photoUrl.trim()]
            );
          }
        }

        connection.release();
        res.json({ status: 'success', message: 'Запчасть создана', id: partId });
      } else if (action === 'edit') {
        await connection.query(
          `UPDATE part SET
            name = ?, brand = ?, price = ?, userId = ?, condition = ?, sellerType = ?, city = ?
           WHERE id = ?`,
          [
            partName || 'Запчасть',
            brand || null,
            price || 0,
            resolvedUserId,
            conditionFlag,
            resolvedSellerTypeId,
            city || null,
            rowIndex
          ]
        );

        await connection.query('DELETE FROM part_photo WHERE part = ?', [rowIndex]);
        if (photos && photos.length > 0) {
          const photoUrls = photos.split(',').filter((p) => p.trim());
          for (const photoUrl of photoUrls) {
            await connection.query(
              'INSERT INTO part_photo (part, photo) VALUES (?, ?)',
              [rowIndex, photoUrl.trim()]
            );
          }
        }

        connection.release();
        res.json({ status: 'success', message: 'Запчасть обновлена' });
      }
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('❌ Ошибка при создании/редактировании запчасти:', error);
    res.status(500).json({ status: 'error', message: 'Ошибка: ' + error.message });
  }
});

// POST /api/parts/delete - удалить запчасть
app.post('/api/parts/delete', async (req, res) => {
  try {
    const { rowIndex, phone, userId } = req.body;

    const connection = await pool.getConnection();

    try {
      const [parts] = await connection.query(
        `SELECT p.userId, u.phone
         FROM part p
         LEFT JOIN user_personal_data u ON p.userId = u.id
         WHERE p.id = ?`,
        [rowIndex]
      );

      if (parts.length === 0) {
        connection.release();
        return res.status(404).json({ status: 'error', message: 'Запчасть не найдена' });
      }

      const storedUserId = parts[0].userId ? Number(parts[0].userId) : null;
      const storedPhone = normalizePhoneDigits(parts[0].phone);
      const requestPhone = normalizePhoneDigits(phone);
      const requestUserId = userId ? Number(userId) : null;
      if ((requestUserId && storedUserId !== requestUserId) || (!requestUserId && storedPhone !== requestPhone)) {
        connection.release();
        return res.status(403).json({ status: 'error', message: 'Доступ запрещен' });
      }

      await connection.query('DELETE FROM part_photo WHERE part = ?', [rowIndex]);
      await connection.query('DELETE FROM part WHERE id = ?', [rowIndex]);

      connection.release();
      res.json({ status: 'success', message: 'Запчасть удалена' });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('❌ Ошибка при удалении запчасти:', error);
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
    const [manufacturers] = await connection.query('SELECT * FROM manufacturer_cards ORDER BY name');

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
      FROM manufacturer_cards m
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
// API Endpoints для фильтров
// ========================

app.get('/api/filters', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const lookups = await getLookupTables(connection);
    connection.release();

    res.json({
      chassis: lookups.chassis,
      transmission: lookups.transmission,
      fuel: lookups.fuel,
      document: lookups.document,
      vehicleType: lookups.vehicleType,
      constructionType: lookups.constructionType,
      sellerType: lookups.sellerTypes
    });
  } catch (error) {
    console.error('❌ Ошибка при получении фильтров:', error);
    res.status(500).json({ error: 'Ошибка при получении фильтров: ' + error.message });
  }
});

// ========================
// Запуск сервера
// ========================

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Сайт запущен на порту ${PORT}`);
  console.log(`📊 Подключение к MariaDB: vehicle_website`);
});

