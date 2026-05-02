import { Toaster } from "sonner";
import { useTheme } from "../../hooks/use-theme";

export const AppToaster = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      richColors
      theme={theme}
      position="top-right"
      closeButton
      toastOptions={{
        duration: 6500,
        style: {
          fontSize: "0.9rem"
        }
      }}
    />
  );
};
