/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { createSchema } = require('../models/database');
const { log } = require('../log');
const { getConnection, dropConnection } = require('../db');
(async function createSchemaWrapper() {
	const conn = getConnection();
	console.log(conn)
	console.log('In createDB');
	try {
		console.log('In TRY');
		await createSchema(conn);
		console.log('After createSchema');
		log.info('Schema created', skipMail = true);
	} catch (err) {
		console.log('ERROR, attempting to log err');
		log.error(`Error creating schema: ${err}`, err, skipMail = true);
		console.log('222After logging');
	} finally {
		console.log('Dropping connection');
		dropConnection();
	}
	console.log('Leaving createDB');
}());

