const { Client } = require('pg');
let DB = {};

/** Connecting to database */
function connect() {
    DB = new Client({
        host: 'localhost',
        port: 5432,
        database: 'discogs',
        user: 'postgres',
        password: 'postgres'
    });

    DB.connect((error) => {
        if (error) {
            console.log(error.message);
        } else {
            console.log('Connected to database');
        }
    })
}

/** Disconnecting from database */
function disconnect() {
    DB.end();
}

/** Query without parameters */
function query(sqlStatement, resultCallback) {
    DB.query(sqlStatement, function(error, result) {
        if (error) {
            console.log(error.message);
        } else {
            resultCallback(result);
        }
    });

}

/** Query with parameters */
function queryParams(sqlStatement, params, resultCallback) {
    DB.query(sqlStatement, params, function(error, result) {
        if (error) {
            console.log(error.message);
        } else {
            resultCallback(result);
        }
    })
}

//Making functions public
module.exports = {
    connect,
    disconnect,
    query,
    queryParams
};