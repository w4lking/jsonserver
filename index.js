const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');

const dbops = require('./src/dbops');

const Port = process.env.PORT || 5000;

// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'dnfazenda3.0'
// });

const connection = mysql.createConnection({
    host: 'sm9j2j5q6c8bpgyq.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'x38jfmu3edne0yqt',
    password: 'ghawo5zg3e4dh6ss',
    database: 'wvkodl2t5418w4qr'
});
connection.connect();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(dbops(connection));

app.listen(Port, function() {
    console.log('Server is running: ' + Port);
});

app.get('/', function(req, res) {
    res.send('Hello server 5000 is working as expected 1.2.1');
});

app.post('/', function(req, res) {
    res.status(200).send({
        'message': 'Data received'
    })
});