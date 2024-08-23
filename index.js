const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const fs = require("fs");
const path = require("path");
const util = require("util");
const stream = require("stream");
const mime = require("mime-types");

const sleep = util.promisify(setTimeout);

const PORT = process.env.PORT || 3000;
const app = express();
const filePath = path.join(process.cwd(), "/big.txt");

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(
  cors({
    methods: ["GET"],
    origin: "*",
  })
);

app.use(morgan("dev"));

const readStreamToAsync = (streamChunks) => {
  const asyncStream = stream.Readable.from(streamChunks);
  return asyncStream;
};

app.get("/", async (_, res) => {
  try {
    const fileStream = fs.createReadStream(filePath);

    for await (const chunk of readStreamToAsync(fileStream)) {
      res.write(chunk);
      // await sleep(50); // Espera 1 segundo entre cada chunk
    }

    res.end();
  } catch (e) {
    res.json({
      ok: false,
      error: e.message,
    });
  }
});

app.get("/file", async (_, res) => {
  try {
    const filePath = path.join(process.cwd(), "/test.jpg");
    const fileStream = fs.createReadStream(filePath);
    const mimeType = mime.lookup(filePath);

    const stat = fs.statSync(filePath);
    const fileSizeInBytes = stat.size;
    let totalBytesRead = 0;
    res.writeHead(200, {
      "Content-Type": mimeType,
      "Content-Length": fileSizeInBytes,
      "Last-Modified": stat.mtime.toUTCString(),
      //"Content-Disposition": 'inline; filename="test.jpg"',  // Para mostrar en el navegador
      //"Content-Disposition": 'attachment; filename="test.jpg"'  // O para forzar la descarga
    });

    for await (const chunk of readStreamToAsync(fileStream)) {
      totalBytesRead += chunk.length;
      console.log(`Chunk ${chunk.length} bytes of ${fileSizeInBytes} bytes`);
      console.log(`Total bytes read: ${totalBytesRead}\n`);
      res.write(chunk);
      // await sleep(40); // Introduce un retraso de 50ms entre cada chunk
    }

    res.end(); // Finaliza la respuesta
    console.log("Stream ended");
  } catch (e) {
    console.error(e);
    res.json({
      ok: false,
      error: e.message,
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server listen on port: ${PORT}`);
});
