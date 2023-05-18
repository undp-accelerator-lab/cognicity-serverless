/**
 * CogniCity Server /floodgauges data model
 * @module src/api/floodgauges/model
 **/
const { QueryTypes } = require("@sequelize/core");

/**
 * Methods to get floodgauges layers from database
 * @alias module:src/api/floodgauges/model
 * @param {Object} config Server configuration
 * @param {Object} db PG Promise database instance
 * @return {Object} Query methods
 */
const subscriptions = (config, db, logger) => ({
  all: () =>
  new Promise((resolve, reject) => {
    // Setup query
    let query = `SELECT * FROM ${config.TABLE_SUBSCRIPTIONS}`;

    // Execute
    db.query(query, {
      type: QueryTypes.SELECT,
    })
      .then((data) => {
        resolve(data);
      })
      /* istanbul ignore next */
      .catch((err) => {
        /* istanbul ignore next */
        reject(err);
      });
  }),

  addNewSubscription : (body) => {
    return new Promise((resolve , reject) => {
      let query =  `
      INSERT INTO ${config.TABLE_SUBSCRIPTIONS} (facebook, twitter, instagram , whatsapp , telegram , region_code)
      VALUES (COALESCE(?,null) , COALESCE(?,null) , COALESCE(?,null) , COALESCE(?,null) , COALESCE(?,null) , ? );
    `;
      // Execute
      db.query(query, {
      type: QueryTypes.INSERT,
      replacements:[
        body?.facebook,
        body?.twitter,
        body?.instagram,
        body?.whatsapp,
        body?.telegram,
        body?.area_id,
      ]
      })
      .then((data) => {
        resolve(data);
      })
      /* istanbul ignore next */
      .catch((err) => {
        /* istanbul ignore next */
        reject(err);
      });
  })
}
})

module.exports = subscriptions;
