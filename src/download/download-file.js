const axios = require("axios")
const stream = require("stream");
const fs = require('fs')

/**
 * Downloads multiple files sequentially and merges them into a single file.
 * Returns a promise that resolves when all files are merged or rejects on error.
 * 
 * @param {Array<Object>} files - Array of file objects containing URLs and filenames.
 * @param {string} outputFilename - The path where the merged file will be saved.
 * @returns {Promise<void>} - A promise that resolves when the download and merge are complete.
 */
function mergeToBuffer(files) {
    return new Promise(async (resolve, reject) => {
        const buffers = [];

        // Sequentially fetch and merge each chunk
        for (const file of files) {
            try {
                const res = await axios.get(file.url, { responseType: 'stream' });
                if (!res.data) throw new Error(`Failed to fetch ${file.filename}`);

                // Collect the data in a buffer
                const chunks = [];
                res.data.on('data', chunk => chunks.push(chunk));

                // Wait for the stream to end and push to buffers
                await new Promise((resolve, reject) => {
                    res.data.on('end', () => {
                        buffers.push(Buffer.concat(chunks));  // Concatenate chunks into a Buffer
                        resolve();
                    });
                    res.data.on('error', reject);
                });

                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                reject(new Error(`Error downloading file ${file.filename}: ${error.message}`));
                return; // Exit early if there's an error
            }
        }

        // Combine all buffers into a single buffer
        resolve(Buffer.concat(buffers));
    });
}

/**
 * Retrieves all file information (filename and URL) from the specified chunk IDs.
 * The chunk IDs are used to fetch messages from a webhook URL, and the function returns
 * an array of objects containing the filenames and URLs of the attachments, sorted by filename order.
 * 
 * @param {string} webhookURL - The URL of the Discord webhook to fetch the messages from.
 * @param {Array<string>} chunkIDs - An array of chunk IDs to retrieve messages and attachments from.
 * @returns {Promise<Array<Object>>} - A Promise that resolves to an array of objects, 
 *         each containing a `filename` and `url` property for the file, 
 *         sorted in ascending order based on the filename number.
 */
function getAllFiles(webhookURL, chunkIDs) {
    return new Promise((resolve, reject) => {
        // Create an array of promises to fetch the data for each chunk ID
        const chunkDownloadPromises = chunkIDs.map(chunkID => {
            return axios.get(`${webhookURL}/messages/${chunkID}`)
                .then(async (msg) => {
                    // Return the filename and URL for each attachment
                    return {
                        filename: msg.data.attachments[0].filename,
                        url: msg.data.attachments[0].url
                    };
                })
                .catch(err => {
                    // Handle error if fetching fails
                    throw new Error(`Error downloading chunk ${chunkID}: ${err.message}`);
                });
        });

        // Once all chunk data is retrieved, sort them by filename number
        Promise.all(chunkDownloadPromises)
            .then(results => {
                resolve(results.sort((a, b) => {
                    const numA = parseInt(a.filename.split("_")[0], 10);
                    const numB = parseInt(b.filename.split("_")[0], 10);
                    return numA - numB; // Sort in ascending order
                }));
            })
            .catch(err => {
                // Handle any errors that occur during the Promise.all process
                reject(err);
            });
    });
}

/**
 * Downloads a file by fetching the message with the specified primary ID, parsing the data to retrieve
 * all associated chunk files, and merging them into a single buffer.
 * 
 * @param {string} webhookURL - The URL of the Discord webhook to fetch the messages from.
 * @param {string} filePrimaryID - The primary ID of the file to retrieve and merge its chunks.
 * @returns {Promise<Buffer>} - A Promise that resolves to a Buffer containing the merged file data.
 */
function download(webhookURL, filePrimaryID) {
    return new Promise(async (resolve, reject) => {
        // Fetch the message using the primary file ID from the webhook URL
        axios.get(`${webhookURL}/messages/${filePrimaryID}`).then(async msg => {
            // Remove the code block markers and parse the content into JSON
            const json = msg.data.content.replaceAll("```", "");
            const parsed = JSON.parse(json);

            // Retrieve all file information (filenames and URLs) for the chunk IDs in the parsed data
            const allFiles = await getAllFiles(webhookURL, parsed.ids);

            // Merge the chunks into a single buffer
            const mergedBuffer = await mergeToBuffer(allFiles);

            // Resolve the Promise with the merged buffer
            resolve(mergedBuffer);
        }).catch(err => {
            // Reject the Promise if an error occurs at any point
            reject(err);
        });
    });
}

module.exports = {
    download
}