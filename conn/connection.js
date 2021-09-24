
var MongoClient = require('mongodb').MongoClient;

function connectionDatabase() {
    return new Promise((resolve, reject) => {
        // var url = 'mongodb://localhost/crypto_stock';
        var url = 'mongodb+srv://aism:95bcqr1Tech@flightenocluster.irdgi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
        MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
            if (err) {
                // db.close();
                reject(err);
            } else {
                console.log('DataBase Connected!')
                const db = client.db('flighteno');
                resolve(db)
            }//End of  connection success
        });//End of Db Connection
    })//End of promise object
}//End of connectionDatabase

module.exports = connectionDatabase()
