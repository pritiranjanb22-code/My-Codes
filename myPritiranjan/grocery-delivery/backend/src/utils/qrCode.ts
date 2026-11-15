import QRCode from 'qrcode';
import { config } from '../config/index.js';

export async function generateUpiQrCode(upiId: string, amount: number, note: string = ''): Promise<string> {
  const upiUrl = `upi://pay?pa=${upiId}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note || 'Grocery Order Payment')}`;
  
  return QRCode.toDataURL(upiUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

export async function generateOrderQrCode(orderNumber: string): Promise<string> {
  const baseUrl = process.env.BASE_URL || `http://localhost:${config.port}`;
  const orderUrl = `${baseUrl}/order/${orderNumber}`;
  
  return QRCode.toDataURL(orderUrl, {
    width: 200,
    margin: 2,
  });
}

export function formatUpiUrl(upiId: string, amount: number, note: string = ''): string {
  return `upi://pay?pa=${upiId}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
}