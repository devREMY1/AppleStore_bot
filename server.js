const express = require("express");
const { spawn } = require("child_process");

const app = express();
const port = 5500;

app.use(express.json()); // Используем express.json() для обработки JSON данных

app.use(express.static("public"));
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/templates/control.html");
});

let botProcess = null;

function sendMessage() {
  // Получаем текст сообщения из поля ввода
  const message = document.getElementById("messageInput").value;
  const chatId = "yourChatId"; // Замените "yourChatId" на реальный идентификатор чата

  // Отправляем сообщение на сервер
  fetch("/sendMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message, chatId: chatId }), // Отправляем оба поля: message и chatId
  })
    .then((response) => {
      if (response.ok) {
        console.log("Сообщение успешно отправлено");
        // Очищаем поле ввода после успешной отправки
        document.getElementById("messageInput").value = "";
      } else {
        console.error("Ошибка отправки сообщения");
      }
    })
    .catch((error) => {
      console.error("Ошибка сети:", error);
    });
}

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
