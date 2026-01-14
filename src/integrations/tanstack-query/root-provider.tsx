import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "react-toastify";

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        onError: (error) => {
          toast.error(`${error.message}`);
        },
      },
    },
  });
  return {
    queryClient,
  };
}

export function Provider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
