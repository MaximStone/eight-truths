[RU]
# Восьмеричный Путь - Telegram Бот

Telegram-бот для отслеживания соблюдения Благородного Восьмеричного Пути в повседневной жизни. Приложение помогает пользователям вести ежедневный журнал практики и получать статистику по соблюдению каждого аспекта пути.

## Функциональность

- 📝 Ежедневное отслеживание соблюдения 8 аспектов пути
- 💭 Возможность добавления комментариев к каждому дню
- 📊 Еженедельные и месячные отчеты
- 📚 Подробное описание каждого аспекта пути
- 🔔 Ежедневные напоминания
- 🌐 Веб-интерфейс через Telegram Web App

## Технологический стек

- Node.js 20
- TypeScript
- Express.js
- SQLite3
- TypeORM
- Telegraf
- Docker

## Требования

- Node.js 20+
- npm
- Docker (опционально)

## Установка и запуск

### Локальная разработка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/MaximStone/eight-truths.git
cd eight-truths
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` в корне проекта:
```env
TELEGRAM_TOKEN=your_telegram_bot_token
WEBAPP_URL=http://localhost:5000
```

4. Запустите приложение в режиме разработки:
```bash
npm run dev
```

### Запуск через Docker

1. Для разработки:
```bash
docker compose -f docker-compose.dev.yml up --build -d
```

2. Для продакшена:
```bash
docker compose up --build -d
```

## Синхронизация с сервером

Проект включает скрипты для автоматической синхронизации с удаленным сервером:

1. Добавьте в `.env` следующие параметры:
```env
SSH_HOST=your_server_ip
SSH_KEY_PATH=path_to_your_ssh_key
REMOTE_PATH=/path/on/server
SSH_USER=your_ssh_user
```

2. Для одноразовой синхронизации:
```bash
npm run sync
```

3. Для автоматической синхронизации при изменении файлов:
```bash
npm run sync:watch
```

## Структура проекта

```
├── src/
│   ├── app.ts              # Основной файл приложения
│   ├── telegramBot.ts      # Логика Telegram бота
│   ├── entity/            # TypeORM сущности
│   │   ├── Entry.ts       # Модель записи
│   │   └── User.ts        # Модель пользователя
│   └── middleware/        # Middleware компоненты
│       └── telegramAuth.ts # Аутентификация Telegram
├── public/               # Статические файлы
│   └── index.html        # Веб-интерфейс
├── scripts/             # Скрипты утилит
│   ├── sync.js          # Синхронизация с сервером
│   └── watch.js         # Отслеживание изменений
└── docker/              # Docker конфигурация
```

## Основные команды

- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Сборка проекта
- `npm start` - Запуск собранного проекта
- `npm run sync` - Синхронизация с сервером
- `npm run sync:watch` - Автоматическая синхронизация при изменениях

## Функции бота

### Команды бота

- `/start` - Начало работы с ботом
- `/help` - Показать справку
- `/new` - Создать новую запись
- `/report` - Сгенерировать отчет
- `/comment` - Добавить комментарий за сегодня

### Веб-интерфейс

- Просмотр статистики за неделю/месяц
- Редактирование записей
- Добавление и редактирование комментариев
- Подробная информация о каждом аспекте пути

## Безопасность

- Аутентификация пользователей через Telegram
- Проверка подписи данных от Telegram
- Безопасное хранение токенов и конфиденциальных данных

## Лицензия

MIT

## Автор

Максим Костерин + LLM

##
[EN] 
# Eight Truths - Telegram Bot

Telegram bot for tracking adherence to the Noble Eightfold Path in daily life. The application helps users maintain a daily journal of practice and receive statistics on the adherence of each aspect of the path.

## Features

- 📝 Daily tracking of adherence to 8 aspects of the path
- 💭 Ability to add comments to each day
- 📊 Weekly and monthly reports
- 📚 Detailed description of each aspect of the path
- 🔔 Daily reminders
- 🌐 Web interface through Telegram Web App

## Technologies

- Node.js 20
- TypeScript
- Express.js
- SQLite3
- TypeORM
- Telegraf
- Docker

## Requirements

- Node.js 20+
- npm
- Docker (optional)

## Installation and launch

### Local development

1. Clone the repository:
```bash
git clone https://github.com/MaximStone/eight-truths.git
cd eight-truths
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```env
TELEGRAM_TOKEN=your_telegram_bot_token
WEBAPP_URL=http://localhost:5000
```

4. Run the application in development mode:
```bash
npm run dev
```

### Running through Docker

1. For development:
```bash
docker compose -f docker-compose.dev.yml up --build -d
```

2. For production:
```bash
docker compose up --build -d
```

## Synchronization with the server

The project includes scripts for automatic synchronization with the remote server:

1. Add the following parameters to `.env`:
```env
SSH_HOST=your_server_ip
SSH_KEY_PATH=path_to_your_ssh_key
REMOTE_PATH=/path/on/server
SSH_USER=your_ssh_user
```

2. For a one-time synchronization:
```bash
npm run sync
```

3. For automatic synchronization when files change:
```bash
npm run sync:watch
```

## Project structure

```
├── src/
│   ├── app.ts              
│   ├── telegramBot.ts      
│   ├── entity/            
│   │   ├── Entry.ts      
│   │   └── User.ts        
│   └── middleware/        
│       └── telegramAuth.ts 
├── public/               
│   └── index.html        
├── scripts/             
│   ├── sync.js         
│   └── watch.js         
└── docker/              
```

## Main commands

- `npm run dev` - Run in development mode
- `npm run build` - Build the project
- `npm start` - Run the built project
- `npm run sync` - Synchronize with the server
- `npm run sync:watch` - Automatic synchronization when files change

## Bot Functions

### Bot Commands

- `/start` - Start working with the bot
- `/help` - Show help
- `/new` - Create a new entry
- `/report` - Generate a report
- `/comment` - Add a comment for today

### Web Interface

- View statistics for week/month
- Edit entries
- Add and edit comments
- Detailed information about each aspect of the path

## Security

- User authentication through Telegram
- Verification of Telegram data signatures
- Secure storage of tokens and sensitive data

## License

MIT

## Author

Maxim Kosterin + LLM
