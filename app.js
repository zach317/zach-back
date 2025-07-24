var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var usersRouter = require("./routes/users");
var categoryRouter = require("./routes/category");
var tagRouter = require("./routes/tag");
var transactionRouter = require("./routes/transaction");
var analysisRouter = require("./routes/analysis");

var app = express();
const authentication = require("./config/authentication");
const camelCaseResponse = require("./config/camelCaseResponse");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(authentication);
app.use(camelCaseResponse);

app.use("/users", usersRouter);
app.use("/category", categoryRouter);
app.use("/tag", tagRouter);
app.use("/transaction", transactionRouter);
app.use("/analysis", analysisRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
