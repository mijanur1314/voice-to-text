const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const output = document.getElementById("output");

let mediaRecorder = null;
let audioChunks = [];
let recording = false;


const DEEPGRAM_API_KEY = "Token daa3d3359d2f266d2f6b3e923e701ff7feab8260";

recordBtn.addEventListener("click", async () => {
  if (!recording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        statusText.innerText = "🧠 Transcribing...";

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const arrayBuffer = await audioBlob.arrayBuffer();

        try {
          const response = await fetch(
            "https://api.deepgram.com/v1/listen?punctuate=true&language=en",
            {
              method: "POST",
              headers: {
                Authorization: DEEPGRAM_API_KEY,
                "Content-Type": "audio/webm",
              },
              body: arrayBuffer,
            }
          );

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
          }

          const result = await response.json();
          const transcript =
            result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

          output.value = transcript || "No speech detected";
          statusText.innerText = "Idle";
        } catch (err) {
          console.error(err);
          output.value = "Transcription failed";
          statusText.innerText = "Error";
        }
      };

      mediaRecorder.start();
      recording = true;
      recordBtn.innerText = "Stop Recording";
      statusText.innerText = "🎙️ Recording...";
    } catch (err) {
      console.error(err);
      alert("Microphone permission denied");
    }
  } else {
    mediaRecorder.stop();
    recording = false;
    recordBtn.innerText = "Start Recording";
  }
});
