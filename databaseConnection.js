const mongoose = require('mongoose');

const connectionString = process.env.CONNECTION_STRING.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
mongoose.connect(connectionString).then(() => {
    console.log('Database connection succesful.');
});