# 20 мини-игр с ИИ

Статическая браузерная игра: 20 мини-игр, 4 уровня сложности и ИИ в дуэльных режимах.

## Как запустить

Откройте `index.html` в браузере.

## Как выложить на GitHub Pages

1. Создайте новый репозиторий на GitHub.
2. Загрузите в корень репозитория файлы `index.html`, `style.css`, `script.js` и `README.md`.
3. Откройте `Settings -> Pages`.
4. В `Build and deployment` выберите `Deploy from a branch`.
5. Выберите ветку `main` и папку `/root`.
6. Сохраните. Через минуту GitHub даст ссылку на игру.

## Как выложить на Render

1. Загрузите эти файлы в GitHub-репозиторий.
2. Откройте Render Dashboard.
3. Выберите `New -> Static Site`.
4. Подключите GitHub-репозиторий с игрой.
5. Укажите:
   - Build Command: `echo "No build needed"`
   - Publish Directory: `.`
6. Нажмите `Create Static Site`.

В репозитории также есть `render.yaml`, поэтому можно подключить проект через Render Blueprint.

## Файлы

- `index.html` — страница игры.
- `style.css` — оформление.
- `script.js` — логика всех мини-игр и уровней сложности.
- `render.yaml` — настройки для Render.
