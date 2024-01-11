const mysql = require('mysql2');
const environment = require('../environment.config');

const prometheusDatabase = mysql.createPool({
    connectionLimit: 10,
    host: environment.DATABASE_HOST,
    user: environment.DATABASE_USERNAME,
    password: environment.DATABASE_PASSWORD,
    database: environment.DATABASE,
    multipleStatements: true
});

console.log(environment.DATABASE_HOST)

prometheusDatabase.getConnection((error, connection) => {
    if(error){
        console.log(error);
        if(connection)(
            connection.release()
        )
    }
    console.log('Connected to reciprocal-services-database.');
});

const resetWeeeklyOrderCount = () => {
    let sql = "UPDATE services SET weeklyOrderCount = 0";

    prometheusDatabase.query(sql, (error, result) => {
        if(error){
            console.log(error);
        }
    })
}
  
setInterval(resetWeeeklyOrderCount, 604800000); //Week

module.exports = prometheusDatabase;
