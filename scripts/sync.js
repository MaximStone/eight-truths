require('dotenv').config();
const { Client } = require('node-scp');
const path = require('path');
const fs = require('fs').promises;
const { readFileSync, statSync } = require('fs');

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
    '.DS_Store',
    'pages'
];

// Функция для проверки, нужно ли исключить файл/папку
function shouldExclude(filePath) {
    const relativePath = path.basename(filePath);
    return excludePatterns.some(pattern => 
        relativePath === pattern || 
        relativePath.startsWith(pattern + '/') ||
        filePath.includes('/' + pattern + '/')
    );
}

// Функция для рекурсивного получения всех файлов в директории
async function getFiles(dir) {
    const files = [];
    
    async function scan(currentPath) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            const relativePath = path.relative(localPath, fullPath);
            
            if (shouldExclude(relativePath)) {
                continue;
            }
            
            if (entry.isDirectory()) {
                await scan(fullPath);
            } else {
                files.push({
                    local: fullPath,
                    remote: path.join(process.env.REMOTE_PATH, relativePath).replace(/\\/g, '/')
                });
            }
        }
    }
    
    await scan(dir);
    return files;
}

// Путь к локальной директории проекта
const localPath = path.resolve(__dirname, '..');

async function sync() {
    console.log('Начинаем синхронизацию...');
    
    try {
        // Создаем SSH клиент
        const client = await Client({
            host: process.env.SSH_HOST,
            port: 22,
            username: process.env.SSH_USER,
            privateKey: readFileSync(process.env.SSH_KEY_PATH),
            // Добавляем опцию для автоматического принятия нового хоста
            allowUnknownHosts: true
        });

        console.log('SSH соединение установлено');

        // Получаем список всех файлов для синхронизации
        const files = await getFiles(localPath);
        console.log(`Найдено ${files.length} файлов для синхронизации`);

        // Создаем все необходимые директории на удаленном сервере
        const directories = new Set(files.map(f => path.dirname(f.remote)));
        for (const dir of directories) {
            try {
                console.log(`Создаем директорию ${dir}`);
                if (await client.exists(dir)) {
                    console.log(`Директория ${dir} уже существует`);
                } else {
                    await client.mkdir(dir, { recursive: true,  });
                }
            } catch (error) {
                if (error.code !== 4) {
                    throw error;
                }
            }
        }

        // Синхронизируем файлы
        for (const [index, file] of files.entries()) {
            const progress = ((index + 1) / files.length * 100).toFixed(1);
            console.log(`[${progress}%] Синхронизация: ${file.remote}`);
            
            try {
                await client.uploadFile(file.local, file.remote);
            } catch (error) {
                console.error(`Ошибка при загрузке файла ${file.local}:`, error.message);
                throw error;
            }
        }

        console.log('Синхронизация успешно завершена');
        await client.close();

    } catch (error) {
        console.error('Ошибка при синхронизации:', error.message);
        process.exit(1);
    }
}

sync(); 