# Custom Tag Manager (CTM)

Система управления тегами, аналогичная Google Tag Manager, для управления партнерскими скриптами на сайтах рекламодателей.

## 🚀 Возможности

- **Централизованное управление скриптами** - один контейнер для всех партнерских скриптов
- **Гибкие триггеры** - pageview, DOM ready, custom events, URL match, clicks, и другие
- **Типы тегов**:
  - HTML теги
  - JavaScript скрипты (внешние и inline)
  - Пиксели отслеживания
  - Кастомный JavaScript код
- **Переменные** - встроенные переменные (URL, title, referrer) и dataLayer
- **Админ-панель** - удобный веб-интерфейс для управления
- **Безопасность** - JWT аутентификация, rate limiting, валидация
- **Версионирование** - отслеживание изменений контейнеров

## 📋 Требования

- Node.js 16+
- npm или yarn

## 🔧 Установка

1. **Клонируйте репозиторий или скопируйте файлы**

2. **Установите зависимости**
```bash
npm install
```

3. **Настройте переменные окружения**
```bash
cp .env.example .env
# Отредактируйте .env файл, особенно JWT_SECRET
```

4. **Запустите сервер**
```bash
# Для разработки
npm run dev

# Для продакшена
npm start
```

Сервер запустится на `http://localhost:3000`

## 📖 Использование

### 1. Настройка контейнера

1. Войдите в админ-панель: `http://localhost:3000`
   - Email: `admin@example.com`
   - Password: `admin123`

2. Создайте новый контейнер:
   - Нажмите кнопку "+" в разделе Containers
   - Укажите название и домен сайта рекламодателя

3. Скопируйте код установки:
```html
<script src="https://yourdomain.com/container.js?id=CTM-XXXXXXXX"></script>
```

### 2. Установка на сайт рекламодателя

Рекламодатель должен добавить код контейнера в `<head>` секцию своего сайта:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Ваш Tag Manager -->
  <script src="https://yourdomain.com/container.js?id=CTM-1234567890"></script>
</head>
<body>
  <!-- Контент сайта -->
</body>
</html>
```

### 3. Добавление тегов

#### Пример 1: Facebook Pixel
```javascript
// Тип: Script
// URL: https://connect.facebook.net/en_US/fbevents.js
// Триггер: Page View

// Дополнительный Custom JavaScript:
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
```

#### Пример 2: Google Analytics
```javascript
// Тип: HTML
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

#### Пример 3: Affiliate Conversion Pixel
```javascript
// Тип: Image
// URL: https://affiliate.com/track?id={{page.url}}&ref={{page.referrer}}
// Триггер: Custom Event "purchase"
```

### 4. Использование DataLayer

На сайте рекламодателя можно отправлять события через dataLayer:

```javascript
// Отправка кастомного события
window.dataLayer.push({
  event: 'purchase',
  transaction_id: '12345',
  value: 99.99,
  currency: 'USD'
});

// Или использовать публичное API
window.ctm.push({
  event: 'add_to_cart',
  product_id: 'PROD-123'
});
```

### 5. Типы триггеров

| Триггер | Описание | Пример использования |
|---------|----------|----------------------|
| **Page View** | Срабатывает при загрузке страницы | Счетчики посещений |
| **DOM Ready** | Когда DOM полностью загружен | Скрипты, работающие с DOM |
| **Window Load** | Когда все ресурсы загружены | Отложенные скрипты |
| **Custom Event** | На кастомное событие из dataLayer | Отслеживание покупок, регистраций |
| **URL Match** | Когда URL соответствует паттерну | Скрипты только на определенных страницах |
| **Click** | При клике на элемент | Отслеживание кнопок, ссылок |
| **Element Visibility** | Когда элемент виден на экране | Lazy loading скриптов |

### 6. Переменные

Доступные переменные в тегах (используйте `{{variable}}`):

```javascript
{{page.url}}        // Полный URL страницы
{{page.hostname}}   // Домен
{{page.path}}       // Путь URL
{{page.title}}      // Заголовок страницы
{{page.referrer}}   // Реферер

// Переменные из dataLayer
{{transaction_id}}
{{user_id}}
// и любые другие из dataLayer
```

Пример использования:
```javascript
// В поле URL тега:
https://pixel.com/track?url={{page.url}}&title={{page.title}}
```

## 🔐 API Endpoints

### Аутентификация
```bash
# Вход
POST /api/auth/login
Content-Type: application/json
{
  "email": "admin@example.com",
  "password": "admin123"
}

# Регистрация
POST /api/auth/register
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Контейнеры
```bash
# Получить конфигурацию (публичный endpoint)
GET /api/config/:containerId

# Список контейнеров
GET /api/containers
Authorization: Bearer <token>

# Создать контейнер
POST /api/containers
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "My Website",
  "domain": "https://example.com"
}

# Обновить контейнер
PUT /api/containers/:id
Authorization: Bearer <token>

# Удалить контейнер
DELETE /api/containers/:id
Authorization: Bearer <token>
```

### Теги
```bash
# Список тегов
GET /api/containers/:containerId/tags
Authorization: Bearer <token>

# Создать тег
POST /api/containers/:containerId/tags
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "Facebook Pixel",
  "type": "script",
  "src": "https://connect.facebook.net/en_US/fbevents.js"
}

# Обновить тег
PUT /api/tags/:id
Authorization: Bearer <token>

# Удалить тег
DELETE /api/tags/:id
Authorization: Bearer <token>
```

### Триггеры
```bash
# Добавить триггер к тегу
POST /api/tags/:tagId/triggers
Authorization: Bearer <token>
Content-Type: application/json
{
  "type": "pageview"
}

# Удалить триггер
DELETE /api/triggers/:id
Authorization: Bearer <token>
```

## 🗄️ База данных

В базовой версии используется in-memory хранилище. Для продакшена рекомендуется:

### MongoDB (рекомендуется)
```bash
npm install mongoose
```

### PostgreSQL
```bash
npm install pg sequelize
```

### Redis (для кэширования)
```bash
npm install redis
```

## 🔒 Безопасность

### Важные моменты:

1. **Измените JWT_SECRET** в `.env`
2. **Настройте CORS** для разрешенных доменов
3. **Используйте HTTPS** в продакшене
4. **Rate Limiting** уже настроен
5. **Валидация входных данных** реализована
6. **XSS защита** через helmet

### Дополнительные рекомендации:
- Настройте CSP (Content Security Policy)
- Используйте WAF (Web Application Firewall)
- Логируйте все действия
- Регулярно обновляйте зависимости

## 🚀 Деплой в продакшен

### 1. На собственном сервере (VPS)

```bash
# Установка PM2
npm install -g pm2

# Запуск
pm2 start server.js --name tag-manager

# Автозапуск
pm2 startup
pm2 save
```

### 2. Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t tag-manager .
docker run -p 3000:3000 -e JWT_SECRET=your-secret tag-manager
```

### 3. Nginx конфигурация

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Кэширование container.js
    location /container.js {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1h;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

## 🔄 Интеграция с GTM

Можно интегрировать вашу систему с Google Tag Manager:

```javascript
// В GTM создайте Custom HTML тег:
<script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'custom_event_name',
    // ваши данные
  });
</script>

// Ваш Tag Manager будет слушать эти события
```

## 📊 Мониторинг

Добавьте мониторинг для отслеживания:
- Количества запросов к контейнеру
- Ошибок выполнения тегов
- Производительности

Пример с Winston:
```bash
npm install winston
```

## 🐛 Отладка

Включите режим отладки:
```javascript
// На сайте рекламодателя
<script src="https://yourdomain.com/container.js?id=CTM-XXX&debug=true"></script>

// Или через консоль
window.ctm.debug(true);
```

## 📝 Roadmap

- [ ] Визуальный редактор триггеров
- [ ] Предпросмотр тегов перед публикацией
- [ ] История версий и откат
- [ ] A/B тестирование тегов
- [ ] Экспорт/импорт конфигурации
- [ ] Webhooks для уведомлений
- [ ] Детальная аналитика
- [ ] Multi-tenancy поддержка
- [ ] Scheduled triggers
- [ ] Правила приоритета тегов

## 🤝 Вклад

Приветствуются pull requests и issue reports!

## 📄 Лицензия

MIT License

## 💬 Поддержка

Для вопросов и поддержки создайте issue в репозитории.

---

**Важно**: Это базовая реализация. Для продакшена добавьте:
- Реальную базу данных
- Логирование
- Мониторинг
- Резервное копирование
- CDN для container.js
- SSL сертификаты
