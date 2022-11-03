module.exports = (err, req, res, next) => {
    req.statusCode = err.statusCode || 500;
    req.status = err.status || 'error';

    if (process.env.NODE_ENV === 'production') {
        // TODO add better mongoDB error messages for the following if blocks.
        // mongoDB id related errors
        if (err.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                data: {
                    message: 'Invalid ID'
                }
            });
        }

        // mongodDB duplicate field related errors
        if (err.code === 11000) {
            return res.status(400).json({
                status: 'error',
                data: {
                    message: 'Duplicate fields'
                }
            });
        }

        // mongodDB validation related errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                status: 'error',
                data: {
                    message: 'Invalid input data'
                }
            });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                data: {
                    message: 'Invalid Token! Please login again'
                }
            })
        };

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                data: {
                    message: 'Your token has expired!'
                }
            })
        };

        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            data: { message: 'Something went very wrong!' }
        })

    } else if (process.env.NODE_ENV === 'development') {
        res.status(req.statusCode).json({
            status: req.status,
            data: {
                message: err.message,
                error: err,
                stack: err.stack
            }
        });
    }
}