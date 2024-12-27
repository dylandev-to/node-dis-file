const stream = require("stream");

/**
 * Checks if the provided object is a valid readable stream and verifies its content.
 * 
 * @param {stream.Readable} fileStream - The object to check, expected to be a readable stream.
 * @returns {string|null} - Returns an error message if the stream is invalid, empty, or encounters an error, otherwise returns `null` if the stream is valid.
 */
function checkFileStream(fileStream) {
    // Check if the provided object is a valid instance of a Readable stream
    if (!(fileStream instanceof stream.Readable)) {
        // If the object is not a Readable stream, return an error message
        return "Invalid file stream: The provided object is not a valid Readable stream.";
    }

    // Listen for errors emitted by the stream (e.g., if the stream encounters an issue)
    fileStream.on('error', (err) => {
        // Return the error message if the stream encounters an error during reading
        return "Stream error: " + err.message;
    });

    // Check if the stream emits any data
    let hasData = false;

    // Listen to the 'data' event to check if any data is being read
    fileStream.on('data', (chunk) => {
        hasData = true; // If we receive data, set hasData to true
    });

    // After finishing reading, check if any data was emitted
    fileStream.on('end', () => {
        if (!hasData) {
            return "Stream is empty.";
        }
    });

    // If the stream is valid and contains data, return null (indicating no issues)
    return null;
}

/**
 * Splits a file stream into smaller chunk streams and returns them as an array.
 *
 * @param {Readable} fileStream - The input file stream that will be split into chunks. 
 * It should be a readable stream (e.g., `fs.createReadStream`).
 * 
 * @returns {Promise<Array<Readable>>} - A promise that resolves to an array of chunk streams, 
 * where each chunk stream is a `Readable` stream containing a portion of the original file.
 */
function getChunks(fileStream) {
    return new Promise((resolve, reject) => {
        let chunkStreams = [];  // Array to store the chunk streams
        let chunkIndex = 1;  // Counter to keep track of chunk index

        // 'data' event: This is triggered every time a chunk is read from the file stream.
        fileStream.on('data', (chunk) => {
            // Create a new Readable stream for each chunk.
            const chunkStream = new stream.Readable({
                read() {
                    this.push(chunk);  // Push the chunk to the stream
                    this.push(null);    // Push null to indicate the end of the stream
                }
            });

            // Add the chunk stream to the chunkStreams array.
            chunkStreams.push(chunkStream);
            chunkIndex++;  // Increment the chunk index for the next chunk
        });

        // 'end' event: This is triggered when the entire file stream has been read.
        fileStream.on('end', () => {
            resolve(chunkStreams);  // Resolve the promise with the array of chunk streams
        });

        // 'error' event: This is triggered if an error occurs while reading the file.
        fileStream.on('error', (err) => {
            reject(err);  // Reject the promise with the error
        });
    });
}

module.exports = {
    checkFileStream,
    getChunks
}