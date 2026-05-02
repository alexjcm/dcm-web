import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

let offlineReadyShown = false;

registerSW({
  onOfflineReady() {
    if (offlineReadyShown) {
      return;
    }

    offlineReadyShown = true;
    toast.success("Modo offline listo.", {
      description: "La interfaz puede abrirse sin conexion, pero Auth0 y la API siguen requiriendo red."
    });
  },
  onRegisterError(error) {
    console.error("PWA registration failed.", error);
  }
});
