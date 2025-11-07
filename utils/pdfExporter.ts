import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  if (!element) {
    console.error("Element to export not found.");
    return;
  }

  // Use html2canvas to capture the element
  const canvas = await html2canvas(element, {
    scale: 2, // Increase resolution for better quality
    useCORS: true,
    backgroundColor: '#1e293b' // Match the bg-slate-800 background color
  });

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10; // 10mm margin on each side

  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = imgProps.width;
  const imgHeight = imgProps.height;
  
  // Calculate the aspect ratio
  const ratio = imgWidth / imgHeight;

  // Fit image to page width with margin
  let finalImgWidth = pdfWidth - margin * 2;
  let finalImgHeight = finalImgWidth / ratio;

  // If the height exceeds the page height with margin, scale down based on height instead
  if (finalImgHeight > pdfHeight - margin * 2) {
      finalImgHeight = pdfHeight - margin * 2;
      finalImgWidth = finalImgHeight * ratio;
  }
  
  // Center the image on the page
  const x = (pdfWidth - finalImgWidth) / 2;
  const y = (pdfHeight - finalImgHeight) / 2;

  pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);
  pdf.save(filename);
};
