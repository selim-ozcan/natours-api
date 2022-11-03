const tourModel = require('../models/tourModel');
const tourFields = Object.keys(tourModel.schema.paths);

const allowedQueries = ['sort', 'page', 'limit', 'fields', ...tourFields];

exports.filterRequestQueries = (req, res, next) => {
    Object.keys(req.query).forEach((query, index) => {
        if (!allowedQueries.includes(query)) delete req.query[query];
    });

    next();
}


