const config = require('config');
const debug = require('debug')('app:startup');
const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

if (!config.get('jwtPrivateKey')) {
    console.error('FATAL ERROR: jwtPrivateKey is not defined');
    process.exit(1);
}

if (config.get('isHosted') !== 'true') {
    mongoose.connect('mongodb://localhost/playground')
        .then(() => debug('Connected to database'))
        .catch(error => {
            console.error('Unable to connect to database', error);
            process.exit(1);
        });
} else {
    mongoose.connect('mongodb://mongo/playground')
        .then(() => debug('Connected to database'))
        .catch(error => {
            console.error('Unable to connect to database', error);
            process.exit(1);
        });
}

const express = require('express');
const app = express();

app.set('view engine', 'pug');

app.use(express.json());
app.use(require('cookie-parser')());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(require('helmet')());
if (app.get('env') === 'development') {
    app.use(require('morgan')('tiny'));
    debug('Logging enabled');
}

app.use(require('./middleware/authenticator'));
app.use('/', require('./routes/home'));
app.use('/api/users', require('./routes/user').router);
app.use('/login', require('./routes/auth').router);

app.use(require('./middleware/authorize'));
app.use('/api/genres', require('./routes/crud')(require('./models/genre')).router);
app.use('/api/customers', require('./routes/crud')(require('./models/customer')).router);
app.use('/api/movies', require('./routes/crud')(require('./models/movie')).router);
app.use('/api/rentals', require('./routes/crud')(require('./models/rental')).router);

app.use(require('./middleware/error'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    debug(`Listening on port ${port}...`)
});