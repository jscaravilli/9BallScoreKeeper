import { useCallback } from 'react';

export function usePrint() {
  const printElement = useCallback((elementId: string, title?: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id '${elementId}' not found`);
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('Could not open print window');
      return;
    }

    // Copy the element's HTML to the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'APA 9-Ball Scoresheet'}</title>
          <style>
            @media print {
              @page {
                margin: 0;
                size: letter;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.2;
              }
              .no-print {
                display: none !important;
              }
              .print\\:block {
                display: block !important;
              }
              img {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 0;
            }
            
            .relative {
              position: relative;
            }
            
            .absolute {
              position: absolute;
            }
            
            .inset-0 {
              top: 0;
              right: 0;
              bottom: 0;
              left: 0;
            }
            
            .w-full {
              width: 100%;
            }
            
            .h-full {
              height: 100%;
            }
            
            table {
              border-collapse: collapse;
              width: 100%;
            }
            
            .border {
              border: 1px solid black;
            }
            
            .border-r {
              border-right: 1px solid black;
            }
            
            .border-b {
              border-bottom: 1px solid black;
            }
            
            .text-center {
              text-align: center;
            }
            
            .font-bold {
              font-weight: bold;
            }
            
            .bg-yellow-100 {
              background-color: #fef3c7;
            }
            
            .bg-black {
              background-color: black;
              color: white;
            }
            
            .rounded-full {
              border-radius: 50%;
            }
            
            .grid {
              display: grid;
            }
            
            .grid-cols-12 {
              grid-template-columns: repeat(12, minmax(0, 1fr));
            }
            
            .grid-cols-16 {
              grid-template-columns: repeat(16, minmax(0, 1fr));
            }
            
            .grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            
            .grid-cols-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
            
            .col-span-3 {
              grid-column: span 3 / span 3;
            }
            
            .col-span-6 {
              grid-column: span 6 / span 6;
            }
            
            .gap-1 {
              gap: 0.25rem;
            }
            
            .gap-4 {
              gap: 1rem;
            }
            
            .p-1 {
              padding: 0.25rem;
            }
            
            .p-2 {
              padding: 0.5rem;
            }
            
            .p-8 {
              padding: 2rem;
            }
            
            .mb-2 {
              margin-bottom: 0.5rem;
            }
            
            .mb-4 {
              margin-bottom: 1rem;
            }
            
            .mt-6 {
              margin-top: 1.5rem;
            }
            
            .mt-8 {
              margin-top: 2rem;
            }
            
            .text-xs {
              font-size: 0.75rem;
            }
            
            .text-sm {
              font-size: 0.875rem;
            }
            
            .text-lg {
              font-size: 1.125rem;
            }
            
            .text-xl {
              font-size: 1.25rem;
            }
            
            .text-2xl {
              font-size: 1.5rem;
            }
            
            .min-h-[60px] {
              min-height: 60px;
            }
            
            .h-8 {
              height: 2rem;
            }
            
            .flex {
              display: flex;
            }
            
            .flex-1 {
              flex: 1 1 0%;
            }
            
            .flex-col {
              flex-direction: column;
            }
            
            .items-center {
              align-items: center;
            }
            
            .justify-center {
              justify-content: center;
            }
            
            .justify-between {
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  }, []);

  return { printElement };
}