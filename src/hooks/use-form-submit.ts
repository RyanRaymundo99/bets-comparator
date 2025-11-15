import { useState, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseFormSubmitOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
  redirect?: string;
}

interface UseFormSubmitReturn {
  loading: boolean;
  error: string | null;
  submit: (e: FormEvent<HTMLFormElement>, submitFn: () => Promise<Response>) => Promise<void>;
  reset: () => void;
}

/**
 * Reusable hook for form submissions with loading, error, and toast handling
 */
export function useFormSubmit<T = unknown>(
  options: UseFormSubmitOptions<T> = {}
): UseFormSubmitReturn {
  const { onSuccess, onError, successMessage, errorMessage, redirect } = options;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    e: FormEvent<HTMLFormElement>,
    submitFn: () => Promise<Response>
  ) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await submitFn();
      const result = await response.json();

      if (response.ok && result.success) {
        const data = result.data || result;
        onSuccess?.(data);

        if (successMessage) {
          toast({
            title: "Success",
            description: successMessage,
          });
        }

        if (redirect) {
          // Wait a bit for any cookies to be set
          await new Promise((resolve) => setTimeout(resolve, 500));
          window.location.href = redirect;
        }
      } else {
        const errorMsg = result.error || errorMessage || "An error occurred";
        setError(errorMsg);
        onError?.(errorMsg);

        toast({
          variant: "destructive",
          title: "Error",
          description: errorMsg,
        });
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : errorMessage || "An error occurred";
      setError(errorMsg);
      onError?.(errorMsg);

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setLoading(false);
  };

  return { loading, error, submit, reset };
}

