const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const { connectToDatabase } = require("./db");

const app = express();
const port = 5500;

app.use(express.json()); // Используем express.json() для обработки JSON данных

// Указываем путь к папке, содержащей статические файлы (HTML, CSS, JS, изображения и т. д.)
app.use(express.static(path.join(__dirname, "public")));

// Обработчик маршрута для главной страницы
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Обработчики маршрутов для остальных страниц
app.get("/category", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "category.html"));
});

app.get("/control", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "control.html"));
});

app.get("/admins", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admins.html"));
});

// Маршрут для получения данных пользователей из базы данных MongoDB
app.get("/control", async (req, res) => {
  try {
    const db = await connectToDatabase(); // Подключаемся к базе данных
    const collection = db.collection("users"); // Указываем коллекцию, где хранятся данные о пользователях
    const users = await collection.find({}).toArray(); // Получаем все данные о пользователях

    // Отправляем данные пользователей в формате JSON
    res.json(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).send("Internal Server Error");
  }
});

let botProcess = null;

app.post("/command", (req, res) => {
  const command = req.body.command;

  if (command === "start") {
    if (!botProcess) {
      // Запуск бота
      botProcess = spawn("node", ["bot.js"]);

      botProcess.stdout.on("data", (data) => {
        console.log(`Бот: ${data}`);
      });

      botProcess.stderr.on("data", (data) => {
        console.error(`Ошибка бота: ${data}`);
      });

      botProcess.on("close", (code) => {
        console.log(`Бот завершил работу с кодом ${code}`);
        botProcess = null;
      });
    } else {
      console.log("Бот уже запущен");
    }
  } else if (command === "stop") {
    if (botProcess) {
      // Остановка бота
      botProcess.kill();
      botProcess = null;
    } else {
      console.log("Бот уже остановлен");
    }
  } else if (command === "restart") {
    if (botProcess) {
      // Перезапуск бота
      botProcess.kill();
      botProcess = null;
    }
    // Запускаем бот снова
    botProcess = spawn("node", ["bot.js"]);

    botProcess.stdout.on("data", (data) => {
      console.log(`Бот: ${data}`);
    });

    botProcess.stderr.on("data", (data) => {
      console.error(`Ошибка бота: ${data}`);
    });

    botProcess.on("close", (code) => {
      console.log(`Бот завершил работу с кодом ${code}`);
      botProcess = null;
    });
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
