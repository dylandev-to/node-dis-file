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
- [✅] Upload ReadableStream
- [✅] Download as file
- [✅] Download as buffer

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

const fileDetails = await disFile.uploadFile(filePath, "testfile.pdf");
console.log(fileDetails);  // Logs the file details from the webhook response
```

Here is an example of how to upload a file using <strong>read stream</strong>.
```javascript
const { DisFile, Utils } = require("node-dis-file")

const myWebhookURL = "https://discord.com/api/webhooks/webhook_id/webhook_token";
const disFile = new DisFile(myWebhookURL);

const response = await axios.get('https://example.com/image.jpg', { responseType: 'arraybuffer' });

// Convert the response data into a buffer
const imageBuffer = Buffer.from(response.data);
const readable = Utils.createChunkedStream(imageBuffer);

const fileDetails = await disFile.uploadFileStream(readable, "MyUploadedImage.jpg")
console.log(fileDetails)
```

This is how the output looks like
```javascript
{
  primaryID: '1322358044503314546',
  fileName: 'MyUploadedImage.jpg',
  fileChunkIDs: [
    '1322358033661038643', // 20 MB
    '1322358038149070859',  // 20 MB
    '1322358044008644681'  // 4.5 MB
  ]
}
```

### Downloading

Here is an example of how to download a file, <strong>file</strong> as output.
```javascript
const { DisFile } = require("node-dis-file")

const myWebhookURL = "https://discord.com/api/webhooks/webhook_id/webhook_token";
const disFile = new DisFile(myWebhookURL);

const filePrimaryID = "1322358044503314546"; // ID gotten from the uploads
const downloadedFile = await disFile.downloadFile(filePrimaryID, "merged.jpg");
console.log(downloadedFile); // Image saved successfully
```

Here is an example of how to download a file, <strong>buffer</strong> as output.
```javascript
const { DisFile } = require("node-dis-file")

const myWebhookURL = "https://discord.com/api/webhooks/webhook_id/webhook_token";
const disFile = new DisFile(myWebhookURL);

const filePrimaryID = "1322358044503314546"; // ID gotten from the uploads
const downloadedFile = await disFile.downloadFileBuffer(filePrimaryID); // Returns a buffer of the file
// Do whatever you want with the buffer.
```

## Contributing

- Feel free to contribute! Whether you're fixing a bug, adding a feature, or improving documentation, your contributions are always welcome.