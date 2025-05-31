# Используем официальный Node.js образ с Alpine для легковесности
FROM node:20-alpine

# Устанавливаем рабочую директорию в контейнере
WORKDIR /usr/src/app

# Копируем package.json и yarn.lock для установки зависимостей
COPY package.json yarn.lock ./

# Устанавливаем зависимости (используем yarn, если вы им пользуетесь)
RUN yarn install --frozen-lockfile

# Копируем весь исходный код в контейнер
COPY . .

# Собираем проект (команда из вашего package.json)
RUN yarn build

# Открываем порт 3000 (порт вашего приложения)
EXPOSE 3000

# Команда запуска приложения в production режиме
CMD ["node", "dist/main"]
