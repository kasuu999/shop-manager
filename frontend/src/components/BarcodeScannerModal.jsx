import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, AlertTriangle, Upload, RefreshCw } from "lucide-react";

const SCANNER_ELEMENT_ID = "barcode-scanner-viewport";

// Support both common retail 1D barcodes and 2D QR codes
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

/**
 * Camera-based & File upload barcode scanner using html5-qrcode.
 * Uses native BarcodeDetector when available for instant scanning.
 */
export default function BarcodeScannerModal({ isOpen, onClose, onScan }) {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [starting, setStarting] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setError("");
    setFileError("");
    setStarting(true);

    // Initialize Html5Qrcode with formatsToSupport and native BarcodeDetector in constructor
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      formatsToSupport: RETAIL_BARCODE_FORMATS,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
      verbose: false,
    });
    scannerRef.current = scanner;

    // Responsive scanning box calculation based on container size
    const calculateQrbox = (viewfinderWidth, viewfinderHeight) => {
      const width = Math.max(220, Math.min(Math.floor(viewfinderWidth * 0.85), 340));
      const height = Math.max(100, Math.min(Math.floor(viewfinderHeight * 0.45), 180));
      return { width, height };
    };

    scanner
      .start(
        { facingMode: "environment" }, // Rear camera on mobile
        {
          fps: 15, // Higher frame rate for faster barcode capture
          qrbox: calculateQrbox,
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        (decodedText) => {
          if (!cancelled) {
            onScan(decodedText.trim());
          }
        },
        () => {
          // Expected per-frame no-code callback
        }
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
            : "Could not start camera. Please verify camera permissions or upload a barcode image below."
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
  }, [isOpen]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    setFileError("");
    setIsProcessingFile(true);

    try {
      const decodedText = await scannerRef.current.scanFile(file, true);
      if (decodedText) {
        onScan(decodedText.trim());
      }
    } catch (err) {
      setFileError("Could not detect a clear barcode in the selected image. Try taking a closer photo.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <Camera size={18} /> Scan Barcode
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

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
            {/* Viewport for live camera stream */}
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
            Hold barcode flat and well-lit inside the box, or upload an image.
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
      </div>
    </div>
  );
}