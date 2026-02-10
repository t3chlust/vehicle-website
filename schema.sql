-- --------------------------------------------------------
-- Хост:                         185.225.34.114
-- Версия сервера:               10.11.14-MariaDB-0ubuntu0.24.04.1 - Ubuntu 24.04
-- Операционная система:         debian-linux-gnu
-- HeidiSQL Версия:              12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Дамп структуры базы данных vehicle_website
CREATE DATABASE IF NOT EXISTS `vehicle_website` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `vehicle_website`;

-- Дамп структуры для таблица vehicle_website.advertisement
CREATE TABLE IF NOT EXISTS `advertisement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `price` decimal(20,2) NOT NULL DEFAULT 0.00,
  `userId` int(11) NOT NULL DEFAULT 0,
  `new` bit(1) NOT NULL,
  `sellerType` int(11) NOT NULL DEFAULT 0,
  `tender` bit(1) NOT NULL DEFAULT b'0',
  `chassis` int(11) NOT NULL,
  `color` varchar(50) NOT NULL,
  `mileage` int(11) DEFAULT 0,
  `engine` varchar(50) DEFAULT '0',
  `power` int(11) NOT NULL DEFAULT 0,
  `transmission` int(11) DEFAULT 0,
  `fuel` int(11) NOT NULL DEFAULT 0,
  `wheelSize` varchar(50) DEFAULT '0',
  `amphibious` bit(1) NOT NULL DEFAULT b'0',
  `document` int(11) NOT NULL DEFAULT 0,
  `vehicleType` int(11) NOT NULL DEFAULT 0,
  `constructionType` int(11) NOT NULL DEFAULT 0,
  `brand` varchar(50) NOT NULL,
  `model` varchar(50) DEFAULT '0',
  `status` int(11) NOT NULL DEFAULT 0,
  `creationDate` datetime NOT NULL DEFAULT current_timestamp(),
  `capacity` int(11) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_advertisement_wheel` (`chassis`),
  KEY `FK_advertisement_fuel` (`fuel`),
  KEY `FK_advertisement_transmission` (`transmission`),
  KEY `FK_advertisement_advertisement_status` (`status`),
  KEY `FK_advertisement_construction` (`constructionType`),
  KEY `FK_advertisement_technical` (`vehicleType`),
  KEY `FK_advertisement_document` (`document`),
  KEY `advertisement_relation_8` (`sellerType`),
  KEY `advertisement_relation_9` (`userId`),
  CONSTRAINT `FK_advertisement_advertisement_status` FOREIGN KEY (`status`) REFERENCES `advertisement_status` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_advertisement_construction` FOREIGN KEY (`constructionType`) REFERENCES `construction_type` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_advertisement_document` FOREIGN KEY (`document`) REFERENCES `document` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_advertisement_fuel` FOREIGN KEY (`fuel`) REFERENCES `fuel` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
	CONSTRAINT `FK_advertisement_technical` FOREIGN KEY (`vehicleType`) REFERENCES `advertisement_type` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_advertisement_transmission` FOREIGN KEY (`transmission`) REFERENCES `transmission` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_advertisement_wheel` FOREIGN KEY (`chassis`) REFERENCES `chassis` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `advertisement_relation_8` FOREIGN KEY (`sellerType`) REFERENCES `seller_type` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `advertisement_relation_9` FOREIGN KEY (`userId`) REFERENCES `user_personal_data` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.advertisement: ~2 rows (приблизительно)
INSERT INTO `advertisement` (`id`, `price`, `userId`, `new`, `sellerType`, `tender`, `chassis`, `color`, `mileage`, `engine`, `power`, `transmission`, `fuel`, `wheelSize`, `amphibious`, `document`, `vehicleType`, `constructionType`, `brand`, `model`, `status`, `creationDate`, `capacity`, `city`) VALUES
	(1, 2500000.00, 1, b'0', 1, b'0', 1, 'Фиолетовый', 239, 'Toyota 1nz fe', 110, 1, 1, '1300x500', b'1', 1, 1, 1, 'Тундра', 'Восток', 1, '2026-01-14 16:33:41', NULL, NULL),
	(2, 5000000.00, 1, b'1', 2, b'1', 2, 'Зеленый', NULL, 'ВАЗ 2111', 398, 2, 1, '1400x650', b'1', 1, 1, 2, 'Тингер', 'ТФ4 ПРО', 1, '2026-01-14 16:40:31', NULL, NULL);

-- Дамп структуры для таблица vehicle_website.advertisement_photo
CREATE TABLE IF NOT EXISTS `advertisement_photo` (
  `advertisement` int(11) NOT NULL,
  `photo` varchar(400) NOT NULL DEFAULT '',
  PRIMARY KEY (`advertisement`,`photo`),
  CONSTRAINT `FK_advertisement_photo_advertisement` FOREIGN KEY (`advertisement`) REFERENCES `advertisement` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.advertisement_photo: ~5 rows (приблизительно)
INSERT INTO `advertisement_photo` (`advertisement`, `photo`) VALUES
	(1, 'https://res.cloudinary.com/duystfz2v/image/upload/v1768386817/xir0ew0njtzoosjvpre0.jpg'),
	(1, 'https://res.cloudinary.com/duystfz2v/image/upload/v1768386818/kiin8c6fx0el3npqeoqu.jpg'),
	(2, 'https://res.cloudinary.com/duystfz2v/image/upload/v1768387227/ad6etxbkmuslnbzxtkrw.png'),
	(2, 'https://res.cloudinary.com/duystfz2v/image/upload/v1768387228/bxpeim8kcb7uazp9o5uf.png'),
	(2, 'https://res.cloudinary.com/duystfz2v/image/upload/v1768387229/slnalx1ruorviitvsste.png');

-- Дамп структуры для таблица vehicle_website.advertisement_status
CREATE TABLE IF NOT EXISTS `advertisement_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.advertisement_status: ~2 rows (приблизительно)
INSERT INTO `advertisement_status` (`id`, `name`) VALUES
	(1, 'Принято'),
	(2, 'В ожидании');

-- Дамп структуры для таблица vehicle_website.chassis
CREATE TABLE IF NOT EXISTS `chassis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.chassis: ~2 rows (приблизительно)
INSERT INTO `chassis` (`id`, `name`) VALUES
	(1, 'Колёсный'),
	(2, 'Гусеничный');

-- Дамп структуры для таблица vehicle_website.construction_type
CREATE TABLE IF NOT EXISTS `construction_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.construction_type: ~2 rows (приблизительно)
INSERT INTO `construction_type` (`id`, `name`) VALUES
	(1, 'Цельнорамный'),
	(2, 'Переломный'),
	(3, 'Бортоповоротный');

-- Дамп структуры для таблица vehicle_website.document
CREATE TABLE IF NOT EXISTS `document` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.document: ~3 rows (приблизительно)
INSERT INTO `document` (`id`, `name`) VALUES
	(1, 'ЭПСМ'),
	(2, 'Спорт.инвентарь'),
	(3, 'Без документов');

-- Дамп структуры для таблица vehicle_website.fuel
CREATE TABLE IF NOT EXISTS `fuel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.fuel: ~4 rows (приблизительно)
INSERT INTO `fuel` (`id`, `name`) VALUES
	(1, 'Бензин'),
	(2, 'Дизель'),
	(3, 'Газ'),
	(4, 'Электричество');

-- Дамп структуры для таблица vehicle_website.manufacturer_cards
CREATE TABLE IF NOT EXISTS `manufacturer_cards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `city` varchar(50) NOT NULL,
  `logo` varchar(400) DEFAULT NULL,
  `vk` varchar(200) DEFAULT NULL,
  `youtube` varchar(200) DEFAULT NULL,
  `website` varchar(200) DEFAULT NULL,
  `rutube` varchar(200) DEFAULT NULL,
  `telegram` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.manufacturer_cards: ~134 rows (приблизительно)
INSERT INTO `manufacturer_cards` (`id`, `name`, `city`, `logo`, `vk`, `youtube`, `website`, `rutube`, `telegram`) VALUES
	(1, 'TINGER', 'Череповец', 'https://res.cloudinary.com/duystfz2v/image/upload/v1768922599/%D0%BB%D0%BE%D0%B3%D0%BE_%D1%82%D0%B8%D0%BD%D0%B3%D0%B5%D1%80_axempn.jpg', 'https://vk.com/predel.prochnosti', 'https://www.youtube.com/@predel_prochnosti', 'https://tinger.ru/', NULL, NULL),
	(2, 'TUNDRA', 'Тюмень', 'https://res.cloudinary.com/duystfz2v/image/upload/v1768934395/%D1%82%D1%83%D0%BD%D0%B4%D1%80%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_t6df2e.jpg', 'https://vk.com/vezdehodtundra', 'https://www.youtube.com/@vezdehodtundra', 'https://вездеходтундра.рф/', NULL, NULL),
	(3, 'КАПРАЛ', 'Томск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1768922672/%D0%BB%D0%BE%D0%B3%D0%BE_%D0%BA%D0%B0%D0%BF%D1%80%D0%B0%D0%BB_2_dli5h7.jpg', 'https://vk.com/dimaxworkshop', 'https://www.youtube.com/@dimax2225', 'https://dimax4x4.ru/', NULL, NULL),
	(4, 'ДОЗЕР', 'Уфа', 'https://res.cloudinary.com/duystfz2v/image/upload/v1768922659/%D0%B4%D0%BE%D0%B7%D0%B5%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_q3tyck.jpg', 'https://vk.com/dozer35vol', 'https://www.youtube.com/@VezdehodDozer', 'https://kvadrotsikl-dozer.ru/', NULL, NULL),
	(5, 'РБ МОТОРС', 'Уфа', 'https://res.cloudinary.com/duystfz2v/image/upload/v1768922691/%D1%80%D0%B1_%D0%BB%D0%BE%D0%B3%D0%BE_joi7uh.jpg', 'https://vk.com/rbmotors', 'https://www.youtube.com/@RBMotors-Athlete', 'https://rbmotors.ru/', NULL, NULL),
	(6, 'ИЗГТ', 'Богородск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769085114/%D0%BB%D0%BE%D0%B3%D0%BE_%D0%B8%D0%B7%D0%B3%D1%82_ea5mst.jpg', 'https://vk.com/izgt_38', 'https://www.youtube.com/@izgt', 'https://izgt.ru/', NULL, NULL),
	(7, 'ХАН', 'Владимир', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769085093/%D1%85%D0%B0%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_jkr13l.png', 'https://vk.com/vezdehodkhan', 'https://www.youtube.com/@KHAN-ATVVezdehod', 'https://e-khan.ru/', NULL, NULL),
	(8, 'ТАКТИК', 'Псков', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769085074/%D1%82%D0%B0%D0%BA%D1%82%D0%B8%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_fgrfgn.jpg', 'https://vk.com/vezdexodtaktik', 'https://www.youtube.com/@VEZDEHOD_TAKTIK', 'https://taktik60.ru/', NULL, NULL),
	(9, 'МАМОНТ', 'Архангельск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769927793/%D0%BB%D0%BE%D0%B3%D0%BE_%D0%BC%D0%B0%D0%BC%D0%BE%D0%BD%D1%82_vtoua3.jpg', 'https://vk.com/public218458856', NULL, NULL, NULL, 'https://t.me/vezdehod_Mamont29'),
	(10, 'ПОМОРЕЦ', 'Архангельск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769927820/%D0%BF%D0%BE%D0%BC%D0%BE%D1%80%D0%B5%D1%86_%D0%BB%D0%BE%D0%B3%D0%BE_rvq4zw.jpg', 'https://vk.com/pomorec4x4', 'https://www.youtube.com/@pomorec29', 'https://specdisk.ru/', NULL, NULL),
	(11, 'РОМБ 4х4', 'Архангельск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769927808/%D1%80%D0%BE%D0%BC%D0%B1_%D0%BB%D0%BE%D0%B3%D0%BE_otmgeb.jpg', NULL, 'https://www.youtube.com/@romb8x8/videos', 'https://romb4x4.ru/', 'https://vkvideo.ru/@romb4x4', NULL),
	(12, 'TRACKER', 'Березовский', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769927907/%D1%82%D1%80%D0%B5%D0%BA%D0%B5%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_vebjux.jpg', 'https://vk.com/vezdehodtracker', 'https://www.youtube.com/@TRACKER_OFFROAD', 'https://zerbig.ru/catalog/vezdekhod-tracker/vezdekhod-tracker/', NULL, NULL),
	(13, 'РУСАК', 'Богородск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769928003/%D1%80%D1%83%D1%81%D0%B0%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_njiiie.jpg', NULL, 'https://www.youtube.com/@rusakvehicles', 'https://www.atvrusak.ru/', NULL, NULL),
	(14, 'БАРС', 'Вельск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769928015/%D0%B1%D0%B0%D1%80%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_fpjz9m.jpg', 'https://vk.com/karakat29', NULL, NULL, NULL, NULL),
	(15, 'БИВНЕХОД', 'Вельск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769927834/%D0%B1%D0%B8%D0%B2%D0%BD%D0%B5%D1%85%D0%BE%D0%B4_%D0%BB%D0%BE%D0%B3%D0%BE_atriuo.jpg', 'https://vk.com/bivnehod_vezdehod', 'https://www.youtube.com/@bivnehod_vezdehod', 'https://bivnehod-vezdehod.orgs.biz/', NULL, NULL),
	(16, 'ВЕЗДЕЗОД 29', 'Вельск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937422/%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_z4l06q.jpg', 'https://vk.com/v_service29', 'https://www.youtube.com/@v_service29', NULL, NULL, NULL),
	(17, 'ПРО 29', 'Вельск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769927927/%D0%BF%D1%80%D0%BE_29_%D0%BB%D0%BE%D0%B3%D0%BE_qgagi8.jpg', 'https://vk.com/club182203882', NULL, NULL, NULL, NULL),
	(18, 'МАРС', 'Витебск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769928045/%D0%BC%D0%B0%D1%80%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_h8fhbi.jpg', 'https://vk.com/club140891062', 'https://www.youtube.com/@eugehii/videos', NULL, NULL, NULL),
	(19, 'АВРОРА', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931479/%D0%B0%D0%B2%D1%80%D0%BE%D1%80%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_bjpa16.jpg', 'https://vk.com/vezdekhodavrora', 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D1%8B%D0%90%D0%B2%D1%80%D0%BE%D1%80%D0%B0', NULL, NULL, NULL),
	(20, 'ARCH', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931494/%D0%B0%D1%80%D1%87_%D0%BB%D0%BE%D0%B3%D0%BE_byr4ky.jpg', 'https://vk.com/vezdehod_arch', 'https://www.youtube.com/@ARCH_35', NULL, NULL, NULL),
	(21, 'АТЛАНТ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931599/%D0%B0%D1%82%D0%BB%D0%B0%D0%BD%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_rqcasu.jpg', 'https://vk.com/atlantoffroad', NULL, NULL, NULL, NULL),
	(22, 'БЕР', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931611/%D0%B1%D0%B5%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_xhuzj4.webp', NULL, 'https://www.youtube.com/@Ber-35', NULL, NULL, NULL),
	(23, 'ВЕДУН', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931538/%D0%B2%D0%B5%D0%B4%D1%83%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_2_inurow.jpg', 'https://vk.com/vedun35', 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D0%92%D0%B5%D0%B4%D1%83%D0%BD', 'https://vedun32.ru/', NULL, NULL),
	(24, 'ВЕПРЬ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931629/%D0%B2%D0%B5%D0%BF%D1%80%D1%8C_%D0%BB%D0%BE%D0%B3%D0%BE_gdyzdd.jpg', 'https://vk.com/vezdexod35region', 'https://www.youtube.com/channel/UCLU0YOit7cW3vNwYt6XxeAQ/videos', 'https://www.zvt35.ru/', NULL, NULL),
	(25, 'ГАЗАН', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769932714/%D0%B3%D0%B0%D0%B7%D0%B0%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_nheg0s.jpg', 'https://vk.com/vezdehod_gazan', NULL, NULL, NULL, NULL),
	(26, 'ГЕФЕСТ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931663/%D0%B3%D0%B5%D1%84%D0%B5%D1%81%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_xronkt.jpg', 'https://vk.com/vez.gefest', 'https://www.youtube.com/@%D0%92%D0%95%D0%97%D0%94%D0%95%D0%A5%D0%9E%D0%94%D0%AB%D0%93%D0%95%D0%A4%D0%95%D0%A1%D0%A2', 'https://dzen.ru/id/65f55aa6eb7fe5140eea792e', NULL, NULL),
	(27, 'ДОБЫТЧИК', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931724/%D0%B4%D0%BE%D0%B1%D1%8B%D1%82%D1%87%D0%B8%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_ddyq2q.jpg', 'https://vk.com/karakat35', 'https://www.youtube.com/@DOBYTCHIK_35', 'https://вездеходкаракат.рф/?utm_source=youtube', NULL, NULL),
	(28, 'ЕГЕРЬ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931683/%D0%B5%D0%B3%D0%B5%D0%B3%D1%80%D1%8C_%D0%BB%D0%BE%D0%B3%D0%BE_u3holy.webp', 'https://vk.com/public172213944', 'https://www.youtube.com/@vezdexod-eger', 'https://vezdexod-eger.ru/', NULL, NULL),
	(29, 'ЛЕШИЙ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931741/%D0%BB%D0%B5%D1%88%D0%B8%D0%B8%CC%86_%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_y5ebjd.jpg', 'https://vk.com/vezdehodleshii35', 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D0%9B%D0%B5%D1%88%D0%B8%D0%B9', 'https://леший35.рф/', NULL, NULL),
	(30, 'ЛИТЛ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769931524/%D0%BB%D0%B8%D1%82%D0%BB_%D0%BB%D0%BE%D0%B3%D0%BE_ergztu.jpg', 'https://vk.com/shogrash_vzd', 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D0%9B%D0%B8%D1%82%D0%9B', NULL, NULL, NULL),
	(31, 'МЕДВЕДЬ ПРО', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769934893/%D0%BC%D0%B5%D0%B4%D0%B2%D0%B5%D0%B4%D1%8C_%D0%BF%D1%80%D0%BE_%D0%BB%D0%BE%D0%B3%D0%BE_n9efau.jpg', 'https://vk.com/medvedzvt35', 'https://www.youtube.com/@MEDVEDZVT', 'https://medved-rus.ru/', NULL, NULL),
	(32, 'ОХОТНИК', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769934944/%D0%BE%D1%85%D0%BE%D1%82%D0%BD%D0%B8%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_mmwwsa.jpg', 'https://vk.com/vezdehod35', 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D1%8B%D0%B8%D0%B1%D0%BE%D0%BB%D0%BE%D1%82%D0%BE%D1%85%D0%BE%D0%B4%D1%8B%D0%9E%D1%85%D0%BE%D1%82%D0%BD%D0%B8%D0%BA', 'https://vezdehod35.ru/', NULL, NULL),
	(33, 'ПАНФИЛОВЕЦ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769934974/%D0%9F%D0%90%D0%9D%D0%A4%D0%98%D0%9B_%D0%9B%D0%9E%D0%93%D0%9E_uxwoum.jpg', 'https://vk.com/id490526091', NULL, 'https://t.me/youtubekan', NULL, NULL),
	(34, 'СЕВЕРЯК', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935019/%D1%81%D0%B5%D0%B2%D0%B5%D1%80%D1%8F%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_2_ohdpbx.jpg', 'https://vk.com/vezdehodseveryak', NULL, 'https://severyak.ru/', NULL, NULL),
	(35, 'ТДН', 'Вологда', NULL, 'https://vk.com/tdnvezdehod', 'https://www.youtube.com/@tdn400', NULL, NULL, NULL),
	(36, 'ТЕРМИТ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935086/%D1%82%D0%B5%D1%80%D0%BC%D0%B8%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_yvpoky.jpg', 'https://vk.com/termit_vologda', NULL, NULL, NULL, NULL),
	(37, 'ТЕХНИК', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935128/%D1%82%D0%B5%D1%85%D0%BD%D0%B8%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_wfuirs.jpg', 'https://vk.com/tehnik_35', 'https://www.youtube.com/@vezdehodTehnik', NULL, NULL, 'https://vk.link/tehnik_35'),
	(38, 'ТЕХНОВОЛК', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935137/%D1%82%D0%B5%D1%85%D0%BD%D0%BE%D0%B2%D0%BE%D0%BB%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_l6l810.jpg', 'https://vk.com/tehnovolk35', 'https://www.youtube.com/channel/UC66xofY2o-rqFb9uTZpJpzQ?view_as=subscriber', 'https://www.tehnovolk.com/', NULL, NULL),
	(39, 'ТОР-35', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935166/%D1%82%D0%BE%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_kuksnb.jpg', 'https://vk.com/karakat35tor', 'https://www.youtube.com/@karakat35tor', 'https://tor35.ru/', NULL, NULL),
	(40, 'ТРИМ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935179/%D1%82%D1%80%D0%B8%D0%BC_%D0%BB%D0%BE%D0%B3%D0%BE_x4hq8k.jpg', 'https://vk.com/vologda.vezdehodtrim', 'https://www.youtube.com/@TRIM35', 'https://trim35.ru/', NULL, NULL),
	(41, 'ТРИУМФ', 'Вологда', NULL, 'https://vk.com/public210721376', 'https://www.youtube.com/@triumf-atv', 'https://triumf-atv.ru/', NULL, NULL),
	(42, 'ЧЕРЕПАХА', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935230/%D1%87%D0%B5%D1%80%D0%B5%D0%BF%D0%B0%D1%85%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_fynro3.jpg', 'https://vk.com/cherepaha_vezdehod', 'https://www.youtube.com/@%D0%93%D1%83%D1%81%D0%B5%D0%BD%D0%B8%D1%87%D0%BD%D1%8B%D0%B9%D0%B2%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D0%A7%D0%B5%D1%80%D0%B5%D0%BF%D0%B0%D1%85%D0%B0', NULL, NULL, NULL),
	(43, 'ШАТУН-35', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935372/%D1%88%D0%B0%D1%82%D1%83%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_2_tz4ljm.jpg', 'https://vk.com/public146522812', NULL, NULL, NULL, NULL),
	(44, 'ШЕРИФ', 'Вологда', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935385/%D1%88%D0%B5%D1%80%D0%B8%D1%84_%D0%BB%D0%BE%D0%B3%D0%BE_zwbcnq.jpg', 'https://vk.com/sheriffvologda', 'https://www.youtube.com/@Vesdihod_SHERIFF', NULL, NULL, NULL),
	(45, 'СЕКАЧ', 'Всеволжск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935312/%D1%81%D0%B5%D0%BA%D0%B0%D1%87_%D0%BB%D0%BE%D0%B3%D0%BE_vkbbju.jpg', 'https://vk.com/ohotnik_47', 'https://www.youtube.com/@%D0%9E%D1%85%D0%BE%D1%82%D0%BD%D0%B8%D0%BA47', 'https://sekach47.ru/', NULL, NULL),
	(46, 'БРО', 'Жуков', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935305/%D0%B1%D1%80%D0%BE_%D0%BB%D0%BE%D0%B3%D0%BE_is1fcz.jpg', 'https://vk.com/vezdehodbro', 'https://www.youtube.com/@vezdehodovnet', 'https://vezdehodov.net/', NULL, NULL),
	(47, 'СТМ', 'Заволжье', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935408/%D1%81%D1%82%D0%BC_%D0%BB%D0%BE%D0%B3%D0%BE_ztncf2.jpg', 'https://vk.com/ooostmru', 'https://www.youtube.com/@%D0%A1%D0%A2%D0%9C-%D1%862%D0%BC', 'https://ooostm.ru/', NULL, NULL),
	(48, 'БАЙКАЛ 4х4', 'Иркутск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935417/%D0%B1%D0%B0%D0%B8%CC%86%D0%BA%D0%B0%D0%BB_%D0%BB%D0%BE%D0%B3%D0%BE_p7714m.jpg', 'https://vk.com/4x4baikal', 'https://www.youtube.com/@baikal4x4', 'https://baikal-4x4.ru/?utm_source=vk&utm_medium=smm&utm_campaign=mai', NULL, NULL),
	(49, 'ВЕТЕР', 'Иркутск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935447/%D0%B2%D0%B5%D1%82%D0%B5%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_r11xuu.jpg', NULL, 'https://www.youtube.com/@AlexandrMel', NULL, 'https://rutube.ru/channel/43853159/', NULL),
	(50, 'ЗЭТ', 'Иркутск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935495/%D0%B7%D1%8D%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_d0lj7s.jpg', 'https://vk.com/38zet', 'https://www.youtube.com/@38zet', 'https://38zet.ru/?sess=12840027', NULL, NULL),
	(51, 'ИРКУТ', 'Иркутск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935461/%D0%B8%D1%80%D0%BA%D1%83%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_fetd1w.webp', 'https://vk.com/boyarkin1987', 'https://www.youtube.com/@Gregori1905', NULL, NULL, NULL),
	(52, 'СОБОЛЬ', 'Иркутск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935515/%D1%81%D0%BE%D0%B1%D0%BE%D0%BB%D1%8C_%D0%BB%D0%BE%D0%B3%D0%BE_ddbx3y.jpg', NULL, 'https://www.youtube.com/@%D0%9E%D0%BB%D0%B5%D0%B3%D0%A1%D0%BE%D0%BB%D0%BE%D0%B2%D1%8C%D1%91%D0%B2%D0%A1%D0%BE%D0%B1%D0%BE%D0%BB%D1%8C38', NULL, 'https://rutube.ru/channel/13795394/', NULL),
	(53, 'ШТОРМ', 'Иркутск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935542/%D1%88%D1%82%D0%BE%D1%80%D0%BC_%D0%BB%D0%BE%D0%B3%D0%BE_wem3yx.jpg', NULL, 'https://www.youtube.com/@%D0%B2%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4_%D0%A8%D1%82%D0%BE%D1%80%D0%BC%D0%BE%D0%B2%D0%B8%D0%BA', 'https://shtorm-izv.ru/', NULL, 'https://t.me/vezdehod_Storm'),
	(54, 'КАЛУЖАНИН', 'Калуга', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935595/%D0%BA%D0%B0%D0%BB%D1%83%D0%B6%D0%B0%D0%BD%D0%B8%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_3_jv37it.jpg', NULL, 'https://www.youtube.com/@Kaluzhanin040', 'https://калужанин.com/', NULL, NULL),
	(55, 'ЗАВОД ВЕЗДЕХОД', 'Киров', NULL, 'https://vk.com/zavod.vezdehod', NULL, NULL, NULL, NULL),
	(56, 'КАРАКАТ 43', 'Киров', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935674/%D0%BA%D0%B0%D1%80%D0%B0%D0%BA%D0%B0%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_p1rbfy.jpg', 'https://vk.com/karakat43183745861', 'https://www.youtube.com/@karakat4347', NULL, NULL, NULL),
	(57, 'БООТУР', 'р.Коми', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935685/%D0%B1%D0%BE%D0%BE%D1%82%D1%83%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_mijlir.jpg', NULL, 'https://www.youtube.com/@osipandreev3828', NULL, NULL, NULL),
	(58, 'ГРЯЗЕМЕС-11', 'р.Коми', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935706/%D0%B3%D1%80%D1%8F%D0%B7%D0%B5%D0%BC%D0%B5%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_coq0a0.jpg', 'https://vk.com/grazemez11', NULL, NULL, NULL, NULL),
	(59, 'ЗЫРЯНИН', 'р.Коми', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935621/%D0%B7%D1%8B%D1%80%D1%8F%D0%BD%D0%B8%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_fyl3cv.jpg', NULL, 'https://www.youtube.com/@%D0%97%D1%8B%D1%80%D1%8F%D0%BD%D0%B8%D0%BD', 'https://снегоболотоходы-зырянин-коми.рф/', NULL, 'https://t.me/BE3DEXODbl_3blRYANIN'),
	(60, 'БИЗОН', 'Коноша', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935719/%D0%B1%D0%B8%D0%B7%D0%BE%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_ojfpt1.jpg', 'https://vk.com/bizonpro', 'https://www.youtube.com/@bizonpro9355', 'https://bizonpro.ru/', NULL, NULL),
	(61, 'ХОМА', 'Котлас', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769935288/%D1%85%D0%BE%D0%BC%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_pn2rfb.jpg', 'https://vk.com/homatrak', 'https://www.youtube.com/@HOMAVEZDEHOD', NULL, NULL, NULL),
	(62, 'BIG BO', 'Кострома', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769936931/%D0%B1%D0%B8%D0%B3%D0%B1%D0%BE_%D0%BB%D0%BE%D0%B3%D0%BE_sc0ug1.jpg', 'https://vk.com/bigboatv', 'https://www.youtube.com/@bigbo9157', 'https://russian-suv.ru/bigbo#submenu:vezdekhodi', NULL, NULL),
	(63, 'ВЕЗДЕХОД 44', 'Кострома', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769936943/44_%D0%BB%D0%BE%D0%B3%D0%BE_hyyxdv.jpg', NULL, 'https://www.youtube.com/@%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB%D0%B2%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D1%8B44', NULL, NULL, NULL),
	(64, 'БОРУС', 'Красноярск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937000/%D0%B1%D0%BE%D1%80%D1%83%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_hcwaal.jpg', 'https://vk.com/borus124', NULL, 'https://borus124.orgs.biz/', NULL, NULL),
	(65, 'ВАРЯГ', 'Красноярск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937009/%D0%BB%D0%BE%D0%B3%D0%BE_%D0%B2%D0%B0%D1%80%D1%8F%D0%B3_2_ahutkv.jpg', 'https://vk.com/varyagtruck', 'https://www.youtube.com/@gkalianss', 'https://varyag-truck.ru/', NULL, NULL),
	(66, 'Visuva', 'Красноярск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937020/%D0%B2%D0%B8%D0%B7%D1%83%D0%B2%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_bamznu.jpg', 'https://vk.com/visuva_tech', 'https://www.youtube.com/@VISUVA_Tech', 'https://visuva.su/', NULL, NULL),
	(67, 'МАКС', 'Красноярск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937035/%D0%BC%D0%B0%D0%BA%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_uaqiui.webp', 'https://vk.com/billys.garage', NULL, 'https://billysgarage.ru/maks4x4', NULL, 'https://t.me/bgatv'),
	(68, 'СЕВЕР', 'Красноярск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937060/%D1%81%D0%B5%D0%B2%D0%B5%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_nzyfjl.jpg', 'https://vk.com/sever_company', 'https://www.youtube.com/@severboat-severtrucks', 'https://severtrucks.ru/', NULL, NULL),
	(69, 'ЯР', 'Красноярск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937069/%D1%8F%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_igsqkm.svg', 'https://vk.com/yarpricep24', 'https://www.youtube.com/@user.yarpricep', 'https://яр.net/', NULL, NULL),
	(70, 'БУРЛАК', 'Курган', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937086/%D0%B1%D1%83%D1%80%D0%BB%D0%B0%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_gxulk0.jpg', 'https://vk.com/burlakoffroad', 'https://www.youtube.com/@burlakoffroad', 'http://burlakoffroad.ru/', NULL, NULL),
	(71, 'ЛАЙКА', 'Курган', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937109/%D0%BB%D0%B0%D0%B8%CC%86%D0%BA%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_jyvmrl.jpg', 'https://vk.com/laika45', 'https://www.youtube.com/@laika45', NULL, NULL, 'https://t.me/laika_045'),
	(72, 'ФЕНИКС', 'Курган', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937115/%D1%84%D0%B5%D0%BD%D0%B8%D0%BA%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_dm5l9b.jpg', NULL, NULL, 'https://вездеход-феникс.рф/', NULL, NULL),
	(73, 'АВИОН', 'Липецк', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769936948/%D0%90%D0%92%D0%98%D0%9E%D0%9D_%D0%9B%D0%9E%D0%93%D0%9E_fkvjxl.jpg', NULL, 'https://www.youtube.com/@avion-agro', 'https://avion-agro.ru/', NULL, NULL),
	(74, 'ЛИТВИНА', 'Минск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937128/%D0%BB%D0%B8%D1%82%D0%B2%D0%B8%D0%BD%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_zzjqix.jpg', 'https://vk.com/litvina_service', 'https://www.youtube.com/@litvina', 'https://www.litvina.ru/', NULL, NULL),
	(75, 'ДОЗОР', 'Москва', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937139/%D0%B4%D0%BE%D0%B7%D0%BE%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_neoucf.png', NULL, 'https://www.youtube.com/@dozor-track', 'https://dozor-track.ru/', NULL, NULL),
	(76, 'КАРАВАН', 'Москва', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937152/%D0%BA%D0%B0%D1%80%D0%B0%D0%B2%D0%B0%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_tx44q2.jpg', 'https://vk.com/karavan_karakat', 'https://www.youtube.com/@karavan-vezdexod', NULL, NULL, NULL),
	(77, 'Patroltrack', 'Москва', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937159/%D0%BF%D0%B0%D1%82%D1%80%D0%BE%D0%BB_%D0%BB%D0%BE%D0%B3%D0%BE_ntpvwh.jpg', NULL, 'https://www.youtube.com/@PatrolTrack', NULL, NULL, NULL),
	(78, 'Terranica', 'Москва', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937205/%D1%82%D0%B5%D1%80%D1%80%D0%B0%D0%BD%D0%B8%D0%BA%D0%B0_f7yocl.jpg', 'https://vk.com/terranica', 'https://www.youtube.com/@TERRANICAATV', 'https://terranica.com/', NULL, NULL),
	(79, 'ТРЭКОЛ', 'Москва', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937275/%D1%82%D1%80%D1%8D%D0%BA%D0%BE%D0%BB_%D0%BB%D0%BE%D0%B3%D0%BE_nnz4s2.jpg', 'https://vk.com/trecolgroup', 'https://www.youtube.com/@TheTrecol', 'https://www.trecol.ru/', NULL, NULL),
	(80, 'УРСА', 'Москва', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937217/%D1%83%D1%80%D1%81%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_v21rma.jpg', NULL, 'https://www.youtube.com/@vezdehod-ursa', 'https://ursamotors.ru/', NULL, NULL),
	(81, 'ФИНИСТ', 'Москва', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937222/%D1%84%D0%B8%D0%BD%D0%B8%D1%81%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_2_pvhe8a.jpg', 'https://vk.com/id1045816717', 'https://www.youtube.com/@VezdehodFinistPro', NULL, NULL, NULL),
	(82, 'ШАМАН', 'Москва', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769937228/%D1%88%D0%B0%D0%BC%D0%B0%D0%BD_etdiqb.jpg', 'https://vk.com/avtoros_info', 'https://www.youtube.com/@avtoros', 'https://avtoros.com/', NULL, NULL),
	(83, 'ЗВЕРЬ', 'Нижнеудинск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941561/IMG_4818_iyzodj.jpg', NULL, 'https://www.youtube.com/@bolotohod_zver', 'https://bolotohodzver.ru/', NULL, NULL),
	(84, 'ЕГЕРЬ', 'Нижний Новгород', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941576/%D0%B5%D0%B3%D0%B5%D1%80%D1%8C_%D0%BB%D0%BE%D0%B3%D0%BE_ovucs8.jpg', NULL, 'https://www.youtube.com/@%D0%9D%D0%B8%D0%B6%D0%B5%D0%B3%D0%BE%D1%80%D0%BE%D0%B4%D1%81%D0%BA%D0%B8%D0%B9%D0%95%D0%B3%D0%B5%D1%80%D1%8C/videos', NULL, NULL, NULL),
	(85, 'ENWIX', 'Нижний Новгород', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941592/%D0%B5%D0%BD%D0%B2%D0%B8%D0%BA%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_xb7m6w.jpg', 'https://vk.com/enwixmotors', 'https://www.youtube.com/@ENWIXmotors', 'http://enwix.ru/', NULL, NULL),
	(86, 'НИЖЕГОРОДЕЦ', 'Нижний Новгород', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941607/%D0%BD%D0%B8%D0%B6%D0%B5%D0%B3%D0%BE%D1%80%D0%BE%D0%B4%D0%B5%D1%86_%D0%BB%D0%BE%D0%B3%D0%BE_esyhka.jpg', 'https://vk.com/vezdehod_nn', NULL, 'https://vezdehod-nn.ru/', NULL, NULL),
	(87, 'T-REX', 'Нижний Новгород', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941667/%D0%B2%D0%BD%D0%B5%D0%B4%D0%BE%D1%80%D0%BE%D0%B3_%D0%BB%D0%BE%D0%B3%D0%BE_hn8ef5.jpg', 'https://vk.com/vezdekhodych52', 'https://www.youtube.com/@vezdekhodych52', NULL, NULL, NULL),
	(88, 'УРАН', 'Нижний Новгород', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941677/%D1%83%D1%80%D0%B0%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_k2apov.jpg', 'https://vk.com/urankvadro', 'https://www.youtube.com/@URANoffROAD', 'https://urankvadro.ru/', NULL, NULL),
	(89, 'КОНОН', 'Нижний Тагил', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941691/%D0%BA%D0%BE%D0%BD%D0%BE%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_aoikrs.jpg', NULL, 'https://www.youtube.com/@Vesdehod_kon', NULL, 'https://rutube.ru/channel/54023596/videos/', NULL),
	(90, 'АЗИМУТ', 'Новосибирск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941713/%D0%B0%D0%B7%D0%B8%D0%BC%D1%83%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_akymxd.jpg', 'https://vk.com/azimut_154', 'https://www.youtube.com/@official_azimut_russia', NULL, NULL, 'https://t.me/Azimut54k'),
	(91, 'VENOM', 'Новосибирск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941719/%D0%B2%D0%B5%D0%BD%D0%BE%D0%BC_%D0%BB%D0%BE%D0%B3%D0%BE_pafn0x.jpg', 'https://vk.com/venom4x4', 'https://www.youtube.com/@Venom_4x4', 'https://atv-venom.com/', NULL, NULL),
	(92, 'КАРАКАН', 'Новосибирск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941762/%D0%BA%D0%B0%D1%80%D0%B0%D0%BA%D0%B0%D0%BD_j7xlsc.jpg', 'https://vk.com/sibtech_pro', 'https://www.youtube.com/@sibtechzavod/videos', 'https://sibtech.pro/', NULL, NULL),
	(93, 'ПЛАСТУН', 'Новосибирск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941772/%D0%BF%D0%BB%D0%B0%D1%81%D1%82%D1%83%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_a3kvom.jpg', 'https://vk.com/plastunrvp', NULL, 'https://tpu-plastun.ru/?utm_source=vk', NULL, NULL),
	(94, 'СОКОЛ', 'Новосибирск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941784/%D1%81%D0%BE%D0%BA%D0%BE%D0%BB_%D0%BB%D0%BE%D0%B3%D0%BE_zcpgq2.png', 'https://vk.com/sokol_vezdehod', 'https://www.youtube.com/@SOKOL_vezdehod', 'https://sokol-atv.ru/', NULL, NULL),
	(95, 'ТАЙПАН', 'Новосибирск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941796/%D1%82%D0%B0%D0%B8%CC%86%D0%BF%D0%B0%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_2_o3k1sw.jpg', 'https://vk.com/id199005280', 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D1%8B%D0%A2%D0%B0%D0%B9%D0%BF%D0%B0%D0%BD', 'https://вездеход54.рф/', NULL, NULL),
	(96, 'YARS', 'Новосибирск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941806/%D1%8F%D1%80%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_h4kxit.jpg', 'https://vk.com/yarsvezdehodd', 'https://www.youtube.com/@yarsvezdehod', NULL, NULL, NULL),
	(97, 'Болотный Проходимец', 'Омск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941844/%D1%83%D0%B2%D0%B0%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_cmjlg6.jpg', 'https://vk.com/public44515748', 'https://www.youtube.com/@UVAT-Vezdehod/videos', 'http://karakaty.4admins.ru/index.php', NULL, NULL),
	(98, 'ТИТАН', 'Пермь', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941862/%D1%82%D0%B8%D1%82%D0%B0%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_wotry7.webp', 'https://vk.com/kvadromonstry_titan_perm', NULL, 'https://kvadromonstry-titan.ru/', NULL, NULL),
	(99, 'ВЕПС', 'Рыбинск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941872/%D0%B2%D0%B5%D0%BF%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_uslp4s.jpg', 'https://vk.com/motodogveps', 'https://www.youtube.com/@VepsTehmar', 'https://tehmar.ru/', NULL, NULL),
	(100, 'РУСОХОД', 'Рыбинск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941885/%D1%80%D1%83%D1%81%D0%BE%D1%85%D0%BE%D0%B4_%D0%BB%D0%BE%D0%B3%D0%BE_ydq0yn.jpg', 'https://vk.com/rusohod', 'https://www.youtube.com/@rusohod', 'https://русоход.рус/', NULL, NULL),
	(101, 'АРХАНТ', 'С.Петербург', NULL, 'https://vk.com/sherpru', 'https://www.youtube.com/@ArkhuntSherpRussia', 'https://arkhunt.ru/', NULL, NULL),
	(102, 'ГИРТЕК', 'С.Петербург', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769943746/%D0%B3%D0%B8%D1%80%D1%82%D0%B5%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_cdwi2e.jpg', 'https://vk.com/girtekru', 'https://www.youtube.com/@GIRTEKru', 'https://girtek.ru/', NULL, NULL),
	(103, 'ЗИС-СПБ', 'С.Петербург', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769943756/%D0%B7%D0%B5%D0%BD%D0%B8%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_dq032v.jpg', 'https://vk.com/zis178', 'https://www.youtube.com/@%D0%98%D0%B2%D0%B0%D0%BD%D0%A8%D0%B5%D0%B9%D0%BA%D0%BE-%D1%8E8%D1%8D', 'https://zenit4x4.ru/', NULL, NULL),
	(104, 'RDC', 'С.Петербург', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769943769/%D1%80%D0%B4%D1%86_rm6qav.jpg', 'https://vk.com/roverdrivecompany', 'https://www.youtube.com/@RDCMAX', 'https://rdc-max.ru/', NULL, NULL),
	(105, 'САМУРАЙ', 'С.Петербург', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769943783/%D1%81%D0%B0%D0%BC%D1%83%D1%80%D0%B0%D0%B8%CC%86_%D0%BB%D0%BE%D0%B3%D0%BE_bvvt9b.jpg', 'https://vk.com/club62783366', 'https://www.youtube.com/@samuraispb/videos', NULL, 'https://rutube.ru/channel/27252424/', NULL),
	(106, 'ТАЙФУН', 'С.Петербург', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769943814/%D1%82%D0%B0%D0%B8%CC%86%D1%84%D1%83%D0%BD_%D0%BB%D0%BE%D0%B3%D0%BE_mqanxb.jpg', 'https://vk.com/club_vezdehod4x4', 'https://www.youtube.com/@vezdehod_taifun', 'https://taifun.tech/', NULL, NULL),
	(107, 'ЛОМОЛЕС', 'С.Петербург', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769943825/%D0%BB%D0%BE%D0%BC%D0%BE%D0%BB%D0%B5%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_ilxajv.jpg', 'https://vk.com/lomoles_spb', 'https://www.youtube.com/@Lomoles', 'https://lomoles.ru/', NULL, NULL),
	(108, 'BV 206 ЛОСЬ', 'С.Петербург', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769943854/%D0%BB%D0%BE%D1%81%D1%8C_qmyykq.jpg', 'https://vk.com/bv206russia', 'https://www.youtube.com/@bv206russia8', 'https://hagglundsbv206.ru/', NULL, NULL),
	(109, 'СЕВЕР', 'Северодвинск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026392/%D1%81%D0%B5%D0%B2%D0%B5%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_2_dgyryw.jpg', 'https://vk.com/vezdehodsever', 'https://www.youtube.com/channel/UCovicg7YSwKpi1wGWQwKNsA/featured', 'https://vezdehodsever.ru/', NULL, NULL),
	(110, 'СЕВЕРОДВИНСК', 'Северодвинск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026399/%D1%81%D0%B5%D0%B2%D0%B5%D1%80%D0%BE%D0%B4%D0%B2%D0%B8%D0%BD%D1%81%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_cxkcpr.jpg', 'https://vk.com/club89559193', NULL, NULL, NULL, NULL),
	(111, 'ДОБРЫНЯ', 'Смоленск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026420/%D0%B4%D0%BE%D0%B1%D1%80%D1%8B%D0%BD%D1%8F_%D0%BB%D0%BE%D0%B3%D0%BE_rzlgvi.jpg', 'https://vk.com/atvdobrynya', 'https://www.youtube.com/@donrynia_atv', 'https://atvdobrynya.ru/', NULL, NULL),
	(112, 'ОСТЯК', 'Сургут', NULL, 'https://vk.com/id568741752', 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D1%8B%D0%9E%D1%81%D1%82%D1%8F%D0%BA', NULL, NULL, NULL),
	(113, 'ТРОМ', 'Сургут', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026476/%D1%82%D1%80%D0%BE%D0%BC_%D0%BB%D0%BE%D0%B3%D0%BE_loj13q.jpg', 'https://vk.com/provorovsergei1966', 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D1%8B%D0%A2%D0%A0%D0%9E%D0%9C20%D0%A1%D1%83%D1%80%D0%B3%D1%83%D1%82', 'https://trom20.ru/', NULL, NULL),
	(114, 'БАТЫРЬ', 'Сыктывкар', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026489/%D0%B1%D0%B0%D1%82%D1%8B%D1%80%D1%8C_%D0%BB%D0%BE%D0%B3%D0%BE_cx8oik.jpg', 'https://vk.com/vezdehodbatyr', 'https://www.youtube.com/@Batyr11', 'https://batyr-komi.ru/', NULL, NULL),
	(115, 'ГАЛА', 'Сыктывкар', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769927921/%D0%B3%D0%B0%D0%BB%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_spkv1s.jpg', 'https://vk.com/atvgala', 'https://www.youtube.com/@atvgala', 'https://atvgala.ru/baby', NULL, NULL),
	(116, 'МОЛОХ', 'Тобольск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026505/%D0%BC%D0%BE%D0%BB%D0%BE%D1%85_%D0%BB%D0%BE%D0%B3%D0%BE_liykih.jpg', NULL, 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D0%9C%D0%9E%D0%9B%D0%9E%D0%A5', 'https://moloh72.ru/', NULL, NULL),
	(117, 'ХИЩНИК', 'Тобольск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026562/%D1%85%D0%B8%D1%89%D0%BD%D0%B8%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_uc74jd.jpg', NULL, 'https://www.youtube.com/@mezenin1234/featured', 'https://hishnikpro.ru/', NULL, NULL),
	(118, 'БИРЮК', 'Томск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026571/%D0%B1%D0%B8%D1%80%D1%8E%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_2_fecazs.webp', 'https://vk.com/biriuk_5555', 'https://www.youtube.com/@Biriuk_tomsk', 'https://biriuk.ru/', NULL, NULL),
	(119, 'VNE DOROG', 'Томск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1769941667/%D0%B2%D0%BD%D0%B5%D0%B4%D0%BE%D1%80%D0%BE%D0%B3_%D0%BB%D0%BE%D0%B3%D0%BE_hn8ef5.jpg', 'https://vk.com/club133994497', 'https://www.youtube.com/@VneDoroG_TSK', 'https://vnedorog.info/', NULL, NULL),
	(120, 'ДУТИК', 'Томск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026621/%D0%B4%D1%83%D1%82%D0%B8%D0%BA_%D0%BB%D0%BE%D0%B3%D0%BE_hukxpm.jpg', NULL, 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D0%94%D1%83%D1%82%D0%B8%D0%BA', NULL, NULL, NULL),
	(121, 'ФАНТОМ', 'Томск', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026642/%D1%84%D0%B0%D0%BD%D1%82%D0%BE%D0%BC_%D0%BB%D0%BE%D0%B3%D0%BE_sijowq.jpg', NULL, 'https://www.youtube.com/@%D0%A4%D0%B0%D0%BD%D0%A2%D0%BE%D0%BC-%D1%8B8%D1%8F', 'https://fantom-tomsk.ru/', NULL, NULL),
	(122, 'АРКТИКА', 'Тюмень', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026662/%D0%BC%D0%B5%D0%B4%D0%B2%D0%B5%D0%B4%D1%8C_%D1%82%D1%8E%D0%BC%D0%B5%D0%BD%D1%8C_%D0%BB%D0%BE%D0%B3%D0%BE_rerpjm.jpg', 'https://vk.com/id783028763', 'https://www.youtube.com/@Arctic111', NULL, NULL, NULL),
	(123, 'БУРКУТ', 'Тюмень', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026691/%D0%B1%D0%B5%D1%80%D0%BA%D1%83%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_2_g5mhmu.jpg', NULL, NULL, 'https://berkut8.ru/', NULL, NULL),
	(124, 'КОСАЧ', 'Тюмень', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026699/%D0%BA%D0%BE%D1%81%D0%B0%D1%87_%D0%BB%D0%BE%D0%B3%D0%BE_moeion.jpg', 'https://vk.com/club163019589', 'https://www.youtube.com/@%D0%92%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4%D1%8B%D0%9A%D0%9E%D0%A1%D0%90%D0%A7%D0%A7%D1%82%D1%8E%D0%BC%D0%B5%D0%BD%D1%8C', NULL, NULL, NULL),
	(125, 'КРЕЧЕТ', 'Тюмень', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026724/%D0%BA%D1%80%D0%B5%D1%87%D0%B5%D1%82_%D0%BB%D0%BE%D0%B3%D0%BE_hnit4b.jpg', 'https://vk.com/ccvkrechet', 'https://www.youtube.com/@atvkrechet', 'https://tehnoimpuls.com/', NULL, NULL),
	(126, 'МЕДВЕДЬ ТЮМЕНЬ', 'Тюмень', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026662/%D0%BC%D0%B5%D0%B4%D0%B2%D0%B5%D0%B4%D1%8C_%D1%82%D1%8E%D0%BC%D0%B5%D0%BD%D1%8C_%D0%BB%D0%BE%D0%B3%D0%BE_rerpjm.jpg', 'https://vk.com/id1052100661', 'https://www.youtube.com/@Medved-Tmn', 'https://medvedtmn.ru/', NULL, NULL),
	(127, 'РОСОМАХА', 'Тюмень', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026774/%D1%80%D0%BE%D1%81%D0%BE%D0%BC%D0%B0%D1%85%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_2_ilkocp.jpg', 'https://vk.com/rosomaha_service', 'https://www.youtube.com/@Rosomaha_Club', 'https://rosomaha-rus.ru/', NULL, NULL),
	(128, 'СКБ МОТОРС', 'Тюмень', NULL, 'https://vk.com/vezde_hod', 'https://www.youtube.com/@skb-motors', 'https://skbgsm.ru/', NULL, NULL),
	(129, 'ТУНГУС 72', 'Уват', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026831/%D1%82%D1%83%D0%BD%D0%B3%D1%83%D1%81_%D0%BB%D0%BE%D0%B3%D0%BE_iiw6kg.jpg', 'https://vk.com/tungus_72', NULL, NULL, NULL, NULL),
	(131, 'ХАКЕР', 'Тюмень', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026883/%D1%85%D0%B0%D0%BA%D0%B5%D1%80_%D0%BB%D0%BE%D0%B3%D0%BE_bgttxm.jpg', 'https://vk.com/id373176984', 'https://www.youtube.com/@aleksandrzhukov72', NULL, NULL, NULL),
	(132, 'ТАЙГА 72', 'Уват', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026895/%D1%82%D0%B0%D0%B8%CC%86%D0%B3%D0%B0_%D0%BB%D0%BE%D0%B3%D0%BE_2_c0ge6o.png', 'https://vk.com/7taiga7', 'https://www.youtube.com/@%D0%A2%D0%B0%D0%B9%D0%B3%D0%B072', NULL, NULL, 'https://vk.link/7taiga7'),
	(133, 'КРОШ', 'Череповец', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026916/%D0%BA%D1%80%D0%BE%D1%88_%D0%BB%D0%BE%D0%B3%D0%BE_n5or1h.jpg', 'https://vk.com/trecolgroup', 'https://www.youtube.com/@%D0%A1%D0%B5%D1%80%D0%B5%D0%B3%D0%B0%D0%9A%D1%80%D0%BE%D1%88', NULL, NULL, NULL),
	(134, 'ПЕЛЕЦ', 'Череповец', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026923/%D0%BF%D0%B5%D0%BB%D0%B5%D1%86_%D0%BB%D0%BE%D0%B3%D0%BE_o98it8.jpg', 'https://vk.com/pelec_group', 'https://www.youtube.com/@pelec-molodec', 'https://pelecatv.com/', NULL, NULL),
	(135, 'УРАГАН', 'Череповец', 'https://res.cloudinary.com/duystfz2v/image/upload/v1770026944/%D1%83%D1%80%D0%B0%D0%B3%D0%B0%D0%BD_%D1%85%D1%83%D0%B8%CC%86_wbwzgc.jpg', 'https://vk.com/buks1ru', 'https://www.youtube.com/@%D0%B2%D0%B5%D0%B7%D0%B4%D0%B5%D1%85%D0%BE%D0%B4-%D0%A3%D1%80%D0%B0%D0%B3%D0%B0%D0%BD-%D0%BC%D0%BE%D1%82%D0%BE%D1%82%D0%BE%D0%BB%D0%BA%D0%B0%D1%87', 'https://мототолкач.рф/produkciya/pnevmohody/pnevmohod-dikar', NULL, NULL);

-- Дамп структуры для таблица vehicle_website.manufacturer_synonym
CREATE TABLE IF NOT EXISTS `manufacturer_synonym` (
  `manufacturer` int(11) NOT NULL,
  `name` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`manufacturer`,`name`),
  CONSTRAINT `FK_manufacturer_synonym_manufacturer_2` FOREIGN KEY (`manufacturer`) REFERENCES `manufacturer_cards` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.manufacturer_synonym: ~31 rows (приблизительно)
INSERT INTO `manufacturer_synonym` (`manufacturer`, `name`) VALUES
	(1, 'тингер'),
	(2, 'тундра'),
	(12, 'трекер'),
	(12, 'трэкер'),
	(20, 'арк'),
	(20, 'арч'),
	(62, 'биг бо'),
	(62, 'бигбо'),
	(66, 'визува'),
	(77, 'патрол'),
	(77, 'патрол трек'),
	(77, 'патроол трэк'),
	(77, 'трэк'),
	(78, 'тераника'),
	(78, 'терраника'),
	(85, 'енвикс'),
	(85, 'энвикс'),
	(87, 'рэкс'),
	(87, 'т рекс'),
	(87, 'т рэкс'),
	(87, 'т-рекс'),
	(87, 'т-рэкс'),
	(87, 'трекс'),
	(87, 'трэкс'),
	(91, 'веном'),
	(91, 'венум'),
	(96, 'ярс'),
	(108, 'бв лось'),
	(108, 'лось'),
	(108, 'лось бв'),
	(119, 'вне дорог');

-- Дамп структуры для таблица vehicle_website.part
CREATE TABLE IF NOT EXISTS `part` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL DEFAULT '0',
  `date` datetime NOT NULL,
  `price` decimal(20,2) NOT NULL DEFAULT 0.00,
  `userId` int(11) NOT NULL DEFAULT 0,
  `condition` bit(1) NOT NULL,
  `sellerType` int(11) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_part_seller_type` (`sellerType`),
  KEY `FK_part_user_personal_data` (`userId`),
  CONSTRAINT `FK_part_seller_type` FOREIGN KEY (`sellerType`) REFERENCES `seller_type` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_part_user_personal_data` FOREIGN KEY (`userId`) REFERENCES `user_personal_data` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы vehicle_website.part: ~0 rows (приблизительно)

-- Дамп структуры для таблица vehicle_website.part_photo
CREATE TABLE IF NOT EXISTS `part_photo` (
  `part` int(11) NOT NULL,
  `photo` int(11) NOT NULL,
  PRIMARY KEY (`part`,`photo`),
  CONSTRAINT `FK__part` FOREIGN KEY (`part`) REFERENCES `part` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы vehicle_website.part_photo: ~0 rows (приблизительно)

-- Дамп структуры для таблица vehicle_website.seller_type
CREATE TABLE IF NOT EXISTS `seller_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы vehicle_website.seller_type: ~3 rows (приблизительно)
INSERT INTO `seller_type` (`id`, `name`) VALUES
	(1, 'Производитель'),
	(2, 'Диллер'),
	(3, 'Владелец');

-- Дамп структуры для таблица vehicle_website.transmission
CREATE TABLE IF NOT EXISTS `transmission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.transmission: ~3 rows (приблизительно)
INSERT INTO `transmission` (`id`, `name`) VALUES
	(1, 'АКПП'),
	(2, 'МКПП'),
	(3, 'Вариатор');

-- Дамп структуры для таблица vehicle_website.user_personal_data
CREATE TABLE IF NOT EXISTS `user_personal_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Дамп данных таблицы vehicle_website.user_personal_data: ~1 rows (приблизительно)
INSERT INTO `user_personal_data` (`id`, `name`, `phone`) VALUES
	(1, 'Матвей', '79829817369');

-- Дамп структуры для таблица vehicle_website.advertisement_type
CREATE TABLE IF NOT EXISTS `advertisement_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы vehicle_website.advertisement_type: ~3 rows (приблизительно)
INSERT INTO `advertisement_type` (`id`, `name`) VALUES
	(1, 'Вездеход'),
	(2, 'Мото-техника'),
	(3, 'Прицеп');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
