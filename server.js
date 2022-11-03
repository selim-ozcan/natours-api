const dotenv = require('dotenv');
dotenv.config({ path: './config.env' })

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message);
    console.log('UNHANDLED EXCEPTION! Shutting down...');
    process.exit(1);
});

require('./databaseConnection');
const app = require('./app');

const port = process.env.PORT || 3000;
const host = process.env.HOST;
const server = app.listen(port, host, () => {
    console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION! Shutting down...');
    server.close(() => {
        process.exit(1);
    });
});

// niye bu process.on u en üste taşımamıza gerek yok açıkla.