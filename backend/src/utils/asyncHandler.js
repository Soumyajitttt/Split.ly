const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        next(error);
    }
}

// const asyncHandler = (fn) => (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch(next);
// };

export default asyncHandler;


/*const asyncHandler = (fn) =>{ return async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        res.status(error.code || 500).json({
           success: false,
           message: error.message
        })
    }
}}

export default asyncHandler;*/