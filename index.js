const express = require("express");
const app = express();
const port = 5500; // Вы можете изменить порт по вашему усмотрению

app.use(express.static(__dirname));

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
