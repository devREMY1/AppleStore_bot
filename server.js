// Подключение необходимых модулей
const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const lockfile = require("proper-lockfile");

// Импорт функции подключения к базе данных и объекта бота
const { connectToDatabase } = require("./db");
const bot = require("./bot");

// Инициализация приложения Express
const app = express();
const port = 5500;

// Использование middleware для обработки JSON данных и статических файлов
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Настройка маршрутов страниц
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);
app.get("/category", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "category.html"))
);
app.get("/control", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "control.html"))
);
app.get("/admins", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admins.html"))
);

// Маршрут для получения данных из базы данных и отправки их клиенту в формате JSON
app.get("/getData", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("TelegramUserID");
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка сервера");
  }
});

// Маршрут для отправки сообщения пользователю
app.post("/sendMessage", async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ error: "Не передан chatId или message" });
    }
    if (!bot) return res.status(400).json({ error: "Бот не запущен" });

    bot
      .sendMessage(chatId, message)
      .then(() => res.status(200).json({ success: true }))
      .catch((error) =>
        res.status(500).json({ error: "Ошибка отправки сообщения" })
      );
  } catch (error) {
    console.error("Ошибка:", error);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Установка пути и опций для блокировки
const lockfilePath = path.join(__dirname, "bot.lock");
const lockfileOptions = { retries: 10 };

let botProcess = null;

// Функция для вывода сообщения о статусе бота в консоль
function logBotStatus(message) {
  console.log(`[Бот] ${message}`);
}

// Маршрут для выполнения команды (start, stop, restart)
app.post("/command", async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) return res.status(400).json({ error: "Команда не передана" });

    if (command === "start") {
      if (botProcess) return res.status(400).send("Бот уже запущен.");

      try {
        if (bot && bot.isPolling()) {
          bot.stopPolling();
          logBotStatus("Предыдущий процесс бота успешно остановлен.");
        }

        await lockfile.lock(lockfilePath, lockfileOptions);

        botProcess = spawn("node", ["bot.js"]);

        botProcess.stdout.on("data", (data) => logBotStatus(`Бот: ${data}`));
        botProcess.stderr.on("data", (data) =>
          logBotStatus(`Ошибка бота: ${data}`)
        );

        botProcess.on("close", (code) => {
          logBotStatus(`Бот завершил работу с кодом ${code}`);
          botProcess = null;
          lockfile.unlock(lockfilePath);
        });

        botProcess.on("exit", () => {
          logBotStatus("Процесс бота завершился полностью.");
          botProcess = null;
        });

        res.status(200).send("Бот успешно запущен.");
      } catch (error) {
        console.error("Ошибка запуска бота:", error);
        res.status(500).send("Ошибка запуска бота.");
      }
    } else if (command === "stop") {
      if (!botProcess) return res.status(400).send("Бот уже остановлен.");

      botProcess.kill();
      botProcess = null;
      res.status(200).send("Бот успешно остановлен.");
    } else if (command === "restart") {
      if (!botProcess) return res.status(400).send("Бот еще не запущен.");

      botProcess.kill();
      botProcess = null;

      try {
        await lockfile.lock(lockfilePath, lockfileOptions);

        botProcess = spawn("node", ["bot.js"]);

        botProcess.stdout.on("data", (data) => logBotStatus(`Бот: ${data}`));
        botProcess.stderr.on("data", (data) =>
          logBotStatus(`Ошибка бота: ${data}`)
        );

        botProcess.on("close", (code) => {
          logBotStatus(`Бот завершил работу с кодом ${code}`);
          botProcess = null;
          lockfile.unlock(lockfilePath);
        });

        botProcess.on("exit", () => {
          logBotStatus("Процесс бота завершился полностью.");
          botProcess = null;
        });

        res.status(200).send("Бот успешно перезапущен.");
      } catch (error) {
        console.error("Ошибка запуска бота:", error);
        res.status(500).send("Ошибка запуска бота после рестарта.");
      }
    }
  } catch (error) {
    console.error("Ошибка:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обработка события завершения работы сервера
process.on("SIGINT", () => {
  console.log("Сервер завершает работу...");
  if (botProcess) {
    botProcess.kill();
    logBotStatus("Бот успешно остановлен перед завершением работы сервера.");
  }
  process.exit();
});

// Запуск сервера на указанном порту
app.listen(port, () => console.log(`Сервер запущен на порту ${port}`));
