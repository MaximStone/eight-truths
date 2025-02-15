require('dotenv').config();
const chokidar = require('chokidar');
const { Client } = require('node-scp');
const path = require('path');
const fs = require('fs').promises;
const { readFileSync, existsSync } = require('fs');
const debounce = require('lodash.debounce');

// Проверяем наличие необходимых переменных окружения
const requiredEnvVars = ['SSH_HOST', 'SSH_KEY_PATH', 'REMOTE_PATH', 'SSH_USER'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('Отсутствуют необходимые переменные окружения:', missingVars.join(', '));
    process.exit(1);
}

// Исключаемые файлы и папки
const excludePatterns = [
    'node_modules',
    'dist',
    '.git',
    '.env',
    'data.db',
    '.DS_Store'
];

let sshClient = null;

// Инициализация SSH клиента
async function initSSHClient() {
    if (sshClient) {
        try {
            await sshClient.close();
        } catch (error) {
            console.error('Ошибка при закрытии предыдущего SSH соединения:', error.message);
        }
    }

    sshClient = await Client({
        host: process.env.SSH_HOST,
        port: 22,
        username: process.env.SSH_USER,
        privateKey: readFileSync(process.env.SSH_KEY_PATH),
        allowUnknownHosts: true
    });

    console.log('SSH соединение установлено');
    return sshClient;
}

// Функция для создания удаленной директории
async function ensureRemoteDirectory(client, remotePath) {
    try {
        const dir = path.dirname(remotePath);
        if (!await client.exists(dir)) {
            await client.mkdir(dir, { recursive: true });
            console.log(`Создана директория: ${dir}`);
        }
    } catch (error) {
        if (error.code !== 4) {
            throw error;
        }
    }
}

// Функция для синхронизации одного файла
async function syncFile(localFile) {
    try {
        if (!sshClient) {
            sshClient = await initSSHClient();
        }

        const relativePath = path.relative(process.cwd(), localFile);
        const remotePath = path.join(process.env.REMOTE_PATH, relativePath).replace(/\\/g, '/');

        await ensureRemoteDirectory(sshClient, remotePath);
        await sshClient.uploadFile(localFile, remotePath);
        console.log(`Синхронизирован файл: ${relativePath}`);
    } catch (error) {
        console.error(`Ошибка при синхронизации файла ${localFile}:`, error.message);
        // Переинициализируем клиент при ошибке
        sshClient = null;
    }
}

// Функция для удаления файла на удаленном сервере
async function deleteRemoteFile(localFile) {
    try {
        if (!sshClient) {
            sshClient = await initSSHClient();
        }

        const relativePath = path.relative(process.cwd(), localFile);
        const remotePath = path.join(process.env.REMOTE_PATH, relativePath).replace(/\\/g, '/');

        if (await sshClient.exists(remotePath)) {
            await sshClient.unlink(remotePath);
            console.log(`Удален файл: ${relativePath}`);
        }
    } catch (error) {
        console.error(`Ошибка при удалении файла ${localFile}:`, error.message);
        sshClient = null;
    }
}

// Создаем debounced версию функции синхронизации
const debouncedSync = debounce(syncFile, 300);

// Инициализация наблюдателя за файлами
const watcher = chokidar.watch('.', {
    ignored: [
        /(^|[\/\\])\../,  // dotfiles
        ...excludePatterns.map(pattern => `**/${pattern}/**`),
        ...excludePatterns.map(pattern => `**/${pattern}`),
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
    }
});

// Обработчики событий
watcher
    .on('add', path => debouncedSync(path))
    .on('change', path => debouncedSync(path))
    .on('unlink', path => deleteRemoteFile(path))
    .on('ready', () => console.log('Отслеживание файлов запущено. Ожидание изменений...'))
    .on('error', error => console.error('Ошибка отслеживания:', error));

// Обработка завершения работы
process.on('SIGINT', async () => {
    console.log('\nЗавершение работы...');
    if (sshClient) {
        await sshClient.close();
    }
    process.exit(0);
}); 