<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Html5Qrcode } from 'html5-qrcode';

  // Props
  let { 
    onScanSuccess = (decodedText: string) => {}, 
    onClose = () => {} 
  } = $props();

  let html5Qrcode: Html5Qrcode | null = null;
  const elementId = 'camera-scanner-view';
  let isScanning = $state(false);
  let errorMsg = $state<string | null>(null);
  let isInitializing = $state(true);
  let manualBarcode = $state('');

  onMount(async () => {
    // Check for secure context or missing mediaDevices API
    if (typeof window !== 'undefined' && (!window.isSecureContext || !navigator.mediaDevices)) {
      errorMsg = 'Camera access is blocked by your browser. Because this site is running on an insecure connection (HTTP over IP address), camera access is only allowed over HTTPS or localhost. You can still type the barcode manually below.';
      isScanning = false;
      isInitializing = false;
      return;
    }

    try {
      // 1. Initialize the scanner instance
      html5Qrcode = new Html5Qrcode(elementId);
      isInitializing = false;
      isScanning = true;

      // 2. Start scanning with environment camera (rear camera)
      await html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (width, height) => {
            // Adapt the scanning box size based on container width
            const boxWidth = Math.min(width * 0.7, 280);
            const boxHeight = Math.min(height * 0.4, 160); // Barcodes are usually horizontal rectangles
            return { width: boxWidth, height: boxHeight };
          },
          aspectRatio: 1.0 // Square aspect ratio container
        },
        (decodedText) => {
          // Success callback
          stopScanner().then(() => {
            onScanSuccess(decodedText);
          });
        },
        (errorMessage) => {
          // Failure callback (quietly fired on every frame with no detection)
          // We don't want to alert the user for every empty frame
        }
      );
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      errorMsg = 'Could not access the rear camera. Please check camera permissions.';
      isScanning = false;
      isInitializing = false;
    }
  });

  const stopScanner = async () => {
    if (html5Qrcode && html5Qrcode.isScanning) {
      try {
        await html5Qrcode.stop();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    isScanning = false;
  };

  onDestroy(() => {
    stopScanner();
  });

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleManualSubmit = async () => {
    const code = manualBarcode.trim();
    if (code) {
      await stopScanner();
      onScanSuccess(code);
    }
  };
</script>

<div class="scanner-overlay">
  <div class="scanner-header">
    <h3>Scan Barcode</h3>
    <p>Point the camera at the EAN barcode on the packaging</p>
  </div>

  <div class="scanner-container-wrapper">
    <div id={elementId} class="scanner-view"></div>
    
    {#if isScanning}
      <!-- Custom overlay simulating a scanning window and laser line -->
      <div class="scanner-window-overlay">
        <div class="scan-frame">
          <div class="laser-line"></div>
          <!-- Corner decorations -->
          <div class="corner top-left"></div>
          <div class="corner top-right"></div>
          <div class="corner bottom-left"></div>
          <div class="corner bottom-right"></div>
        </div>
      </div>
    {/if}

    {#if isInitializing}
      <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Accessing camera...</p>
      </div>
    {/if}

    {#if errorMsg}
      <div class="error-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="error-icon">
          <circle cx="12" cy="12" r="10" stroke-width="2"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/>
          <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/>
        </svg>
        <p class="error-text">{errorMsg}</p>
        
        <div class="manual-fallback-container">
          <p class="fallback-label">Or enter the barcode number manually:</p>
          <div class="manual-input-wrapper">
            <input 
              type="text" 
              placeholder="e.g. 8002270014901" 
              bind:value={manualBarcode} 
              class="manual-barcode-input"
            />
            <button class="manual-submit-btn" onclick={handleManualSubmit} disabled={!manualBarcode.trim()}>
              Search
            </button>
          </div>
        </div>

        <button class="retry-btn" onclick={handleClose}>Back to Form</button>
      </div>
    {/if}
  </div>

  <div class="scanner-footer">
    <button class="cancel-btn" onclick={handleClose}>
      Cancel Scan
    </button>
  </div>
</div>

<style>
  .scanner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #090d16;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 2rem 1rem;
  }

  .scanner-header {
    text-align: center;
    color: white;
    width: 100%;
    margin-bottom: 1rem;
  }

  .scanner-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .scanner-header p {
    font-size: 0.9rem;
    color: var(--text-secondary);
    max-width: 320px;
    margin: 0 auto;
  }

  .scanner-container-wrapper {
    position: relative;
    width: 100%;
    max-width: 360px;
    aspect-ratio: 1;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    background: #000;
  }

  .scanner-view {
    width: 100% !important;
    height: 100% !important;
  }

  /* HTML5-qrcode overrides to make video element stretch nicely */
  :global(#camera-scanner-view video) {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }

  .scanner-window-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 5;
  }

  .scan-frame {
    position: relative;
    width: 70%;
    height: 40%;
    border: 2px dashed rgba(255, 255, 255, 0.4);
    border-radius: var(--radius-sm);
    box-shadow: 0 0 0 1000px rgba(9, 13, 22, 0.65); /* High dark mask around scanner */
  }

  /* Laser line animation */
  .laser-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, rgba(239, 68, 68, 0) 0%, rgba(239, 68, 68, 1) 50%, rgba(239, 68, 68, 0) 100%);
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
    animation: scanner-laser 2.5s infinite linear;
  }

  @keyframes scanner-laser {
    0% { top: 5%; }
    50% { top: 95%; }
    100% { top: 5%; }
  }

  /* Corner indicators */
  .corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 4px solid var(--accent-primary);
    pointer-events: none;
  }

  .top-left {
    top: -4px;
    left: -4px;
    border-right: none;
    border-bottom: none;
    border-top-left-radius: 6px;
  }

  .top-right {
    top: -4px;
    right: -4px;
    border-left: none;
    border-bottom: none;
    border-top-right-radius: 6px;
  }

  .bottom-left {
    bottom: -4px;
    left: -4px;
    border-right: none;
    border-top: none;
    border-bottom-left-radius: 6px;
  }

  .bottom-right {
    bottom: -4px;
    right: -4px;
    border-left: none;
    border-top: none;
    border-bottom-right-radius: 6px;
  }

  /* Loading State */
  .loading-overlay, .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #090d16;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    z-index: 10;
  }

  .loading-overlay p, .error-overlay p {
    margin-top: 1rem;
    font-size: 0.95rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s infinite linear;
  }

  @keyframes spin {
    100% { transform: rotate(360deg); }
  }

  /* Error state */
  .error-icon {
    width: 48px;
    height: 48px;
    color: var(--accent-danger);
  }

  .error-text {
    max-width: 300px;
    line-height: 1.4;
    font-size: 0.85rem !important;
    margin-bottom: 0.5rem;
  }

  .manual-fallback-container {
    width: 100%;
    max-width: 300px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-md);
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .fallback-label {
    font-size: 0.8rem !important;
    color: var(--text-secondary);
    text-align: left;
    margin: 0 !important;
  }

  .manual-input-wrapper {
    display: flex;
    gap: 0.5rem;
  }

  .manual-barcode-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-sm);
    color: white;
    font-size: 0.85rem;
  }

  .manual-barcode-input:focus {
    border-color: var(--accent-primary);
    outline: none;
  }

  .manual-submit-btn {
    padding: 0.5rem 1rem;
    background: var(--accent-primary);
    color: white;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 0.85rem;
  }

  .manual-submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .retry-btn {
    margin-top: 1.5rem;
    padding: 0.6rem 1.5rem;
    background: var(--accent-primary);
    color: white;
    border-radius: var(--radius-full);
    font-weight: 500;
  }

  /* Footer and controls */
  .scanner-footer {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }

  .cancel-btn {
    padding: 0.8rem 2rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: 500;
    border-radius: var(--radius-full);
    font-size: 1rem;
  }

  .cancel-btn:active {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
