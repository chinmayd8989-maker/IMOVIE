import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  try {
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      width: 250,
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return null;
  }
};
