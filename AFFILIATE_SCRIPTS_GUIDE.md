# Примеры партнерских скриптов для Tag Manager

## 🎯 Популярные партнерские сети

### 1. Facebook Pixel

**Тип тега:** Script + Custom JavaScript

**Шаг 1: Добавьте базовый скрипт**
```javascript
// Тип: Script
// URL: https://connect.facebook.net/en_US/fbevents.js
// Триггер: Page View
```

**Шаг 2: Добавьте инициализацию**
```javascript
// Тип: Custom JavaScript
// Триггер: Page View
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
```

**Шаг 3: Трекинг покупок**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
fbq('track', 'Purchase', {
  value: data.value || 0,
  currency: data.currency || 'USD',
  content_ids: data.items ? data.items.map(i => i.item_id) : [],
  content_type: 'product'
});
```

---

### 2. Google Analytics 4 (GA4)

```javascript
// Тип: HTML
// Триггер: Page View
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Трекинг событий:**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
gtag('event', 'purchase', {
  transaction_id: data.transaction_id,
  value: data.value,
  currency: data.currency,
  items: data.items
});
```

---

### 3. Yandex.Metrika

```javascript
// Тип: HTML
// Триггер: Page View
<script type="text/javascript">
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(XXXXXXXX, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true,
        ecommerce:"dataLayer"
   });
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/XXXXXXXX" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
```

**Трекинг целей:**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
ym(XXXXXXXX, 'reachGoal', 'purchase', {
  order_price: data.value,
  currency: data.currency
});
```

---

### 4. TikTok Pixel

```javascript
// Тип: HTML
// Триггер: Page View
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};

  ttq.load('YOUR_PIXEL_ID');
  ttq.page();
}(window, document, 'ttq');
</script>
```

**Трекинг событий:**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
ttq.track('CompletePayment', {
  content_id: data.items[0].item_id,
  content_type: 'product',
  value: data.value,
  currency: data.currency
});
```

---

### 5. VK Pixel (ВКонтакте)

```javascript
// Тип: HTML
// Триггер: Page View
<script type="text/javascript">
!function(){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src='https://vk.com/js/api/openapi.js?169',t.onload=function(){VK.Retargeting.Init("VK-RTRG-XXXXXX-XXXXX"),VK.Retargeting.Hit()},document.head.appendChild(t)}();
</script>
```

**Трекинг событий:**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
VK.Retargeting.Event('purchase');
VK.Goal('purchase', {
  value: data.value
});
```

---

### 6. Партнерская сеть Admitad

```javascript
// Тип: Image Pixel
// URL: https://ad.admitad.com/tt?campaign_code={{campaign_code}}&action_code=1&order_id={{transaction_id}}&tariff_code=1&payment_type=sale&position_id={{item_id}}&position_count={{quantity}}&price={{value}}&currency_code={{currency}}
// Триггер: Custom Event "purchase"
```

**Или через JavaScript:**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
var img = new Image(1, 1);
img.src = 'https://ad.admitad.com/tt?campaign_code=YOUR_CAMPAIGN_CODE&action_code=1&order_id=' + 
  data.transaction_id + '&tariff_code=1&payment_type=sale&position_id=' + 
  data.items[0].item_id + '&position_count=' + data.items[0].quantity + 
  '&price=' + data.value + '&currency_code=' + data.currency;
document.body.appendChild(img);
```

---

### 7. MyTarget (VK Ads)

```javascript
// Тип: HTML
// Триггер: Page View
<script type="text/javascript">
var _tmr = window._tmr || (window._tmr = []);
_tmr.push({id: "XXXXXX", type: "pageView", start: (new Date()).getTime()});
(function (d, w, id) {
  if (d.getElementById(id)) return;
  var ts = d.createElement("script"); ts.type = "text/javascript"; ts.async = true; ts.id = id;
  ts.src = "https://top-fwz1.mail.ru/js/code.js";
  var f = function () {var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ts, s);};
  if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); }
})(document, window, "tmr-code");
</script>
```

**Трекинг покупок:**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
_tmr.push({
  type: 'reachGoal',
  id: XXXXXX,
  goal: 'purchase',
  value: data.value
});
```

---

### 8. Criteo

```javascript
// Тип: HTML
// Триггер: Page View
<script type="text/javascript" src="//static.criteo.net/js/ld/ld.js" async="true"></script>
<script type="text/javascript">
window.criteo_q = window.criteo_q || [];
window.criteo_q.push(
  { event: "setAccount", account: YOUR_ACCOUNT_ID },
  { event: "setSiteType", type: "d" },
  { event: "viewHome" }
);
</script>
```

**Трекинг транзакций:**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
window.criteo_q.push(
  { event: "setAccount", account: YOUR_ACCOUNT_ID },
  { event: "setSiteType", type: "d" },
  { 
    event: "trackTransaction",
    id: data.transaction_id,
    item: data.items.map(item => ({
      id: item.item_id,
      price: item.price,
      quantity: item.quantity
    }))
  }
);
```

---

### 9. Taboola Pixel

```javascript
// Тип: HTML
// Триггер: Page View
<script type='text/javascript'>
  window._tfa = window._tfa || [];
  window._tfa.push({notify: 'event', name: 'page_view', id: YOUR_PIXEL_ID});
  !function (t, f, a, x) {
    if (!document.getElementById(x)) {
      t.async = 1;t.src = a;t.id=x;f.parentNode.insertBefore(t, f);
    }
  }(document.createElement('script'),
  document.getElementsByTagName('script')[0],
  '//cdn.taboola.com/libtrc/unip/YOUR_PIXEL_ID/tfa.js',
  'tb_tfa_script');
</script>
```

**Трекинг конверсий:**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
window._tfa.push({
  notify: 'event',
  name: 'make_purchase',
  id: YOUR_PIXEL_ID,
  revenue: data.value,
  currency: data.currency
});
```

---

### 10. Outbrain Pixel

```javascript
// Тип: HTML
// Триггер: Page View
<script type="text/javascript">
!function(_window, _document) {
  var OB_ADV_ID = 'YOUR_MARKETER_ID';
  if (_window.obApi) {
    var toArray = function(object) {
      return Object.prototype.toString.call(object) === '[object Array]' ? object : [object];
    };
    _window.obApi.marketerId = toArray(_window.obApi.marketerId).concat(toArray(OB_ADV_ID));
    return;
  }
  var api = _window.obApi = function() {
    api.dispatch ? api.dispatch.apply(api, arguments) : api.queue.push(arguments);
  };
  api.version = '1.1';
  api.loaded = true;
  api.marketerId = OB_ADV_ID;
  api.queue = [];
  var tag = _document.createElement('script');
  tag.async = true;
  tag.src = '//amplify.outbrain.com/cp/obtp.js';
  tag.type = 'text/javascript';
  var script = _document.getElementsByTagName('script')[0];
  script.parentNode.insertBefore(tag, script);
}(window, document);

obApi('track', 'PAGE_VIEW');
</script>
```

**Трекинг покупок:**
```javascript
// Тип: Custom JavaScript
// Триггер: Custom Event "purchase"
obApi('track', 'Purchase', {
  orderValue: data.value,
  currency: data.currency,
  orderId: data.transaction_id
});
```

---

## 🎨 Шаблоны универсальных триггеров

### Триггер для всех страниц покупки
```
Тип: URL Match
Паттерн: /checkout|/thank-you|/order-complete
Тип совпадения: Regex
```

### Триггер для категорий товаров
```
Тип: URL Match
Паттерн: /products/
Тип совпадения: Contains
```

### Триггер по прокрутке страницы
```javascript
// Тип: Custom JavaScript
// Триггер: Window Load
let scrolled = false;
window.addEventListener('scroll', function() {
  const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  if (scrollPercent > 75 && !scrolled) {
    scrolled = true;
    window.dataLayer.push({
      event: 'scroll_75_percent'
    });
  }
});
```

### Триггер по времени на странице
```javascript
// Тип: Custom JavaScript
// Триггер: DOM Ready
setTimeout(function() {
  window.dataLayer.push({
    event: 'time_on_page_30s'
  });
}, 30000); // 30 секунд
```

---

## 📊 Рекомендации по настройке

### 1. Порядок загрузки тегов
```
1. Page View триггеры (базовые пиксели)
2. DOM Ready триггеры (работа с контентом)
3. Window Load триггеры (тяжелые скрипты)
4. Custom Events (конверсии, действия)
```

### 2. Оптимизация производительности
- Используйте async/defer для скриптов
- Группируйте похожие теги
- Избегайте дублирования пикселей
- Используйте Image Pixel для простых трекеров

### 3. Тестирование
```bash
# В консоли браузера:
window.dataLayer  # Проверка dataLayer
window.ctm.debug(true)  # Включить отладку
window.ctm.getState()  # Состояние менеджера
```

### 4. Переменные для партнерских скриптов
```
{{page.url}}          → Текущий URL
{{page.title}}        → Заголовок страницы
{{transaction_id}}    → ID заказа из события
{{value}}             → Сумма транзакции
{{currency}}          → Валюта
{{item_id}}           → ID товара
```

---

## 🚨 Частые ошибки и решения

### Ошибка: Скрипт не загружается
**Решение:** Проверьте CORS и Content Security Policy

### Ошибка: События не отправляются
**Решение:** 
```javascript
// Убедитесь, что dataLayer.push вызывается правильно
window.dataLayer.push({
  event: 'purchase',  // event должен быть первым
  // остальные данные
});
```

### Ошибка: Дублирование событий
**Решение:** Используйте флаг `fireOnce: true` для тегов

### Ошибка: Неправильные данные в пикселях
**Решение:** Используйте переменные вместо хардкода:
```javascript
// Плохо:
value: 99.99

// Хорошо:
value: data.value || {{value}} || 0
```

---

## 💡 Полезные паттерны

### Условный запуск тега
```javascript
// Тип: Custom JavaScript
if (data.value > 100) {
  // Запускать только для заказов > 100
  fbq('track', 'Purchase', {
    value: data.value,
    currency: data.currency
  });
}
```

### Отложенная загрузка
```javascript
// Загрузить скрипт через 3 секунды после загрузки страницы
setTimeout(function() {
  var script = document.createElement('script');
  script.src = 'https://partner.com/pixel.js';
  document.head.appendChild(script);
}, 3000);
```

### Фоллбэк значения
```javascript
const value = data.value || window.orderValue || 0;
const currency = data.currency || 'USD';
```

---

Для добавления любого из этих скриптов в ваш Tag Manager:

1. Войдите в админ-панель
2. Выберите контейнер
3. Нажмите "Add Tag"
4. Выберите тип тега
5. Вставьте соответствующий код
6. Настройте триггеры
7. Сохраните и протестируйте
