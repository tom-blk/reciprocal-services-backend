const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const servicesRouter = require('./routes/services');
const usersRouter = require('./routes/users');
const countriesRouter = require('./routes/countries');
const storageRouter = require('./routes/storage');
const { expressjwt : jwt } = require('express-jwt');
const environment = require('./environment.config');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieParser());

app.use(bodyParser.json());

app.use(
    cors({
      origin: environment.FRONTEND_URL,
      credentials: true,
    })
);

console.log(`NODE_ENV: ${environment.NODE_ENV}`);
console.log(environment.FRONTEND_URL);

const getTokenFct = (req) => {
    return req.cookies.prometheusUserAuthenticationToken;
}

app.use(jwt({secret: environment.JWT_SECRET, algorithms: ['HS256'], getToken: getTokenFct}).unless({ path: ['/auth/log-in', '/auth/register', ]}));

app.use(express.static('uploads'));

app.use('/auth', authRouter);
app.use('/orders', ordersRouter);
app.use('/services', servicesRouter);
app.use('/users', usersRouter);
app.use('/countries', countriesRouter);
app.use('/storage', storageRouter);

app.listen(5000, '127.0.0.1', () => {
    console.log('Server started on port 5000')
});

