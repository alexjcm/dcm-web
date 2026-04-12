import { Toaster } from "sonner";

export const AppToaster = () => {
  return (
    <Toaster
      richColors
      position="top-right"
      closeButton
      toastOptions={{
        style: {
          fontSize: "0.9rem"
        }
      }}
    />
  );
};
