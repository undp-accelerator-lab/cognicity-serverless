("use strict");
/**
 * CogniCity Server /reports endpoint
 * @module reports/index
 **/
// const Sentry = require("@sentry/serverless");
// const Tracing = require("@sentry/tracing");
const reports = require("./model");
const config = require("../config");
const db = require("../utils/db");
const app = require("lambda-api")();
const archives = require("./archive/model");
const timeseries = require("./timeseries/model");

const {
  cacheResponse,
  handleGeoCapResponse,
  handleGeoResponse,
} = require("../utils/utils");
const Cap = require("../utils/cap");
/**
 * Methods to get  reports from database
 * @alias module:src/api/reports/index
 * @param {Object} config Server configuration
 * @param {Object} db sequilize database instance
 */

const cap = new Cap(config); // Setup our cap formatter

app.use((req, res, next) => {
  // do something
  res.cors();
  next();
});

app.get("reports", cacheResponse("1 minute"), (req, res) =>
  reports(config, db)
    .all(req.query.timeperiod, req.query.admin, req.query.disaster)
    .then((data) => {
      // Sentry.setTag("invocation-source", "website");
      // console.log("🚀 ~ file: reports-main.js ~ line 32 ~ .then ~ data", data);
      return handleGeoCapResponse(data, req, res, cap);
    })
    .catch((err) => {
      // Sentry.captureException(err);
      console.log("🚀 ~ file: reports-main.js ~ line 29 ~ err", err);
      res
        .status(400)
        .json({ statusCode: 400, message: "Error while processing request" });
      /* istanbul ignore next */
      //  logger.error(err);
      /* istanbul ignore next */
    })
);

// Get a single report
app.get("reports/:id", cacheResponse("1 minute"), (req, res) =>
  reports(config, db)
    .byId(req.params.id)
    .then((data) => handleGeoResponse(data, req, res))
    .catch((err) => {
      console.log("🚀 ~ file: reports-main.js ~ line 41 ~ err", err);
      /* istanbul ignore next */
      // logger.error(err);
      /* istanbul ignore next */
      // next(err);
    })
);

app.patch("reports/:id", (req, res) => {
  return reports(config, db)
    .addPoint(req.params.id, req.body)
    .then((data) =>
      data
        ? res
            .status(200)
            .json({ statusCode: 200, id: req.params.id, points: data.points })
        : res
            .status(404)
            .json({
              statusCode: 404,
              message: "Report id " + req.params.id + " not found",
            })
            .end()
    )
    .catch((err) => {
      console.log("🚀 ~ file: reports-main.js ~ line 58 ~ err", err);
      /* istanbul ignore next */
      // logger.error(err);
      /* istanbul ignore next */
      // next(err);
    });
});

app.patch("reports/:id/flag", (req, res) => {
  return reports(config, db)
    .setFlag(req.params.id, req.body)
    .then((data) =>
      data
        ? res
            .status(200)
            .json({ statusCode: 200, id: req.params.id, flag: data.flag })
        : res
            .status(404)
            .json({
              statusCode: 404,
              message: "Report id " + req.params.id + " not found",
            })
            .end()
    )
    .catch((err) => {
      console.log("🚀 ~ file: reports-main.js ~ line 76 ~ err", err);
      /* istanbul ignore next */
      // logger.error(err);
      /* istanbul ignore next */
      // next(err);
    });
});

app.get("reports/archive", async (req, res, next) => {
  // do something
  let maxWindow =
    new Date(req.query.start).getTime() +
    config.API_REPORTS_TIME_WINDOW_MAX * 1000;
  let end = new Date(req.query.end);
  if (end > maxWindow) {
    res.status(400).json({
      statusCode: 400,
      error: "Bad Request",
      message:
        "child 'end' fails because [end is more than " +
        config.API_REPORTS_TIME_WINDOW_MAX +
        " seconds greater than 'start']",
      validation: {
        source: "query",
        keys: ["end"],
      },
    });
    return;
  }
  return archives(config, db)
    .all(req.query.start, req.query.end, req.query.admin , req.query.disaster)
    .then((data) => handleGeoCapResponse(data, req, res, cap))
    .catch((err) => {
      console.log("🚀 ~ file: index.js ~ line 46 ~ app.get ~ err", err);
      return res.status(400).json({
        statusCode: 400,
        error: "Could not process the Request",
      });
      /* istanbul ignore next */
    });
});

app.get("reports/timeseries", cacheResponse("1 minute"), (req, res) => {
  // validate the time window, if fails send 400 error
  let maxWindow =
    new Date(req.query.start).getTime() +
    config.API_REPORTS_TIME_WINDOW_MAX * 1000;
  let end = new Date(req.query.end);
  if (end > maxWindow) {
    res.status(400).json({
      statusCode: 400,
      error: "Bad Request",
      message:
        "child 'end' fails because [end is more than " +
        config.API_REPORTS_TIME_WINDOW_MAX +
        " seconds greater than 'start']",
      validation: {
        source: "query",
        keys: ["end"],
      },
    });
    return;
  }
  return timeseries(config, db)
    .count(req.query.start, req.query.end, req.query.admin)
    .then((data) => res.status(200).json({ statusCode: 200, result: data }))
    .catch((err) => {
      console.log("🚀 ~ file: index.js ~ line 46 ~ app.get ~ err", err);
      res
        .status(400)
        .json({ statusCode: 400, result: "Unable to process the request" });
      /* istanbul ignore next */
    });
});

//----------------------------------------------------------------------------//
// Main router handler
//----------------------------------------------------------------------------//
module.exports.main = async (event, context, callback) => {
  await db
    .authenticate()
    .then(() => {
      console.info("INFO - Database connected.");
    })
    .catch((err) => {
      console.error("ERROR - Unable to connect to the database:", err);
    });
  // !!!IMPORTANT: Set this flag to false, otherwise the lambda function
  // won't quit until all DB connections are closed, which is not good
  // if you want to freeze and reuse these connections
  context.callbackWaitsForEmptyEventLoop = false;

  return await app.run(event, context);

  // Run the request

  // app.run(event, context, callback);
}; // end router handler
