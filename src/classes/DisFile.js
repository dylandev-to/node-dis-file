const fs = require("fs")

const upload = require("../upload/upload-file");
const { checkFileStream, getChunks, setChunkSize, chunkSize } = require("../utils");

/**
 * DisFile class for managing file uploads/download to Discord via webhooks.
 * 
 * @class DisFile
 */
class DisFile {
    // WebhookURL - Private field
    #webhookURL;

    /**
    * Creates an instance of the DisFile class.
    * 
    * @param {string} webhookURL - The Discord webhook URL to send/get files to/from.
    * @param {number} chunkSize - The size of each chunk to split the file into (default is 20MB).
    */
    constructor(webhookURL, chunkSize = 20 * 1024 * 1024) {
        this.#webhookURL = webhookURL;
        setChunkSize(chunkSize);
    }

    /**
     * Uploads the provided file stream to an external service.
     * 
     * @param {stream.Readable} fileStream - The file stream to upload.
     * @param {string} fileName - The name to be used for the file during the upload (including file extension).
     * @returns {Promise<Object>} - A promise that resolves with the uploaded file details or rejects with an error message.
     */
    uploadFileStream(fileStream, fileName) {
        return new Promise(async (resolve, reject) => {
            try {
                // Validate the file stream using the `checkFileStream` function
                const validationStream = checkFileStream(fileStream);
                // If the validation fails, reject the promise with the validation error message
                if (validationStream) return reject(validationStream);

                // Gets the chunks to upload them separately
                const chunks = await getChunks(fileStream)

                // Check if the fileName is empty
                if (!fileName || fileName.trim() === "") {
                    return reject("fileName cannot be empty.");
                }

                // If the stream is valid and contains data, proceed with uploading the stream
                upload(this.#webhookURL, chunks, fileName)
                    .then(fileDetails => {
                        // Resolve the promise with the uploaded file details if the upload is successful
                        resolve(fileDetails);
                    })
                    .catch(err => {
                        // Reject the promise if there is an error during the upload process
                        reject("Upload failed: " + err);
                    });
            } catch (error) {
                // Catch any unexpected errors that occur during the execution of the function
                reject("Unexpected error: " + error.message);
            }
        });
    }

    /**
     * Uploads a file by reading it from a given file path and streaming it to an external service.
     * 
     * @param {string} filePath - The path to the file to be uploaded.
     * @param {string} fileName - The name to be used for the file during the upload (including file extension).
     * @returns {Promise<Object>} - A promise that resolves with the details of the uploaded file or rejects with an error message.
     */
    uploadFile(filePath, fileName) {
        return new Promise((resolve, reject) => {
            try {
                // Check if the file exists at the specified filePath synchronously
                // If the file doesn't exist, reject the promise with an appropriate error message
                if (!fs.existsSync(filePath)) {
                    return reject("File doesn't exist.");
                }

                // Check if the fileName is empty
                if (!fileName || fileName.trim() === "") {
                    return reject("fileName cannot be empty.");
                }

                // Create a readable stream from the file at the given filePath
                const fileStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });

                // Call the uploadFileStream method to upload the file stream
                // This method returns a Promise, so we handle it using .then() and .catch()
                this.uploadFileStream(fileStream, fileName)
                    .then(fileDetails => {
                        // If the upload is successful, resolve the promise with the file details
                        resolve(fileDetails);
                    })
                    .catch(err => {
                        // If an error occurs during the upload, reject the promise with the error message
                        reject(err);
                    });
            } catch (error) {
                // Catch any unexpected errors (e.g., file access issues) and reject the promise
                reject("An error occurred: " + error.message);
            }
        });
    }

    // downloadFile(fileID) {

    // }
}

module.exports = DisFile