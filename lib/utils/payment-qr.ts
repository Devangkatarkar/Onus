export function getPaymentQrDisplay(
  paymentQrUrl: string | null | undefined,
  paymentLink: string | null | undefined
): string | null {
  if (paymentQrUrl) return paymentQrUrl;
  if (paymentLink) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentLink)}`;
  }
  return null;
}

export function hasPaymentMethod(
  paymentQrUrl: string | null | undefined,
  paymentLink: string | null | undefined
): boolean {
  return Boolean(paymentQrUrl?.trim() || paymentLink?.trim());
}
