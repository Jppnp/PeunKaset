import { ipcMain } from 'electron';
import { formatCurrency } from '../../utils/formatters.js';


// Generate receipt HTML (for both print and preview)
function generateReceiptHTML({ saleData, cartItems, preview = false }) {
  // Shared CSS for both print and preview
  const sharedCSS = `
    @page {
      size: 80mm auto;
      margin: 0;
    }
    html, body {
      width: 80mm;
      max-width: 80mm;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    body {
      font-family: monospace;
      font-size: 12px;
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    .receipt {
      width: 76mm;
      max-width: 76mm;
      margin: 0 auto;
      background-color: white;
      padding: 6mm 2mm 2mm 2mm;
      border: none;
      box-shadow: none;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 1px solid #333;
      padding-bottom: 6px;
    }
    .header h2 {
      margin: 0 0 3px 0;
      color: #000;
      font-size: 18px;
    }
    .item {
      margin: 4px 0;
      padding: 2px 0;
      border-bottom: 1px dotted #eee;
      display: flex;
      flex-direction: column;
    }
    .item-name {
      font-weight: bold;
      margin-bottom: 1px;
      font-size: 12px;
      word-break: break-all;
    }
    .item-desc {
      font-size: 10px;
      color: #555;
      margin-bottom: 1px;
    }
    .item-details {
      color: #000;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      margin-right: 5px;
    }
    .total {
      border-top: 1px solid #333;
      margin-top: 10px;
      padding-top: 6px;
      font-weight: bold;
      font-size: 13px;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 12px;
      font-size: 10px;
      color: #000;
      border-top: 1px solid #eee;
      padding-top: 6px;
    }
    .print-button {
      display: block;
      margin: 8px auto 8px auto;
      background: #4CAF50;
      color: white;
      border: none;
      padding: 6px 18px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .print-button:hover {
      background: #45a049;
    }
    @media print {
      .print-button {
        display: none !important;
      }
      body, html {
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 80mm !important;
        max-width: 80mm !important;
      }
      .receipt {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        width: 76mm !important;
        max-width: 76mm !important;
        padding: 0 2mm !important;
      }
    }
  `;

  // Receipt items HTML
  const itemsHTML = cartItems.map(item => `
    <div class="item">
      <div class="item-name">${item.name}</div>
      ${item.description ? `<div class="item-desc" style="font-size:10px;color:#000;margin-bottom:1px;">${item.description}</div>` : ''}
      <div class="item-details">
        <span>${item.qty} x ${formatCurrency(item.price)}</span>
        <span>= ${formatCurrency(item.qty * item.price)} บาท</span>
      </div>
    </div>
  `).join('');

  // Main receipt HTML
  return `
    <html>
      <head>
        <meta name="viewport" content="width=80mm, initial-scale=1">
        <style>${sharedCSS}</style>
      </head>
      <body>
        ${preview ? '<button class="print-button" onclick="window.print()">Print</button>' : ''}
        <div class="receipt">
          <div class="header">
            <h2>ก.เพื่อนเกษตร</h2>
            <h2>085-733-1118</h2>
            <div>ใบเสร็จรับเงิน</div>
            <div style="margin-top: 3px; font-weight: bold;">รายการที่ #${saleData.saleId}</div>
            <div style="font-size: 11px; color: #000;">${new Date(saleData.saleDate).toLocaleString('th-TH')}</div>
          </div>
          <div>${itemsHTML}</div>
          <div class="total">
            ยอดรวม: ${formatCurrency(saleData.totalAmount)} บาท
          </div>
          ${saleData.remark ? `<div style="margin: 8px 0; color: #000;">หมายเหตุ: ${saleData.remark}</div>` : ''}
          <div class="footer">
            ขอบคุณที่ใช้บริการ<br>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function setupPrintHandlers() {
  // Print receipt (silent)
  ipcMain.handle('printReceipt', async (event, saleData, cartItems) => {
    const { BrowserWindow } = await import('electron');
    const receiptWin = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    const receiptHTML = generateReceiptHTML({ saleData, cartItems, preview: false });
    receiptWin.webContents.addListener('did-finish-load', async () => {
      receiptWin.webContents.print({ silent: false }, (success, failureReason) => {
        if (success) {
          receiptWin.close();
        } else {
          console.error('Print job failed:', failureReason);
        }
      });
    });
    await receiptWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(receiptHTML));
  });

  // Preview receipt (shows window with print button)
  ipcMain.handle('previewReceipt', async (event, saleData, cartItems) => {
    const { BrowserWindow } = await import('electron');
    const receiptWin = new BrowserWindow({
      width: 400,
      height: 600,
      show: true,
      title: `Receipt Preview - Sale #${saleData.saleId}`,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    const receiptHTML = generateReceiptHTML({ saleData, cartItems, preview: true });
    await receiptWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(receiptHTML));
  });
} 