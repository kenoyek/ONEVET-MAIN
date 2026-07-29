import { useCallback } from 'react';

export interface PaystackResponse {
  reference: string;
  status?: string;
  trans?: string;
  transaction?: string;
  message?: string;
  [key: string]: unknown;
}

export interface PaystackPopHandler {
  setup: (options: {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    ref?: string;
    metadata?: Record<string, unknown>;
    callback: (response: PaystackResponse) => void;
    onClose: () => void;
  }) => { openIframe: () => void };
}

declare global {
  interface Window {
    PaystackPop: PaystackPopHandler;
  }
}

interface PaystackProps {
  email: string;
  amount: number;
  metadata?: Record<string, unknown>;
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
      callback: function(response: PaystackResponse) {
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
