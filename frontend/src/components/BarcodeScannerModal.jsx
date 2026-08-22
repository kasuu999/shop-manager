import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, AlertTriangle, Upload, RefreshCw, Keyboard, Check } from "lucide-react";

const SCANNER_ELEMENT_ID = "barcode-scanner-viewport";
const FILE_SCANNER_ELEMENT_ID = "file-scanner-temp-viewport";

const RETAIL_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.QR_CODE,
];

// Play a short pleasant beep tone using Web Audio API on scan success
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    if (navigator.vibrate) navigator.vibrate(100);
  } catch (_) {}
};

export default function BarcodeScannerModal({ isOpen, onClose, onScan }) {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "manual"
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [starting, setStarting] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  useEffect(() => {
    if (!isOpen || activeTab !== "camera") return;

    let cancelled = false;
    setError("");
    setFileError("");
    setStarting(true);

    // Initialize Html5Qrcode with formatsToSupport
    // Note: avoid useBarCodeDetectorIfSupported: true because iOS Safari
    // native BarcodeDetector implementation has known bugs with 1D barcodes.
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      formatsToSupport: RETAIL_BARCODE_FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;

    // Responsive scanner box calculation optimized for 1D retail barcodes
    const calculateQrbox = (viewfinderWidth, viewfinderHeight) => {
      const width = Math.max(240, Math.min(Math.floor(viewfinderWidth * 0.9), 420));
      const height = Math.max(120, Math.min(Math.floor(viewfinderHeight * 0.5), 200));
      return { width, height };
    };

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: calculateQrbox,
        },
        (decodedText) => {
          if (!cancelled && decodedText) {
            playBeep();
            onScan(decodedText.trim());
          }
        },
        () => {}
      )
      .then(() => {
        if (!cancelled) setStarting(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setStarting(false);
        setError(
          err?.message?.includes("Permission") || err?.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access in browser settings to scan barcodes."
            : "Could not start camera. Verify camera permissions or upload an image / type barcode manually."
        );
      });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => {
              try {
                scannerRef.current?.clear();
              } catch (_) {}
            })
            .catch(() => {});
        } else {
          try {
            scannerRef.current.clear();
          } catch (_) {}
        }
      }
    };
  }, [isOpen, activeTab]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");
    setIsProcessingFile(true);

    // Use a clean temporary Html5Qrcode instance to decode the image file
    const tempScanner = new Html5Qrcode(FILE_SCANNER_ELEMENT_ID, {
      formatsToSupport: RETAIL_BARCODE_FORMATS,
      verbose: false,
    });

    try {
      const decodedText = await tempScanner.scanFile(file, true);
      if (decodedText) {
        playBeep();
        onScan(decodedText.trim());
      }
    } catch (err) {
      setFileError(
        "Could not detect a clear barcode in the uploaded image. Please ensure the image is clear and well-lit."
      );
    } finally {
      try {
        tempScanner.clear();
      } catch (_) {}
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBeep();
    onScan(manualCode.trim());
    setManualCode("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      {/* Hidden container for file scan processing */}
      <div id={FILE_SCANNER_ELEMENT_ID} className="hidden" />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <Camera size={18} /> Barcode Scanner
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
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
                  <p className="mb-2 text-center text-xs text-slate-400">Starting camera stream...</p>
                )}
                <div
                  id={SCANNER_ELEMENT_ID}
                  className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900 min-h-[260px] flex items-center justify-center"
                />
              </>
            )}

            {fileError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <p className="text-center text-xs text-slate-500">
                Align barcode inside the camera box or upload an image below.
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
                Enter Barcode Number
              </label>
              <input
                type="text"
                autoFocus
                required
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. 8909106047112"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              <Check size={16} /> Submit Barcode
            </button>
          </form>
        )}
      </div>
    </div>
  );
}