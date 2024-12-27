const DisFile = require("./src/classes/DisFile")
const { createChunkedStream } = require("./src/utils")

module.exports = {
    DisFile,
    Utils: {
        createChunkedStream
    }
}