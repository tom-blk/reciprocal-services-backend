const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const servicesRouter = require('./routes/services');
const usersRouter = require('./routes/users');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieParser());

app.use(bodyParser.json());

app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
);


app.use('/auth', authRouter);
app.use('/orders', ordersRouter);
app.use('/services', servicesRouter);
app.use('/users', usersRouter);

app.listen('5000', () => {
    console.log('Server started on port 5000')
});

