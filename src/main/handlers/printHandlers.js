import { ipcMain } from 'electron';

// Utility function to format currency with commas
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function setupPrintHandlers() {
  ipcMain.handle('printLabel', async (event, product) => {
    const { BrowserWindow } = await import('electron');
    const labelWin = new BrowserWindow({
      width: 300,
      height: 180,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const labelHTML = `
      <html>
        <body style="font-family:sans-serif;text-align:center;padding:0;margin:0;">
          <div style="font-size:18px;font-weight:bold;">${product.name}</div>
          <div style="font-size:16px;">Price: ${formatCurrency(product.price)}</div>
          <svg id="barcode"></svg>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.0/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode(document.getElementById('barcode'), '${product.sku}', {format:'CODE128', width:2, height:40, displayValue:false});
          </script>
        </body>
      </html>
    `;

    await labelWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(labelHTML));
    labelWin.webContents.on('did-finish-load', () => {
      labelWin.webContents.print({ silent: false }, () => {
        labelWin.close();
      });
    });
  });

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

    const receiptHTML = `
      <html>
        <head>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .item { margin: 5px 0; }
            .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>เพื่อนเกษตร</h2>
            <div>ใบเสร็จรับเงิน</div>
            <div>Sale #${saleData.saleId}</div>
            <div>${new Date(saleData.saleDate).toLocaleString('th-TH')}</div>
          </div>
          <div>
            ${cartItems.map(item => `
              <div class="item">
                <div>${item.name}</div>
                <div>${item.qty} x ${formatCurrency(item.price)} = ${formatCurrency(item.qty * item.price)}</div>
              </div>
            `).join('')}
          </div>
          <div class="total">
            ยอดรวม: ${formatCurrency(saleData.totalAmount)} บาท
          </div>
          <div class="footer">
            ขอบคุณที่ใช้บริการ
          </div>
        </body>
      </html>
    `;

    await receiptWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(receiptHTML));
    receiptWin.webContents.on('did-finish-load', () => {
      receiptWin.webContents.print({ silent: true }, () => {
        receiptWin.close();
      });
    });
  });

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

    const receiptHTML = `
      <html>
        <head>
          <style>
            body { 
              font-family: monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 10px; 
              background-color: #f9f9f9;
            }
            .receipt {
              background-color: white;
              padding: 20px;
              border: 1px solid #ddd;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              max-width: 350px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h2 {
              margin: 0 0 5px 0;
              color: #333;
            }
            .item { 
              margin: 8px 0; 
              padding: 5px 0;
              border-bottom: 1px dotted #eee;
            }
            .item-name {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .item-details {
              color: #666;
              font-size: 11px;
            }
            .total { 
              border-top: 2px solid #333; 
              margin-top: 15px; 
              padding-top: 10px; 
              font-weight: bold;
              font-size: 14px;
              text-align: center;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              font-size: 10px;
              color: #666;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
            .print-button {
              position: fixed;
              top: 10px;
              right: 10px;
              background: #4CAF50;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            }
            .print-button:hover {
              background: #45a049;
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">Print</button>
          <div class="receipt">
            <div class="header">
              <h2>เพื่อนเกษตร</h2>
              <div>ใบเสร็จรับเงิน</div>
              <div style="font-size: 11px; color: #666;">Receipt</div>
              <div style="margin-top: 5px; font-weight: bold;">Sale #${saleData.saleId}</div>
              <div style="font-size: 11px; color: #666;">${new Date(saleData.saleDate).toLocaleString('th-TH')}</div>
            </div>
            <div>
              ${cartItems.map(item => `
                <div class="item">
                  <div class="item-name">${item.name}</div>
                  <div class="item-details">${item.qty} x ${formatCurrency(item.price)} = ${formatCurrency(item.qty * item.price)} บาท</div>
                </div>
              `).join('')}
            </div>
            <div class="total">
              ยอดรวม: ${formatCurrency(saleData.totalAmount)} บาท
            </div>
            <div class="footer">
              ขอบคุณที่ใช้บริการ<br>
              Thank you for your business
            </div>
          </div>
        </body>
      </html>
    `;

    await receiptWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(receiptHTML));
  });
} 