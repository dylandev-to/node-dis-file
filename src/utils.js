const stream = require("stream");
const { DisFile } = require("..");

// This will split the read stream into chunks to avoid the webhook limit
var chunkSize = 20 * 1024 * 1024; // 20 MB

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
 * @param {number} chunkSize - The size of each chunk in bytes. This determines the size of each chunk stream.
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
            console.log(`Chunk ${chunkIndex}:`, `Size: ${chunk.length} bytes`);
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

/**
 * Creates a Readable stream that reads data from a provided buffer in chunks.
 * This allows you to process large files or data in smaller pieces without 
 * having to load everything into memory at once.
 * 
 * @param {Buffer} fileBuffer - The buffer containing the data to be streamed.
 * @returns {Readable} - A readable stream that emits chunks of the provided buffer.
 */
function createChunkedStream(fileBuffer) {
    const readable = new stream.Readable({
        /**
         * This method is called when data is being read from the stream.
         * It slices the file buffer into smaller chunks and pushes them to the stream.
         * 
         * @param {number} size - The desired size of the chunk to be read (not used here, as we're using DisFile.chunkSize).
         */
        read(size) {
            let offset = 0; // Keeps track of the current position in the buffer.
            // While there's more data to read from the buffer, slice it into chunks
            while (offset < fileBuffer.length) {
                // Slice the buffer into chunks of DisFile.chunkSize and push them to the stream
                const chunk = fileBuffer.slice(offset, offset + chunkSize);
                this.push(chunk);
                offset += chunkSize; // Move the offset by the chunk size
            }
            this.push(null); // Signal the end of the stream
        }
    });
    return readable; // Return the chunked readable stream
}

/**
 * Sets the chunk size for file uploads.
 * 
 * @param {number} newChunkSize - The new chunk size in bytes. 
 * This value will be used to split the file into chunks during the upload process.
 */
function setChunkSize(newChunkSize) {
    chunkSize = newChunkSize;
}


module.exports = {
    checkFileStream,
    getChunks,
    createChunkedStream,
    setChunkSize,
    chunkSize
}