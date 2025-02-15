import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

interface AuthenticatedRequest extends Request {
    telegramUser?: TelegramUser;
}

const botToken = process.env.TELEGRAM_TOKEN;
if (!botToken) {
    throw new Error('TELEGRAM_TOKEN не установлен');
}

export const verifyTelegramWebAppData = (telegramInitData: string) => {
    // Декодируем данные из строки запроса
    const encoded = decodeURIComponent(telegramInitData);

    // Создаем HMAC-SHA-256 подпись токена бота с ключом WebAppData
    const secret = crypto.createHmac("sha256", "WebAppData").update(botToken);

    // Разбираем строку данных
    const arr = encoded.split("&");
    const hashIndex = arr.findIndex((str) => str.startsWith("hash="));
    const hash = arr.splice(hashIndex)[0].split("=")[1];
    
    // Сортируем параметры в алфавитном порядке
    arr.sort((a, b) => a.localeCompare(b));
    
    // Формируем строку для проверки в формате key=<value> с разделителем \n
    const dataCheckString = arr.join("\n");

    // Создаем HMAC-SHA-256 подпись строки данных с секретным ключом
    const _hash = crypto
        .createHmac("sha256", secret.digest())
        .update(dataCheckString)
        .digest("hex");

    // Сравниваем хеши для верификации данных
    return _hash === hash;
};

export const telegramAuthMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const initData = req.headers['x-telegram-init-data'];
    
    if (!initData || typeof initData !== 'string') {
        return res.status(401).json({ error: "Отсутствуют данные инициализации Telegram" });
    }

    if (!verifyTelegramWebAppData(initData)) {
        return res.status(401).json({ error: "Неверные данные инициализации Telegram" });
    }

    // Парсим данные пользователя
    const params = new URLSearchParams(initData);
    try {
        const userData = JSON.parse(params.get('user') || '');
        req.telegramUser = userData;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Ошибка при обработке данных пользователя" });
    }
}; 