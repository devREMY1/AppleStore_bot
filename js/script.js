// ADMINS MENU
function openAdminsMenu() {
  var menu = document.getElementById("admins_menu");
  menu.classList.toggle("main__container-menu-open");
}
function closeAdminsMenu() {
  var menu = document.getElementById("admins_menu");
  menu.classList.remove("main__container-menu-open");
}

// Logic Start Restart Stop Bot
// function startBot() {
//   sendCommand("start");
// }

// function stopBot() {
//   sendCommand("stop");
// }

// function restartBot() {
//   sendCommand("restart");
// }

// function sendCommand(command) {
//   fetch("/command", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ command: command }),
//   })
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error("Ошибка отправки команды");
//       }
//       console.log("Команда отправлена успешно");
//     })
//     .catch((error) => {
//       console.error("Произошла ошибка:", error);
//     });
// }
