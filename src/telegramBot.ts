import { Telegraf, Context, Markup, session } from 'telegraf';
import { AppDataSource } from './dataSource';
import { User } from './entity/User';
import { Entry } from './entity/Entry';
import { format, subDays } from 'date-fns';

export interface MySession {
    entry: boolean[];
}

export interface MyContext extends Context {
    session: MySession;
}

const TRUTHS = [
    "Понимание",
    "Намерение",
    "Речь",
    "Действие",
    "Образ жизни",
    "Усилие",
    "Внимание",
    "Концентрация"
];

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
if (!TELEGRAM_TOKEN) {
    console.error("TELEGRAM_TOKEN environment variable not set");
    process.exit(1);
}

export const bot = new Telegraf<MyContext>(TELEGRAM_TOKEN);
bot.use(session({ defaultSession: () => ({ entry: Array(8).fill(true) }) }));

function buildMainMenu() {
    return Markup.keyboard([
        ['📝 Новая запись'],
        ['📊 Отчет за неделю', '📈 Отчет за месяц'],
        ['📱 Открыть веб-версию', 'ℹ️ Помощь']
    ]).resize();
}

export function buildKeyboard(entryState: boolean[]) {
    const buttons = entryState.map((state, index) => {
        const emoji = state ? "🟢" : "🔴";
        return Markup.button.callback(`${emoji} ${TRUTHS[index]}`, `toggle_${index}`);
    });
    const rows = [];
    for (let i = 0; i < buttons.length; i += 2) {
        rows.push(buttons.slice(i, i + 2));
    }
    rows.push([Markup.button.callback("Отправить", "submit")]);
    return Markup.inlineKeyboard(rows);
}

export function buildInitialKeyboard() {
    const entryState = Array(8).fill(true);
    const buttons = entryState.map((state, index) => {
        const emoji = state ? "🟢" : "🔴";
        return { text: `${emoji} ${TRUTHS[index]}`, callback_data: `toggle_${index}` };
    });
    const rows = [];
    for (let i = 0; i < buttons.length; i += 2) {
        rows.push(buttons.slice(i, i + 2));
    }
    rows.push([{ text: "Отправить", callback_data: "submit" }]);
    return rows;
}

async function generateReport(userId: number, days: number) {
    const entryRepository = AppDataSource.getRepository(Entry);
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    
    const entries = await entryRepository
        .createQueryBuilder("entry")
        .where("entry.userId = :userId", { userId })
        .andWhere("entry.date >= :startDate", { startDate })
        .orderBy("entry.date", "ASC")
        .getMany();

    if (entries.length === 0) {
        return "За выбранный период записей не найдено.";
    }

    let report = `📊 Отчет за ${days === 6 ? 'неделю' : 'месяц'}:\n\n`;
    
    entries.forEach(entry => {
        const date = format(new Date(entry.date), 'dd.MM.yyyy');
        const notFollowed = [];
        
        if (!entry.truth1) notFollowed.push(TRUTHS[0]);
        if (!entry.truth2) notFollowed.push(TRUTHS[1]);
        if (!entry.truth3) notFollowed.push(TRUTHS[2]);
        if (!entry.truth4) notFollowed.push(TRUTHS[3]);
        if (!entry.truth5) notFollowed.push(TRUTHS[4]);
        if (!entry.truth6) notFollowed.push(TRUTHS[5]);
        if (!entry.truth7) notFollowed.push(TRUTHS[6]);
        if (!entry.truth8) notFollowed.push(TRUTHS[7]);

        report += `${date}: ${notFollowed.length === 0 ? 
            '✅ Все истины соблюдены' : 
            '❌ Не соблюдались: ' + notFollowed.join(', ')}\n`;
    });

    return report;
}

bot.start(async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    const username = ctx.from?.username || "";
    if (!chatId) {
        await ctx.reply("Чат id не найден.");
        return;
    }
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { chatId } });
    if (!user) {
        console.log("Пользователь не найден, создаем нового.");
        user = new User();
        user.chatId = chatId;
        user.username = username;
        await userRepository.save(user);
    }

    // Создаем кнопку для Web App
    const webAppUrl = process.env.WEBAPP_URL || 'https://your-domain.com';
    const webAppButton = Markup.button.webApp('📊 Отчет', webAppUrl);

    await ctx.reply(
        "Добро пожаловать! Этот бот поможет вам отслеживать соблюдение Благородного Восьмеричного Пути.\n\n" +
        "Используйте меню ниже для навигации или нажмите кнопку для открытия веб-версии:",
        Markup.keyboard([
            ['📝 Новая запись'],
            ['📊 Отчет за неделю', '📈 Отчет за месяц'],
            ['📱 Открыть веб-версию', 'ℹ️ Помощь']
        ]).resize()
    );
});

bot.help((ctx) => {
    return ctx.reply(
        "🙏 Как использовать бот:\n\n" +
        "📝 Новая запись - создать новую запись за сегодня\n" +
        "📊 Отчет за неделю - посмотреть статистику за последние 7 дней\n" +
        "📈 Отчет за месяц - посмотреть статистику за последние 30 дней\n\n" +
        "Команды:\n" +
        "/start - начать работу с ботом\n" +
        "/help - показать это сообщение\n" +
        "/report - сгенерировать отчет\n" +
        "/new - создать новую запись",
        buildMainMenu()
    );
});

bot.command('new', async (ctx) => {
    ctx.session.entry = Array(8).fill(true);
    await ctx.reply("Отметьте истины, которые вы сегодня не соблюдали:", buildKeyboard(ctx.session.entry));
});

bot.command('report', async (ctx) => {
    await ctx.reply(
        "Выберите период для отчета:",
        Markup.inlineKeyboard([
            [Markup.button.callback("За неделю", "report_week")],
            [Markup.button.callback("За месяц", "report_month")]
        ])
    );
});

bot.hears('📝 Новая запись', async (ctx) => {
    ctx.session.entry = Array(8).fill(true);
    await ctx.reply("Отметьте истины, которые вы сегодня не соблюдали:", buildKeyboard(ctx.session.entry));
});

bot.hears('📊 Отчет за неделю', async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) {
        await ctx.reply("Чат id не найден.");
        return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { chatId } });
    if (!user) {
        await ctx.reply("Пользователь не найден.");
        return;
    }
    
    const report = await generateReport(user.id, 6);
    await ctx.reply(report);
});

bot.hears('📈 Отчет за месяц', async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) {
        await ctx.reply("Чат id не найден.");
        return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { chatId } });
    if (!user) {
        await ctx.reply("Пользователь не найден.");
        return;
    }
    
    const report = await generateReport(user.id, 29);
    await ctx.reply(report);
});

bot.hears('📱 Открыть веб-версию', async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) {
        await ctx.reply("Чат id не найден.");
        return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { chatId } });
    if (!user) {
        await ctx.reply("Пользователь не найден.");
        return;
    }
    
    const webAppUrl = process.env.WEBAPP_URL || 'https://your-domain.com';
    // Добавляем user_id в URL как параметр инициализации Web App
    await ctx.reply(
        'Нажмите кнопку ниже, чтобы открыть веб-версию отчета:',
        Markup.inlineKeyboard([
            [Markup.button.webApp('📊 Открыть отчет', `${webAppUrl}?user_id=${user.id}`)]
        ])
    );
});

bot.hears('ℹ️ Помощь', async (ctx) => {
    return ctx.reply(
        "🙏 Как использовать бот:\n\n" +
        "📝 Новая запись - создать новую запись за сегодня\n" +
        "📊 Отчет за неделю - посмотреть статистику за последние 7 дней\n" +
        "📈 Отчет за месяц - посмотреть статистику за последние 30 дней\n\n" +
        "Команды:\n" +
        "/start - начать работу с ботом\n" +
        "/help - показать это сообщение\n" +
        "/report - сгенерировать отчет\n" +
        "/new - создать новую запись",
        buildMainMenu()
    );
});

bot.action(/toggle_(\d+)/, async (ctx) => {
    const index = parseInt(ctx.match[1]);
    ctx.session.entry[index] = !ctx.session.entry[index];
    await ctx.editMessageText(
        "Отметьте истины, которые вы сегодня не соблюдали:",
        buildKeyboard(ctx.session.entry)
    );
});

bot.action('report_week', async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) {
        await ctx.reply("Чат id не найден.");
        return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { chatId } });
    if (!user) {
        await ctx.editMessageText("Пользователь не найден.");
        return;
    }
    
    const report = await generateReport(user.id, 6);
    await ctx.editMessageText(report);
});

bot.action('report_month', async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) {
        await ctx.reply("Чат id не найден.");
        return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { chatId } });
    if (!user) {
        await ctx.editMessageText("Пользователь не найден.");
        return;
    }
    
    const report = await generateReport(user.id, 29);
    await ctx.editMessageText(report);
});

bot.action("submit", async (ctx) => {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) {
        await ctx.reply("Чат id не найден.");
        return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    const entryRepository = AppDataSource.getRepository(Entry);
    const user = await userRepository.findOne({ where: { chatId } });
    if (!user) {
        await ctx.editMessageText("Пользователь не найден.");
        return;
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    let entry = await entryRepository.findOne({ where: { user: { id: user.id }, date: today } });
    if (!entry) {
        entry = new Entry();
        entry.user = user;
        entry.date = today;
    }
    
    const entryState = ctx.session.entry;
    entry.truth1 = entryState[0];
    entry.truth2 = entryState[1];
    entry.truth3 = entryState[2];
    entry.truth4 = entryState[3];
    entry.truth5 = entryState[4];
    entry.truth6 = entryState[5];
    entry.truth7 = entryState[6];
    entry.truth8 = entryState[7];
    
    await entryRepository.save(entry);
    await ctx.editMessageText("Ваши данные сохранены. Спасибо!");
});

bot.catch((err) => {
    console.error("Ошибка в боте:", err);
});

export async function startBot() {
    await bot.launch();
    console.log("Telegram-бот запущен.");
}
