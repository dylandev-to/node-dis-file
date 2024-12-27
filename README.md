## About

<strong>Welcome to `node-dis-file`, a simple Node.js module for uploading and downloading files using Discord Webhooks</strong>

`node-dis-file` is a Node.js package that simplifies file storage via Discord Webhooks. It allows you to <strong>send and retrieve files over 20 MB</strong>!

### <strong>Important:</strong>
Ensure you are aware of the usage guidelines of Discord webhooks to avoid any misuse.

## Features
- [✅] Upload a file to Discord Webhooks
- [✅] Supports file splitting to avoid Discord Limits
- [✅] No API-Key required
- [✅] 100MB Tested
- [❌] Download file (WIP)
- [❌] Upload ReadableStream (WIP)

## Installation

```sh-session
npm install node-dis-file
```

## Examples

### Uploading

Here is an example of how to upload a file using <strong>file path</strong>.

```javascript
const { DisFile } = require("node-dis-file");

const myWebhookURL = "https://discord.com/api/webhooks/webhook_id/webhook_token";
const disFile = new DisFile(myWebhookURL);

const filePath = "./testfile.pdf";

(async () => {
    try {
        const fileDetails = await disFile.uploadFile(filePath, "testfile.pdf");
        console.log(fileDetails);  // Logs the file details from the webhook response
    } catch (err) {
        console.error(err);  // Logs any errors
    }
})();
```

Here is an example of how to upload a file using <strong>read stream</strong>.
```javascript
const { DisFile } = require("node-dis-file");
const fs = require("fs")

const myWebhookURL = "https://discord.com/api/webhooks/webhook_id/webhook_token";
const disFile = new DisFile(myWebhookURL);

(async () => {
    try {
        const fileDetails = await disFile.uploadFileStream(fs.createReadStream("./testfile.pdf"), "MyUploadedPDF.pdf") // Any Readable Stream
        console.log(fileDetails);  // Logs the file details from the webhook response
    } catch (err) {
        console.error(err);  // Logs any errors
    }
})();
```

### Downloading
Work-in-progress

## Contributing

- Feel free to contribute! Whether you're fixing a bug, adding a feature, or improving documentation, your contributions are always welcome.