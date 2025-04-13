// 處理 404 錯誤
const notFound = (req, res, next) => {
  const error = new Error(`無法找到 - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// 處理一般錯誤
const errorHandler = (err, req, res, next) => {
  // 如果狀態碼仍為 200，則設為 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler }; 