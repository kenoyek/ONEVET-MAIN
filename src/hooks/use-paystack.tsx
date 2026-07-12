import { useCallback } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaystackProps {
  email: string;
  amount: number;
  metadata?: any;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export const usePaystack = () => {
  const initializePayment = useCallback(({ email, amount, metadata, onSuccess, onClose }: PaystackProps) => {
    // In production, this would be an environment variable
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder';

    if (publicKey === 'pk_test_placeholder') {
      console.warn('Paystack Public Key is not set. Using placeholder.');
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: email,
      amount: amount * 100, // Paystack expects amount in kobo
      currency: 'NGN',
      ref: `OV-${Math.floor(Math.random() * 1000000000 + 1)}`,
      metadata: metadata,
      callback: function(response: any) {
        onSuccess(response.reference);
      },
      onClose: function() {
        onClose();
      }
    });

    handler.openIframe();
  }, []);

  return { initializePayment };
};
