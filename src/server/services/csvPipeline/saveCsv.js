const crypto = require('crypto');
const { CSVPipelineError } = require('./CustomErrors');
const fs = require('fs').promises;
const streamBuffers = require('stream-buffers');
const zlib = require('zlib');

async function saveCsv(buffer, filename) {
    // save this buffer into a file
    const randomFilename = `${filename}-${(new Date(Date.now()).toISOString())}-${crypto.randomBytes(16).toString('hex')}`;
    const filepath = `${__dirname}/${randomFilename}.csv`;
    await fs.writeFile(filepath, buffer)
        .catch(err => {
            const message = `Failed to write the file: ${filepath}`;
            throw new CSVPipelineError(`Internal OED error: ${message}`, err.message);
        }); // separate logs function that logs for error message, 1. log it, 2. passback error codes to user, 3. stop process; 
    return filepath;
}

module.exports = saveCsv;