const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const { connectToDatabase } = require("./db");
const express = require("express");
const app = express();

// Замените 'YOUR_TELEGRAM_BOT_TOKEN' на ваш токен бота
const botToken = "6350950492:AAF_y895hhntnURQ1PBB5h1WqYn2nCgzUeo"; // Замените на свой токен бота
const bot = new TelegramBot(botToken, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id; // Получаем айди чата
  const userName = msg.from.username;
  const mainMenuKeyboard = {
    reply_markup: {
      keyboard: [
        [{ text: "Категории" }, { text: "Контакты" }],
        [{ text: "Оставить отзыв" }],
      ],
    },
  };

  if (!userName || !chatId) {
    bot.sendMessage(chatId, "Ошибка: Не удалось получить данные пользователя.");
    return;
  }

  bot.sendMessage(chatId, "Главное меню", mainMenuKeyboard);

  try {
    // Подключаемся к базе данных
    const db = await connectToDatabase();
    const collection = db.collection("TelegramUserID"); // Замените на имя вашей коллекции

    // Проверяем, существует ли уже запись с таким chatId
    const existingUser = await collection.findOne({ idTelegram: chatId });

    if (!existingUser) {
      // Если пользователя с таким chatId еще нет в базе данных, сохраняем данные
      await collection.insertOne({ name: userName, idTelegram: chatId });
      console.log(
        `ID чату та ім'я користувача збережені: ${userName}, ${chatId}`
      );
      bot.sendMessage(chatId, "Вітаю!");
    } else {
      // Если пользователь уже существует в базе данных, не добавляем новую запись
      console.log(`Користувач з ID чату ${chatId} вже існує в базі даних.`);
    }
  } catch (error) {
    console.error("Ошибка сохранения данных чата:", error);
    bot.sendMessage(chatId, "Произошла ошибка. Пожалуйста, попробуйте позже.");
  }
});

bot.onText(/iPhone 📱/, (msg) => {
  const chatId = msg.chat.id;
  const description = "iPhone 12";
  const imagePath = path.join(__dirname, "images", "iphone12_blue.png");
  const colorButtons = [
    { text: "Синий", callback_data: "blue" },
    { text: "Зеленый", callback_data: "green" },
    { text: "Пурпурный", callback_data: "purple" },
    { text: "Закрыть", callback_data: "close" },
  ];

  bot
    .sendPhoto(chatId, imagePath, {
      caption: description,
      reply_markup: {
        inline_keyboard: [colorButtons],
      },
    })
    .then((sentMessage) => {
      // Сохраняем ID сообщения для последующего редактирования
      userState[chatId] = sentMessage.message_id;
    })
    .catch((error) => {
      console.error("Ошибка отправки фото:", error);
    });
});

bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  if (data === "close") {
    bot.deleteMessage(chatId, messageId);
  } else {
    const imagePath = path.join(__dirname, "images", `iphone12_${data}.png`);

    if (fs.existsSync(imagePath)) {
      bot
        .sendPhoto(chatId, imagePath, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Синий", callback_data: "blue" }],
              [{ text: "Зеленый", callback_data: "green" }],
              [{ text: "Пурпурный", callback_data: "purple" }],
              [{ text: "Закрыть", callback_data: "close" }],
            ],
          },
          caption: "iPhone 12",
          message_id: messageId,
        })
        .catch((error) => {
          console.error("Ошибка отправки фото:", error);
        });
    } else {
      bot
        .answerCallbackQuery(callbackQuery.id, {
          text: "Ошибка: Файл изображения не найден",
          show_alert: true,
        })
        .catch((error) => {
          console.error("Ошибка ответа на callback запрос:", error);
        });
    }
  }
});

module.exports = bot; // Экспортируем объект бота
