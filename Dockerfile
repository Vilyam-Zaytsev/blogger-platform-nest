# Используем официальный Node.js образ с Alpine
FROM node:20-alpine

# Установка рабочей директории
WORKDIR /usr/src/app

# Копируем package.json и yarn.lock
COPY package.json yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Копируем только нужные файлы (с учётом .dockerignore)
COPY . .

# Сборка приложения
RUN yarn build

# Приложение слушает порт 3000
EXPOSE 3000

# Команда запуска
CMD ["node", "dist/main"]
