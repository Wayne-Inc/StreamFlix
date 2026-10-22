// The Electron desktop shell injects `window.electronAPI` through its preload
// script. The web build never has it, so every call site must guard on it.
export {};

declare global {
  interface ElectronUpdaterStatus {
    state: "dev" | "checking" | "available" | "downloaded" | "uptodate" | "error";
    message: string;
  }

  interface ElectronAPI {
    getVersion(): Promise<string>;
    checkForUpdates(): Promise<ElectronUpdaterStatus>;
    onUpdaterStatus(callback: (status: ElectronUpdaterStatus) => void): () => void;
    installUpdate(): void;
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}
