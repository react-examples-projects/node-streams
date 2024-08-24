import { useRef, useState } from "react";
import { FcDownload } from "react-icons/fc";

function App() {
  const textareaRef = useRef(null);
  const [value, setValue] = useState("");
  const [progress, setProgress] = useState("");
  const [totalBytes, setTotalBytes] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [previewImage, setPreviewImage] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [logs, setLogs] = useState([]);

  const fetchStream = async () => {
    const response = await fetch("http://localhost:3000/");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    console.log({ reader });

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      result += decoder.decode(value, { stream: true });
      console.log(result);
      setValue(result);
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  };

  const fetchFile = async () => {
    fetch("http://localhost:3000/file")
      .then(async (response) => {
        const totalBytes = Number(response.headers.get("content-length"));
        const values = [];
        const reader = response.body.getReader();
        let bytesReceived = 0;
        let startTime = performance.now();

        setPreviewImage("");
        setIsFetching(true);
        setTotalBytes(totalBytes);

        reader.read().then(function processResult(result) {
          if (result.done) {
            const blob = new Blob(values, { type: "image/jpeg" });
            const url = URL.createObjectURL(blob);

            setPreviewImage(url);
            console.log("Fetch complete");

            console.log(logs);
            setIsFetching(false);
            return;
          }

          const startTimeMs = new Date();
          const bytes = result.value.byteLength;
          bytesReceived += bytes;
          setDownloadedBytes(bytesReceived);

          console.log(`Received ${bytesReceived} bytes of data so far`);

          values.push(result.value);

          const progress = Math.round((bytesReceived / totalBytes) * 100);

          setProgress(progress);

          // Calculate download speed in MB/s
          const currentTime = performance.now();
          const timeElapsed = (currentTime - startTime) / 1000; // Time in seconds
          const speedInMBps = bytesReceived / 1048576 / timeElapsed; // Speed in MB per second

          setDownloadSpeed(speedInMBps);
          console.log(`Download speed: ${speedInMBps.toFixed(2)} MB/s`);

          const endTimeMs = new Date();
          const ms = endTimeMs.getTime() - startTimeMs.getTime();
          console.log(`Time taken: ${ms} ms`);

          setLogs([
            ...logs,
            {
              time: ms,
              speed: speedInMBps,
              progress: progress,
              bytes,
              bytesReceived,
              totalBytes,
            },
          ]);

          return reader.read().then(processResult);
        });
      })
      .catch((error) => {
        console.error(error);
        setIsFetching(false);
      });
  };

  return (
    <div className="wrapper">
      <h1 style={{ marginBottom: "1rem" }}>Streams</h1>
      <div style={{ display: "flex", gap: "5px" }}>
        <button onClick={isFetching ? null : fetchFile} disabled={isFetching}>
          Fetch file
        </button>
        <button onClick={fetchStream}>Fetch Stream</button>
      </div>
      <p
        style={{
          fontSize: "14px",
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ marginRight: "0.5rem" }}>Download Speed:</span>
        <FcDownload />
        <span style={{ marginLeft: "0.3rem" }}>{downloadSpeed.toFixed(2)} MB/s</span>
      </p>
      <p style={{ fontSize: "14px", marginTop: "1rem", marginBottom: "0.4rem" }}>
        {downloadedBytes} bytes of {totalBytes} bytes
      </p>

      <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
        <div className="line-wobble" style={{ "--uib-progress": progress + "%" }}></div>
        {progress > 0 && <span style={{ fontSize: "12px" }}>{progress}%</span>}
      </div>

      {previewImage && (
        <img src={previewImage} alt="Preview" style={{ width: "300px", marginTop: "1rem" }} />
      )}

      <textarea
        ref={textareaRef}
        value={value}
        readOnly
        style={{
          width: "100%",
          minHeight: "400px",
          display: "block",
          marginTop: "1rem",
          fontSize: "13px",
        }}
      />
    </div>
  );
}

export default App;
