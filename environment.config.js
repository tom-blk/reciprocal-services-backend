const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
    path: `./.env.${process.env.NODE_ENV}`
});

module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE: process.env.DATABASE || 'prometheus_db_mirror',
    DATABASE_USERNAME: process.env.DATABASE_USERNAME || 'prometheus-db-mirror-admin',
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '7g7J2w4etDyARN',
    DATABASE_HOST: process.env.DATABASE_HOST || '127.0.0.1',
    JWT_SECRET: process.env.JWT_SECRET || 'QGdOKtWU-aö%v89qa3JAgfa$$eQ6Q57&8rh§!aht!aEAfea',
    FRONTEND_URL: process.env.CORS_EXCEPTION || 'http://localhost:3000',
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000'
}