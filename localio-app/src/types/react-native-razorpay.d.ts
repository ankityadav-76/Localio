declare module "react-native-razorpay" {
  type CheckoutOptions = {
    key: string;
    amount: string;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
      contact?: string;
      name?: string;
    };
    theme?: { color: string };
  };

  type CheckoutResult = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  const RazorpayCheckout: {
    open(options: CheckoutOptions): Promise<CheckoutResult>;
  };

  export default RazorpayCheckout;
}
