// ADMINS MENU
function openAdminsMenu() {
  var menu = document.getElementById("admins_menu");
  menu.classList.toggle("main__container-menu-open");
}
function closeAdminsMenu() {
  var menu = document.getElementById("admins_menu");
  menu.classList.remove("main__container-menu-open");
}
// Создание WebSocket соединения
const socket = new WebSocket("ws://localhost:5500");

// Обработка события открытия соединения
socket.onopen = function () {
  console.log("WebSocket соединение установлено");
};

// Обработка события получения сообщения от сервера
socket.onmessage = function (event) {
  const message = JSON.parse(event.data);
  if (message.type === "log") {
    // Вывод сообщения на страницу
    const consoleDiv = document.getElementById("console");
    consoleDiv.innerHTML += `<li class="main__console-item">${message.message}</li>`;
  }
};

// Отправка команды на сервер
function sendCommand(command) {
  fetch("/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ command }), // Передача команды в формате JSON
  })
    .then((response) => {
      if (response.ok) {
        console.log(`Команда ${command} отправлена успешно`);
      } else {
        console.error(`Ошибка при отправке команды ${command}`);
      }
    })
    .catch((error) => console.error("Ошибка:", error));
}

// Logic Start Restart Stop Bot
function startBot() {
  sendCommand("start");
}

function restartBot() {
  sendCommand("restart");
}

function stopBot() {
  sendCommand("stop");
}

// Функция для отправки сообщения на сервер
function sendMessage() {
  const chatId = document.getElementById("chatIdInput").value;
  const message = document.getElementById("messageInput").value;

  fetch("/sendMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chatId, message }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Сообщение отправлено успешно");
      } else {
        console.error("Ошибка при отправке сообщения");
      }
    })
    .catch((error) => console.error("Ошибка:", error));
}

// Функция для загрузки данных из базы данных
fetch("/getData")
  .then((response) => response.json())
  .then((data) => {
    const userDataContainer = document.getElementById("TelegramUserID");
    data.forEach((user) => {
      userDataContainer.innerHTML += `
                          <ul>
                            <li>Ім'я: ${user.name}</li>
                            <li>Чат ID: ${user.idTelegram}</li>
                            <br/>
                          </ul>
                    `;
    });
  })
  .catch((error) => console.error("Ошибка:", error));

// Отправка сообщения пользователю по айди
function sendMessage() {
  // Получаем идентификатор чата и текст сообщения из полей ввода
  const chatId = document.getElementById("chatIdInput").value;
  const message = document.getElementById("messageInput").value;

  // Отправляем запрос к серверу
  fetch("/sendMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chatId, message }), // Передаем идентификатор чата и сообщение в формате JSON
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("Сообщение успешно отправлено");
      } else {
        console.error("Ошибка отправки сообщения:", data.error);
      }
    })
    .catch((error) => console.error("Ошибка:", error));
}
