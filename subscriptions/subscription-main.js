("use strict");
/**
 * CogniCity Server /floods endpoint
 * @module subscription/index
 **/
const subscriptions = require("./model");
const config = require("../config");
const db = require("../utils/db");
const app = require("lambda-api")();
const Cap = require("../utils/cap");

/**
 * Methods to get  reports from database
 * @alias module:src/api/localarea/index
 * @param {Object} config Server configuration
 * @param {Object} db sequilize database instance
 */

const cap = new Cap(config); // Setup our cap formatter

app.use((req, res, next) => {
    res.cors();
    next();
});

// Get a list of all flood gauge reports
app.get("subscriptions", (req, res, next) => {
    return subscriptions(config, db)
        .all()
        .then(data => res.status(200).json({ result: data }))
        .catch(err => {
            console.log("🚀 ~ file: subscription-main.js:37 ~ err", err);
            return res.status(500).json({ message: "Could not process request" });
            /* istanbul ignore next */
        });
});

app.post("subscriptions/add-subscriber", (req, res, next) => {
    if (!req?.body?.whatsapp) {
        return res.status(400).json({ message: "Bad Request , whatsapp number is needed" });
    }
    return subscriptions(config, db)
        .addNewSubscription(req.body)
        .then(data => res.status(200).json({ data: "Successfully added" }))
        .catch(err => {
            console.log("🚀 ~ file: subscription-main.js:37 ~ err", err);
            return res.status(500).json({ message: "Could not process request" });
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
        .catch(err => {
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
