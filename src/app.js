const express = require('express');
const path = require('path');

const app = express();

const routes = require('./routes/routes');

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.set('view engine', 'ejs');

app.set(
    'views',
    path.join(__dirname, 'views')
);

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);

app.use(routes);

module.exports = app;