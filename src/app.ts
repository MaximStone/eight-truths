import 'dotenv/config';
import express from 'express';
import path from 'path';
import { AppDataSource } from './dataSource';
import { startBot, bot, buildKeyboard, buildInitialKeyboard } from './telegramBot';
import cron from 'node-cron';
import { User } from './entity/User';
import { Entry } from './entity/Entry';
import { format } from 'date-fns';
import { telegramAuthMiddleware } from './middleware/telegramAuth';

const PORT = process.env.PORT || 5000;

async function startServer() {
    // Инициализация подключения к базе данных
    await AppDataSource.initialize();
    console.log("Подключение к базе данных установлено.");

    // Запуск Telegram-бота
    startBot();

    const app = express();
    app.use(express.json());

    // Раздача статических файлов из папки public
    app.use(express.static(path.join(__dirname, '../public')));

    // API-эндпоинт для получения отчёта (параметр period: week или month)
    app.get('/api/report', telegramAuthMiddleware, async (req: any, res) => {
        try {
            const { period } = req.query;
            const telegramUser = req.telegramUser;

            const periodValue = period === 'month' ? 'month' : 'week';
            const today = new Date();
            const days = periodValue === 'week' ? 6 : 29;
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - days);

            const userRepository = AppDataSource.getRepository(User);
            const entryRepository = AppDataSource.getRepository(Entry);

            const user = await userRepository.findOne({ where: { chatId: telegramUser.id.toString() } });
            if (!user) {
                return res.status(404).json({ error: "Пользователь не найден" });
            }

            const entries = await entryRepository
                .createQueryBuilder("entry")
                .where("entry.userId = :userId", { userId: user.id })
                .andWhere("entry.date >= :startDate", { startDate: format(startDate, 'yyyy-MM-dd') })
                .orderBy("entry.date", "ASC")
                .getMany();

            const report = entries.map(entry => ({
                date: entry.date,
                truths: [
                    entry.truth1,
                    entry.truth2,
                    entry.truth3,
                    entry.truth4,
                    entry.truth5,
                    entry.truth6,
                    entry.truth7,
                    entry.truth8
                ],
                comment: entry.comment
            }));

            res.json(report);
        } catch (error) {
            console.error('Error generating report:', error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // API-эндпоинт для сохранения записи
    app.post('/api/entry', telegramAuthMiddleware, async (req: any, res) => {
        try {
            const { date, truths, comment } = req.body;
            const telegramUser = req.telegramUser;

            // Проверяем наличие даты
            if (!date) {
                return res.status(400).json({ error: "Дата не указана" });
            }

            // Проверяем массив истин только если он предоставлен
            if (truths && (!Array.isArray(truths) || truths.length !== 8)) {
                return res.status(400).json({ error: "Неверный формат данных истин" });
            }

            const userRepository = AppDataSource.getRepository(User);
            const entryRepository = AppDataSource.getRepository(Entry);

            const user = await userRepository.findOne({ where: { chatId: telegramUser.id.toString() } });
            if (!user) {
                return res.status(404).json({ error: "Пользователь не найден" });
            }

            // Проверяем существование записи за указанную дату
            let entry = await entryRepository.findOne({ 
                where: { 
                    user: { id: user.id }, 
                    date: date 
                } 
            });

            if (!entry) {
                entry = new Entry();
                entry.user = user;
                entry.date = date;
            }

            // Обновляем значения истин, если они предоставлены
            if (truths) {
                entry.truth1 = truths[0];
                entry.truth2 = truths[1];
                entry.truth3 = truths[2];
                entry.truth4 = truths[3];
                entry.truth5 = truths[4];
                entry.truth6 = truths[5];
                entry.truth7 = truths[6];
                entry.truth8 = truths[7];
            }

            // Обновляем комментарий, если он предоставлен
            if (comment !== undefined) {
                entry.comment = comment;
            }

            await entryRepository.save(entry);
            res.json({ success: true });
        } catch (error) {
            console.error('Error saving entry:', error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // API-эндпоинт для получения записи за дату
    app.get('/api/entry', telegramAuthMiddleware, async (req: any, res) => {
        try {
            const { date } = req.query;
            const telegramUser = req.telegramUser;

            if (!date) {
                return res.status(400).json({ error: "Дата не указана" });
            }

            const userRepository = AppDataSource.getRepository(User);
            const entryRepository = AppDataSource.getRepository(Entry);

            const user = await userRepository.findOne({ where: { chatId: telegramUser.id.toString() } });
            if (!user) {
                return res.status(404).json({ error: "Пользователь не найден" });
            }

            const entry = await entryRepository.findOne({ 
                where: { 
                    user: { id: user.id }, 
                    date: date 
                } 
            });

            res.json({ entry });
        } catch (error) {
            console.error('Error loading entry:', error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // Отправляем index.html для всех остальных маршрутов
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });

    // Планировщик: ежедневное напоминание в 21:00
    cron.schedule('0 21 * * *', async () => {
        const userRepository = AppDataSource.getRepository(User);
        const users = await userRepository.find();
        users.forEach(async (user) => {
            try {
                await bot.telegram.sendMessage(user.chatId, "Ежедневное заполнение: отметьте истины, которые вы сегодня не соблюдали:", {
                    reply_markup: {
                        inline_keyboard: buildInitialKeyboard() 
                    }
                });
            } catch (error) {
                console.error(`Ошибка при отправке напоминания пользователю ${user.chatId}:`, error);
            }
        });
    });
}

startServer().catch((err) => {
    console.error("Ошибка при запуске сервера:", err);
});
