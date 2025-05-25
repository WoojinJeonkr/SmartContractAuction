const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../web')));
app.use('/css', express.static(path.join(__dirname, '../css')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../web/index.html'));
});

app.listen(port, () => {
	console.log(`서버 실행: http://localhost:${port}`);
});
