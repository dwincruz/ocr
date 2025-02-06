import React, { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import "./App.css";

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [ocrResult, setOcrResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraMode, setCameraMode] = useState("environment"); // Default: rear camera

  // Function to start the camera
  const startCamera = async (mode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode, // Switch between rear and front
          width: { ideal: 720 }, // Adjust the ideal width for portrait mode
          height: { ideal: 1280 }, // Adjust the ideal height for 9:16 ratio
          aspectRatio: 9 / 16, // Set aspect ratio to 9:16
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  // Start the camera when the component mounts
  useEffect(() => {
    startCamera(cameraMode);

    // Cleanup: Stop the camera when the component unmounts
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraMode]); // Restart camera when mode changes

  // Toggle between front and rear camera
  const toggleCamera = () => {
    setCameraMode((prevMode) =>
      prevMode === "environment" ? "user" : "environment"
    );
  };

  // Capture photo
  const handleCapture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setImage(canvas.toDataURL("image/png"));
    }
  };

  // Handle file upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform OCR using Tesseract.js
  const handleOCR = async () => {
    if (!image) {
      alert("Please capture or upload an image first!");
      return;
    }

    setIsProcessing(true);
    setOcrResult(""); // Clear previous result

    try {
      const result = await Tesseract.recognize(image, "eng", {
        logger: (info) => console.log(info), // Log progress
      });
      setOcrResult(result.data.text);
    } catch (error) {
      console.error("OCR Error:", error);
      setOcrResult("Failed to extract text.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%", // Adjust the video to match the aspect ratio
            border: "2px solid #ccc",
            margin: "10px 0",
          }}
        ></video>
      </div>
      <div style={{ padding: "20px" }}>
        <h1>Scan ABG</h1>
        {/* Switch Camera Button */}
        <button
          onClick={toggleCamera}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#007BFF",
            color: "#fff",
            border: "none",
            marginBottom: "10px",
          }}
        >
          Switch to {cameraMode === "environment" ? "Front" : "Rear"} Camera
        </button>
        <br />

        {/* Capture Button */}
        <button
          onClick={handleCapture}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          Capture Photo
        </button>

        {/* File Upload Button */}
        <form style={{ display: "inline-block" }}>
          <input
            type="file"
            id="imageInput"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => document.getElementById("imageInput").click()}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Upload Image
          </button>
        </form>
        <br />
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: "100%",
            border: "2px solid #ccc",
            margin: "10px 0",
          }}
        ></canvas>
        <br />

        {/* OCR Button */}
        <button
          onClick={handleOCR}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: isProcessing ? "#ccc" : "#4CAF50",
            color: "#fff",
            border: "none",
          }}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Extract Text (OCR)"}
        </button>

        {/* OCR Result */}
        {ocrResult && (
          <div style={{ marginTop: "20px" }}>
            <h3>OCR Result:</h3>
            <textarea
              readOnly
              value={ocrResult}
              style={{
                width: "90%",
                height: "150px",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default App;
