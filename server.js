// Подключение необходимых модулей
const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");
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

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Обработка WebSocket соединения
wss.on("connection", (ws) => {
  console.log("WebSocket соединение установлено");

  // Отправка данных в WebSocket клиент
  function sendDataToClient() {
    // Ваш код для отправки данных в формате JSON
    ws.send(JSON.stringify({ message: "Привет из сервера!" }));
  }

  // Вызываем функцию отправки данных в WebSocket клиент
  sendDataToClient();

  // Обработка сообщений от WebSocket клиента
  ws.on("message", (message) => {
    console.log(`Получено сообщение от клиента: ${message}`);
  });

  // Обработка закрытия WebSocket соединения
  ws.on("close", () => {
    console.log("WebSocket соединение закрыто");
  });
});

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
      .then(() => {
        logBotStatus("Сообщение успешно отправлено");
        res.status(200).json({ success: true });
      })
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

// Функция для вывода сообщения о статусе бота в консоль и отправки на клиентский WebSocket
function logBotStatus(message) {
  console.log(`[Бот] ${message}`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "log", message }));
    }
  });
}

// Маршрут для выполнения команды (start, stop, restart)
app.post("/command", async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) return res.status(400).json({ error: "Команда не передана" });

    if (command === "start") {
      logBotStatus("Бот запущено");
      if (botProcess) return res.status(400).send("Бот вже запущено.");

      try {
        if (bot && bot.isPolling()) {
          bot.stopPolling();
          logBotStatus("Попередній процес Бот успішно зупинено.");
        }

        await lockfile.lock(lockfilePath, lockfileOptions);

        botProcess = spawn("node", ["bot.js"]);

        botProcess.stdout.on("data", (data) => logBotStatus(`Бот: ${data}`));
        botProcess.stderr.on("data", (data) =>
          logBotStatus(`Помилка бота: ${data}`)
        );

        botProcess.on("close", (code) => {
          logBotStatus(`Бот завершив роботу з кодом ${code}`);
          botProcess = null;
          lockfile.unlock(lockfilePath);
        });

        botProcess.on("exit", () => {
          logBotStatus("Процес бот завершився повністю.");
          botProcess = null;
        });

        res.status(200).send("Бот успішно запущено.");
      } catch (error) {
        console.error("Помилка запуску бот:", error);
        res.status(500).send("Помилка запуску бот.");
      }
    } else if (command === "stop") {
      if (!botProcess) return res.status(400).send("Бот вже зупинено.");

      botProcess.kill();
      botProcess = null;
      res.status(200).send("Бот успішно зупинено.");
    } else if (command === "restart") {
      if (!botProcess) return res.status(400).send("Бот ще не запущений.");

      botProcess.kill();
      botProcess = null;

      try {
        await lockfile.lock(lockfilePath, lockfileOptions);

        botProcess = spawn("node", ["bot.js"]);

        botProcess.stdout.on("data", (data) => logBotStatus(`Бот: ${data}`));
        botProcess.stderr.on("data", (data) =>
          logBotStatus(`Помилка бот: ${data}`)
        );

        botProcess.on("close", (code) => {
          logBotStatus(`Бот завершив роботу з кодом ${code}`);
          botProcess = null;
          lockfile.unlock(lockfilePath);
        });

        botProcess.on("exit", () => {
          logBotStatus("Процеси бота закінчилися повністю");
          botProcess = null;
        });

        res.status(200).send("Бот успішно перезапущено.");
      } catch (error) {
        console.error("Помилка запуску бот:", error);
        res.status(500).send("Помилка запуску бот після рестарта.");
      }
    }
  } catch (error) {
    console.error("Помилка:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// Обработка события завершения работы сервера
process.on("SIGINT", () => {
  console.log("Сервер закінчує роботу...");
  if (botProcess) {
    botProcess.kill();
    logBotStatus("Бот успішно зупинено перед завершенням роботи сервера.");
  }
  process.exit();
});

// Запуск сервера на указанном порту
server.listen(port, () => console.log(`Сервер запущено на порту ${port}`));
