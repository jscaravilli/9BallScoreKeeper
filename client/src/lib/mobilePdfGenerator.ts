import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import pdfMake from 'pdfmake/build/pdfmake';
import html2pdf from 'html2pdf.js';
import { renderScoresheetToCanvas } from './pdfGenerator';

// Mobile-friendly PDF generation with multiple fallback strategies
export class MobilePDFGenerator {
  private static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private static async generatePNGFallback(canvas: HTMLCanvasElement, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas to blob conversion failed'));
          return;
        }
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename.replace('.pdf', '.png');
        link.click();
        URL.revokeObjectURL(link.href);
        resolve();
      }, 'image/png', 0.9);
    });
  }

  // Enhanced jsPDF with mobile optimizations
  private static async generateWithJsPDF(canvas: HTMLCanvasElement, filename: string): Promise<void> {
    try {
      const imgData = canvas.toDataURL('image/png', 0.8); // Reduced quality for mobile
      
      // Mobile-optimized PDF settings
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
        compress: true,
        precision: 2
      });
      
      // Add image with mobile-friendly settings
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
      
      // Validate PDF size before saving
      const pdfOutput = pdf.output('blob');
      if (pdfOutput.size < 1000) {
        throw new Error('PDF too small, likely failed');
      }
      
      // Mobile-friendly save method
      if (this.isMobile()) {
        // Create a download link for mobile
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfOutput);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } else {
        pdf.save(filename);
      }
    } catch (error) {
      console.error('jsPDF generation failed:', error);
      throw error;
    }
  }

  // PDF-lib with enhanced mobile support
  private static async generateWithPDFLib(canvas: HTMLCanvasElement, filename: string): Promise<void> {
    try {
      const pdfDoc = await PDFDocument.create();
      
      // Convert canvas to PNG bytes
      const pngBytes = await new Promise<Uint8Array>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Canvas to blob failed'));
            return;
          }
          const arrayBuffer = await blob.arrayBuffer();
          resolve(new Uint8Array(arrayBuffer));
        }, 'image/png', 0.8);
      });
      
      // Embed PNG image
      const pngImage = await pdfDoc.embedPng(pngBytes);
      const pngDims = pngImage.scale(1);
      
      // Add page with exact dimensions
      const page = pdfDoc.addPage([pngDims.width, pngDims.height]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pngDims.width,
        height: pngDims.height,
      });
      
      // Save with mobile-friendly method
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      if (blob.size < 1000) {
        throw new Error('PDF too small, likely failed');
      }
      
      // Mobile-optimized download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('PDF-lib generation failed:', error);
      throw error;
    }
  }

  // html2pdf.js with mobile optimizations
  private static async generateWithHtml2PDF(canvas: HTMLCanvasElement, filename: string): Promise<void> {
    try {
      // Create a temporary div with the canvas
      const div = document.createElement('div');
      div.style.width = `${canvas.width}px`;
      div.style.height = `${canvas.height}px`;
      div.style.background = `url(${canvas.toDataURL('image/png', 0.8)}) no-repeat`;
      div.style.backgroundSize = 'contain';
      document.body.appendChild(div);
      
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'png', quality: 0.8 },
        html2canvas: { 
          scale: this.isMobile() ? 1 : 2, // Lower scale for mobile
          useCORS: true,
          logging: false
        },
        jsPDF: { 
          unit: 'px', 
          format: [canvas.width, canvas.height], 
          orientation: 'landscape',
          compress: true
        }
      };
      
      await html2pdf().set(opt).from(div).save();
      document.body.removeChild(div);
    } catch (error) {
      console.error('html2pdf generation failed:', error);
      throw error;
    }
  }

  // Main generation method with progressive fallbacks
  public static async generateScoresheet(
    tallies: Array<{ x: number; y: number; symbol: string; game: number }>,
    circles: Array<{ x: number; y: number }>,
    verticalLines: Array<{ x: number; y: number }>,
    filename: string,
    matchData?: any
  ): Promise<void> {
    try {
      // Render canvas (same as before)
      const canvas = await renderScoresheetToCanvas(tallies, circles, verticalLines, matchData);
      
      // Progressive enhancement: try multiple methods
      const methods = [
        () => this.generateWithJsPDF(canvas, filename),
        () => this.generateWithPDFLib(canvas, filename),
        () => this.generateWithHtml2PDF(canvas, filename),
      ];
      
      // If mobile, add PNG fallback as first option
      if (this.isMobile()) {
        methods.unshift(() => this.generatePNGFallback(canvas, filename));
      }
      
      for (const method of methods) {
        try {
          await method();
          console.log('PDF generation successful');
          return;
        } catch (error) {
          console.warn('PDF method failed, trying next:', error);
          continue;
        }
      }
      
      // All methods failed, try PNG fallback
      await this.generatePNGFallback(canvas, filename);
      console.log('All PDF methods failed, generated PNG instead');
      
    } catch (error) {
      console.error('All generation methods failed:', error);
      throw new Error('Unable to generate scoresheet. Please try again.');
    }
  }

  // Utility method to test PDF generation capabilities
  public static async testPDFSupport(): Promise<{
    jsPDF: boolean;
    pdfLib: boolean;
    html2pdf: boolean;
    canvas: boolean;
  }> {
    const results = {
      jsPDF: false,
      pdfLib: false,
      html2pdf: false,
      canvas: false
    };
    
    try {
      // Test canvas support
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
        results.canvas = canvas.toDataURL('image/png').length > 100;
      }
      
      // Test jsPDF
      try {
        const testPdf = new jsPDF();
        testPdf.text('test', 10, 10);
        results.jsPDF = testPdf.output('datauristring').length > 100;
      } catch (e) {
        console.warn('jsPDF test failed:', e);
      }
      
      // Test PDF-lib
      try {
        const testDoc = await PDFDocument.create();
        const testPage = testDoc.addPage([200, 200]);
        testPage.drawText('test', { x: 10, y: 10 });
        const testBytes = await testDoc.save();
        results.pdfLib = testBytes.length > 100;
      } catch (e) {
        console.warn('PDF-lib test failed:', e);
      }
      
      // Test html2pdf
      try {
        const testDiv = document.createElement('div');
        testDiv.innerHTML = 'test';
        // html2pdf is harder to test without actually generating
        results.html2pdf = typeof html2pdf === 'function';
      } catch (e) {
        console.warn('html2pdf test failed:', e);
      }
      
    } catch (error) {
      console.error('PDF support test failed:', error);
    }
    
    return results;
  }
}

// Export the main generation function
export const generateMobileFriendlyPDF = MobilePDFGenerator.generateScoresheet;
export const testPDFSupport = MobilePDFGenerator.testPDFSupport;