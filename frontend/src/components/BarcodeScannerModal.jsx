import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import Quagga from "@ericblade/quagga2";
import { X, Camera, AlertTriangle, Upload, RefreshCw, Keyboard, Check, Zap, ZapOff, CheckCircle2 } from "lucide-react";

const SCANNER_VIEWPORT_ID = "barcode-scanner-viewport-video";

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(950, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    if (navigator.vibrate) navigator.vibrate(120);
  } catch (_) {}
};

// Checksum validation for EAN-13 / EAN-8 / UPC barcodes
const isValidBarcodeChecksum = (code) => {
  if (!code || !/^\d+$/.test(code)) return true;
  if (code.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(code[12], 10);
  }
  if (code.length === 8) {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += parseInt(code[i], 10) * (i % 2 === 0 ? 3 : 1);
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(code[7], 10);
  }
  return true;
};

// Try native browser BarcodeDetector API if available
const detectWithNativeAPI = async (imageOrCanvas) => {
  if ("BarcodeDetector" in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats().catch(() => []);
      const detector = new window.BarcodeDetector({
        formats: formats.length > 0 ? formats : ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
      });
      const barcodes = await detector.detect(imageOrCanvas);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue.trim();
      }
    } catch (_) {}
  }
  return null;
};

export default function BarcodeScannerModal({ isOpen, onClose, onScan, autoCloseOnScan = true }) {
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "manual"
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [starting, setStarting] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [flashOn, setFlashOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const fileInputRef = useRef(null);
  const isHandlingScanRef = useRef(false);
  const codeReaderRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isOpen || activeTab !== "camera") return;

    let cancelled = false;
    setError("");
    setFileError("");
    setStarting(true);
    isHandlingScanRef.current = false;

    // Configure ZXing hints for retail 1D barcodes & QR
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Helper to process decoded barcode string
    const handleSuccessfulDecode = (rawText) => {
      if (cancelled || isHandlingScanRef.current || !rawText) return;

      const trimmed = rawText.trim();
      if (trimmed.length < 3 || !isValidBarcodeChecksum(trimmed)) return;

      isHandlingScanRef.current = true;
      playBeep();
      setLastScannedCode(trimmed);

      onScan(trimmed);

      if (autoCloseOnScan) {
        try {
          codeReader.reset();
        } catch (_) {}
      } else {
        setTimeout(() => {
          isHandlingScanRef.current = false;
        }, 1500);
      }
    };

    // Start video stream with facingMode: environment
    codeReader
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoEl,
        (result, err) => {
          if (cancelled) return;
          if (result && result.getText()) {
            handleSuccessfulDecode(result.getText());
          }
        }
      )
      .then(() => {
        if (cancelled) return;
        setStarting(false);

        // Ensure iOS Safari playback works without pausing
        if (videoEl) {
          videoEl.setAttribute("playsinline", "true");
          videoEl.setAttribute("muted", "true");
          videoEl.play().catch(() => {});

          // Check torch capability
          try {
            const stream = videoEl.srcObject;
            const track = stream?.getVideoTracks?.()?.[0];
            if (track && track.getCapabilities && track.getCapabilities().torch) {
              setHasTorch(true);
            }
          } catch (_) {}
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStarting(false);
        setError(
          "Could not access camera. Please check camera permissions in your mobile browser, or upload an image / type barcode digits in 'Type Barcode' tab."
        );
      });

    // Parallel Native BarcodeDetector loop for lightning-fast hardware detection
    const nativeTimer = setInterval(async () => {
      if (cancelled || isHandlingScanRef.current || !videoEl || videoEl.readyState < 2) return;
      const detected = await detectWithNativeAPI(videoEl);
      if (detected) {
        handleSuccessfulDecode(detected);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(nativeTimer);
      try {
        codeReader.reset();
      } catch (_) {}
    };
  }, [isOpen, activeTab, autoCloseOnScan]);

  const toggleTorch = async () => {
    const videoEl = videoRef.current;
    if (!videoEl || !hasTorch) return;
    try {
      const stream = videoEl.srcObject;
      const track = stream?.getVideoTracks?.()?.[0];
      if (track) {
        const nextState = !flashOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setFlashOn(nextState);
      }
    } catch (_) {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");
    setIsProcessingFile(true);

    try {
      const imgUrl = URL.createObjectURL(file);
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });

      // Attempt 1: Native BarcodeDetector API
      let detectedCode = await detectWithNativeAPI(img);

      // Attempt 2: ZXing decodeFromImageUrl
      if (!detectedCode && codeReaderRef.current) {
        try {
          const zxResult = await codeReaderRef.current.decodeFromImageUrl(imgUrl);
          if (zxResult && zxResult.getText()) {
            detectedCode = zxResult.getText().trim();
          }
        } catch (_) {}
      }

      // Attempt 3: Quagga decodeSingle
      if (!detectedCode) {
        const result = await new Promise((resolve) => {
          Quagga.decodeSingle(
            {
              src: imgUrl,
              numOfWorkers: 0,
              inputStream: { size: 800 },
              decoder: {
                readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader"],
              },
              locate: true,
            },
            (res) => resolve(res)
          );
        });

        if (result?.codeResult?.code) {
          detectedCode = result.codeResult.code.trim();
        }
      }

      URL.revokeObjectURL(imgUrl);

      if (detectedCode && isValidBarcodeChecksum(detectedCode)) {
        playBeep();
        setLastScannedCode(detectedCode);
        onScan(detectedCode);
      } else {
        setFileError(
          "Could not detect barcode from image. Try taking a photo closer under store light or type barcode numbers directly using 'Type Barcode' tab."
        );
      }
    } catch (err) {
      setFileError("Error reading image file. Please try camera scan or type barcode numbers.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const trimmed = manualCode.trim();
    playBeep();
    setLastScannedCode(trimmed);
    onScan(trimmed);
    setManualCode("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <Camera size={18} /> Retail Barcode Scanner
          </h3>
          <div className="flex items-center gap-1">
            {activeTab === "camera" && hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`rounded-lg p-1.5 transition-colors ${
                  flashOn ? "bg-amber-100 text-amber-600" : "text-slate-400 hover:bg-slate-100"
                }`}
                title="Toggle Torch Light"
              >
                {flashOn ? <Zap size={18} /> : <ZapOff size={18} />}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("camera");
              setError("");
              setFileError("");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "camera"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Camera size={14} /> Camera Scanner
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("manual");
              setError("");
              setFileError("");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "manual"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Keyboard size={14} /> Type Barcode
          </button>
        </div>

        {activeTab === "camera" ? (
          <>
            {error ? (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <span>{error}</span>
              </div>
            ) : (
              <>
                {starting && (
                  <p className="mb-2 text-center text-xs text-slate-400">Starting retail camera stream...</p>
                )}
                {/* Camera Video Viewport */}
                <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900 min-h-[260px] max-h-[340px] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    id={SCANNER_VIEWPORT_ID}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {/* Laser Scan Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                    <div className="w-full h-32 border-2 border-emerald-400/80 rounded-lg relative flex items-center justify-center">
                      <div className="w-full h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {lastScannedCode && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" /> Scanned: {lastScannedCode}
                </span>
              </div>
            )}

            {fileError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <p className="text-center text-xs text-slate-500">
                Hold product packet flat inside box. Point barcode lines at camera.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="mt-1 flex items-center justify-center gap-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {isProcessingFile ? (
                  <RefreshCw size={14} className="animate-spin text-brand-600" />
                ) : (
                  <Upload size={14} />
                )}
                {isProcessingFile ? "Scanning Image..." : "Upload Barcode Image"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Enter Barcode Digits
              </label>
              <input
                type="text"
                autoFocus
                required
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. 8909106047112"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none font-mono"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Enter the numbers printed right below the barcode lines on the product packet.
              </p>
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              <Check size={16} /> Submit & Add Item
            </button>
          </form>
        )}
      </div>
    </div>
  );
}