const axios = require("axios")
const FormData = require('form-data');

/**
 * Uploads a file stream to a specified webhook URL.
 *
 * @param {string} webhookURL - The URL where the file should be uploaded. This is the webhook endpoint.
 * @param {Readable} fileStream - The readable stream of the file to be uploaded. This could be a file stream created by `fs.createReadStream()`.
 * @param {string} fileName - The name of the file to be uploaded. This will be used as the `filename` in the multipart form-data request.
 *
 * @returns {Promise<string>} - A promise that resolves with the file ID (`response.data.id`) returned from the server after a successful upload.
 *                               If an error occurs during the request, the promise will be rejected with the error.
 */
function oneFile(webhookURL, fileStream, fileName) {
    return new Promise((resolve, reject) => {
        // Create a new FormData instance to handle file upload
        const form = new FormData();

        // Append the file stream to the form data, specifying the filename
        form.append('file', fileStream, { filename: fileName });

        // Perform the POST request to the webhook URL
        axios.post(webhookURL + "?wait=true", form, {
            headers: {
                ...form.getHeaders()  // Include the appropriate headers for the form data
            }
        })
            .then(response => {
                // Resolve the promise with the file ID from the response
                resolve(response.data.id);
            })
            .catch(error => {
                // Reject the promise if there's an error with the request
                reject(error);
            });
    });
}

/**
 * Sends a JSON payload containing file IDs and the filename to a specified webhook URL.
 *
 * @param {string} webhookURL - The URL to which the JSON payload will be sent. This should be an endpoint that accepts JSON data.
 * @param {Array<string>} ids - An array of file IDs that have been previously uploaded. These IDs are included in the payload.
 * @param {string} fileName - The name of the file associated with the uploaded chunks. This is sent as part of the payload.
 *
 * @returns {Promise<string>} - A promise that resolves with the primary file ID (`response.data.id`) returned by the server
 *                              after the payload is successfully sent. The promise is rejected if an error occurs during the request.
 */
function sendFilePrimaryID(webhookURL, ids, fileName) {
    return new Promise((resolve, reject) => {
        // Perform a POST request to the webhook URL, sending the file IDs and filename
        axios.post(webhookURL + "?wait=true", {
            content: "```" +  // Encapsulate the JSON payload in code block formatting (Markdown style)
                JSON.stringify({
                    filename: fileName,
                    ids: ids
                }, null, 2)  // Pretty-print the JSON with 2 spaces for readability
                + "```"
        })
            .then(response => {
                // Resolve the promise with the response file ID
                resolve(response.data.id);
            })
            .catch(error => {
                // Reject the promise if the request fails
                reject(error);
            });
    });
}

/**
 * Uploads multiple file chunks to a webhook URL and sends the list of uploaded file IDs.
 *
 * @param {string} webhookURL - The URL to which the file chunks will be uploaded. This is the endpoint for handling file uploads.
 * @param {Array<Readable>} chunks - An array of readable streams, each representing a chunk of the file to be uploaded.
 * @param {string} fileName - The name of the file being uploaded. This name is used for each chunk during the upload process.
 *
 * @returns {Promise<string>} - A promise that resolves with the primary file ID returned by the server after all chunks are uploaded and processed.
 *                              If any part of the process fails, the promise is rejected with the error message.
 */
function upload(webhookURL, chunks, fileName) {
    return new Promise(async (resolve, reject) => {
        try {
            const ids = [];  // Array to store file IDs after each chunk upload

            // Map each chunk to an upload request (returns an array of promises)
            const promises = chunks.map(async (fsChunk, i) => {
                const fileID = await oneFile(webhookURL, fsChunk, `${String(i).padStart(3, '0')}_` + fileName);  // Upload each chunk
                ids.push(fileID);  // Store the resulting file ID
            });

            // Wait for all chunk uploads to complete
            await Promise.all(promises);

            // Send the list of uploaded file IDs to get the primary file ID
            sendFilePrimaryID(webhookURL, ids, fileName).then(id => {
                resolve({
                    primaryID: id,
                    fileName: fileName,
                    fileChunkIDs: ids
                });  // Resolve with the primary file details
            }).catch(err => {
                reject(err);  // Reject if the final request fails
            });
        }
        catch (err) {
            reject(err.message);  // Reject the promise with the error message if an error occurs
        }
    });
}

module.exports = upload