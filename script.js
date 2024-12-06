document.addEventListener("DOMContentLoaded", () => {
  const videoElement = document.getElementById("video");
  const resultElement = document.getElementById("result");
  const statusElement = document.getElementById("status");
  const startButton = document.getElementById("start-button");
  const stopButton = document.getElementById("stop-button");
  const cameraSelect = document.getElementById("camera-select");

  const codeReader = new ZXing.BrowserQRCodeReader();
  let activeDeviceId = null;

  async function listCameras() {
    const devices = await codeReader.listVideoInputDevices();
    cameraSelect.innerHTML = "";

    devices.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Camera ${index + 1}`;
      cameraSelect.appendChild(option);
    });

    if (devices.length > 0) {
      activeDeviceId = devices[0].deviceId;
    } else {
      alert("No cameras found.");
    }
  }

  async function startScanning() {
    try {
      statusElement.textContent = "Status: Scanning...";
      startButton.disabled = true;
      stopButton.disabled = false;
      cameraSelect.disabled = true;

      await codeReader.decodeFromVideoDevice(activeDeviceId, videoElement, (result, err) => {
        if (result) {
          resultElement.textContent = result.text;
          statusElement.textContent = "Status: QR Code Detected!";
          console.log("QR Code Result:", result.text);

          // Stop scanning after detection
          stopScanning();
        }

        if (err && !(err instanceof ZXing.NotFoundException)) {
          console.error("QR Code Error:", err);
        }
      });
    } catch (err) {
      console.error("Error starting scan:", err);
      alert("Unable to access the camera. Please check your permissions.");
      resetUI();
    }
  }

  function stopScanning() {
    codeReader.reset();
    resetUI();
    statusElement.textContent = "Status: Idle";
  }

  function resetUI() {
    startButton.disabled = false;
    stopButton.disabled = true;
    cameraSelect.disabled = false;
  }

  // Event Listeners
  startButton.addEventListener("click", startScanning);
  stopButton.addEventListener("click", stopScanning);
  cameraSelect.addEventListener("change", (event) => {
    activeDeviceId = event.target.value;
  });

  // Initialize camera list
  listCameras();
});
