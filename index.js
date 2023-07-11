const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const servicesRouter = require('./routes/services');
const usersRouter = require('./routes/users');
const { expressjwt : jwt } = require('express-jwt');
const dotenv = require('dotenv');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieParser());

app.use(bodyParser.json());

dotenv.config({ path:'./.env' })

app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
);

const getTokenFct = (req) => {
    return req.cookies.prometheusUserAuthenticationToken;
}


app.use(jwt({secret: process.env.JWT_SECRET, algorithms: ['HS256'], getToken: getTokenFct}).unless({ path: ['/auth/log-in', '/auth/register', ]}));


app.use('/auth', authRouter);
app.use('/orders', ordersRouter);
app.use('/services', servicesRouter);
app.use('/users', usersRouter);

app.listen('5000', () => {
    console.log('Server started on port 5000')
});

