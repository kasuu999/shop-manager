import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, AlertTriangle } from "lucide-react";

const SCANNER_ELEMENT_ID = "barcode-scanner-viewport";

// Retail products almost always use these barcode formats — restricting to
// just these (instead of also trying QR codes, Aztec, PDF417, etc.) makes
// the decoder faster AND more accurate, since it isn't wasting cycles
// checking formats that will never match a product barcode.
const RETAIL_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
];

/**
 * Camera-based barcode scanner, built on html5-qrcode (uses the browser's
 * getUserMedia API under the hood — works on mobile Chrome/Safari camera).
 *
 * Usage: <BarcodeScannerModal isOpen={...} onClose={...} onScan={(code) => ...} />
 * `onScan` fires once per successful decode. The parent is responsible for
 * closing the modal (we don't auto-close here) so the parent can decide —
 * e.g. keep it open for rapid multi-item scanning at a POS counter.
 */
export default function BarcodeScannerModal({ isOpen, onClose, onScan }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setError("");
    setStarting(true);

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" }, // rear camera on mobile — this argument only accepts camera-selection fields like facingMode/deviceId
        {
          fps: 10,
          // A wider, shorter box matches the shape of most 1D retail
          // barcodes better than a square one, and helps the person aim
          // correctly.
          qrbox: { width: 280, height: 120 },
          formatsToSupport: RETAIL_BARCODE_FORMATS,
          // Requesting a higher resolution than the browser's default makes
          // a BIG difference for reading 1D barcodes (thin bars need enough
          // pixels to distinguish clearly). This belongs here, inside the
          // scan config's videoConstraints — NOT in the camera-selector
          // argument above, which only understands facingMode/deviceId.
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        (decodedText) => {
          // Fires on every successful decode — parent decides what happens next.
          onScan(decodedText.trim());
        },
        () => {
          // Per-frame "no code found" callback — expected constantly while
          // scanning, not an error worth surfacing to the user.
        }
      )
      .then(() => {
        if (!cancelled) setStarting(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setStarting(false);
        // Most common real-world cause: camera permission denied, or no
        // camera available (e.g. testing on desktop without a webcam).
        setError(
          err?.message?.includes("Permission")
            ? "Camera permission denied. Please allow camera access to scan barcodes."
            : "Could not start camera. Make sure your device has a camera and try again."
        );
      });

    return () => {
      cancelled = true;
      // Stop the camera stream whenever the modal closes or unmounts —
      // otherwise the camera light stays on in the background.
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [isOpen]);

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
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {starting && (
              <p className="mb-2 text-center text-xs text-slate-400">Starting camera...</p>
            )}
            {/* html5-qrcode injects the live camera preview into this div */}
            <div
              id={SCANNER_ELEMENT_ID}
              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900"
            />
            <p className="mt-3 text-center text-xs text-slate-500">
              Hold the barcode flat, well-lit, and about 10–15cm from the camera.
              It will be added automatically once recognized.
            </p>
          </>
        )}
      </div>
    </div>
  );
}