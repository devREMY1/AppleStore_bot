const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const app = express();

// Замените 'YOUR_TELEGRAM_BOT_TOKEN' на ваш токен бота
const botToken = "6350950492:AAF_y895hhntnURQ1PBB5h1WqYn2nCgzUeo"; // Замените на свой токен бота
const bot = new TelegramBot(botToken, { polling: true });

/// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const mainMenuKeyboard = {
    reply_markup: {
      keyboard: [
        [{ text: "Категории" }, { text: "Контакты" }],
        [{ text: "Оставить отзыв" }],
      ],
    },
  };

  bot.sendMessage(chatId, "Главное меню", mainMenuKeyboard);
});

// Обработчик кнопки "Категории"
bot.onText(/Категории/, (msg) => {
  const chatId = msg.chat.id;
  const categoriesMenuKeyboard = {
    reply_markup: {
      keyboard: [
        [
          { text: "iPhone 📱" },
          { text: "AirPods 🎧" },
          { text: "Apple Watch ⌚️" },
        ],
        [{ text: "Главное меню" }],
      ],
    },
  };

  bot.sendMessage(chatId, "Выберите категорию", categoriesMenuKeyboard);
});

// Обработчик кнопок моделей iPhone
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
      console.error("Error sending photo:", error);
    });
});

// Обработчик нажатия на кнопку цвета iPhone
bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  if (data === "close") {
    // Удаляем текущее сообщение
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
          console.error("Error sending photo:", error);
        });
    } else {
      bot
        .answerCallbackQuery(callbackQuery.id, {
          text: "Ошибка: Файл изображения не найден",
          show_alert: true,
        })
        .catch((error) => {
          console.error("Error answering callback query:", error);
        });
    }
  }
});

// Объект для хранения состояния пользователя
const userState = {};

// Обработчик нажатия кнопки
bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  bot.sendMessage(chatId, "Вы нажали на кнопку!");
});
