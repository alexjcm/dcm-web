import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

let offlineReadyShown = false;

registerSW({
  onOfflineReady() {
    if (offlineReadyShown) {
      return;
    }

    offlineReadyShown = true;
    toast.success("Modo sin conexión disponible.", {
      description: "La interfaz puede abrirse sin conexión, pero Auth0 y la API siguen requiriendo red."
    });
  },
  onRegisterError(error) {
    console.error("PWA registration failed.", error);
  }
});
