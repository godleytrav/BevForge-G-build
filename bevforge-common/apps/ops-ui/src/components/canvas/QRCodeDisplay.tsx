import { useState } from 'react';
import { QrCode, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  generateContainerQR,
  generatePalletQR,
  downloadQRCode,
} from '@/lib/qr-code';

interface QRCodeDisplayProps {
  type: 'container' | 'pallet';
  id: string;
  label?: string;
}

export function QRCodeDisplay({ type, id, label }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = () => {
    const code =
      type === 'container' ? generateContainerQR(id) : generatePalletQR(id);
    setQrCode(code);
    setIsOpen(true);
  };

  const handleDownload = () => {
    if (qrCode) {
      downloadQRCode(qrCode, `${type}-${id}-qr.svg`);
    }
  };

  const handlePrint = () => {
    if (qrCode) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR Code - ${id}</title>
              <style>
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                .qr-container {
                  text-align: center;
                  padding: 2rem;
                }
                img {
                  max-width: 300px;
                  height: auto;
                }
                .label {
                  margin-top: 1rem;
                  font-size: 1.2rem;
                  font-weight: bold;
                }
                .id {
                  margin-top: 0.5rem;
                  font-size: 1rem;
                  color: #666;
                }
                @media print {
                  body {
                    background: white;
                  }
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <img src="${qrCode}" alt="QR Code" />
                ${label ? `<div class="label">${label}</div>` : ''}
                <div class="id">${id}</div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          <QrCode className="mr-2 h-4 w-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            Scan this code to track {type} {id}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {qrCode && (
            <>
              <div className="rounded-lg border bg-white p-4">
                <img
                  src={qrCode}
                  alt={`QR Code for ${type} ${id}`}
                  className="h-64 w-64"
                />
              </div>
              {label && (
                <div className="text-center">
                  <p className="font-semibold">{label}</p>
                  <p className="text-sm text-muted-foreground">{id}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
