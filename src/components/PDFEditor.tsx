import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText, Type, PenTool, Download } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

const PDFEditor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [textToAdd, setTextToAdd] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 750 });
  const [signature, setSignature] = useState('');
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      await loadPDF(file);
    } else if (file) {
      alert('Please select a PDF file.');
    }
  };

  const loadPDF = async (file: File) => {
    setIsProcessing(true);
    try {
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      setPdfDoc(pdfDoc);
      console.log('PDF loaded successfully');
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddText = () => {
    if (!textToAdd.trim()) {
      alert('Please enter some text to add.');
      return;
    }
    if (!pdfDoc) {
      alert('Please load a PDF file first.');
      return;
    }
    
    // For demo purposes, we'll just show a success message
    // In a full implementation, you would modify the PDFDocument
    alert(`Text "${textToAdd}" will be added at position (${textPosition.x}, ${textPosition.y})`);
    setTextToAdd('');
  };

  const handleSaveSignature = () => {
    if (!signature.trim()) {
      alert('Please draw or type your signature first.');
      return;
    }
    alert(`Signature "${signature}" saved and ready to add to PDF`);
  };

  const handleSavePDF = async () => {
    if (!pdfDoc) {
      alert('Please load a PDF file first.');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Get the first page to modify
      const pages = pdfDoc.getPages();
      if (pages.length > 0) {
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        const font = await pdfDoc.embedFont(PDFDocument.Font.Helvetica);
        
        // Add the user's text if provided
        if (textToAdd.trim()) {
          firstPage.drawText(textToAdd, {
            x: textPosition.x,
            y: height - textPosition.y,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          });
        }
        
        // Add signature if provided
        if (signature.trim()) {
          firstPage.drawText(`Signature: ${signature}`, {
            x: 50,
            y: 100,
            size: 14,
            font,
            color: rgb(0, 0, 0),
          });
        }
        
        // Add edited timestamp
        firstPage.drawText(`Edited on: ${new Date().toLocaleString()}`, {
          x: 50,
          y: 70,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName.split('.')[0]}_edited.pdf`;
      link.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Error saving PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      await loadPDF(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card 
        className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf"
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drop your PDF here or click to browse
              </h3>
              <p className="text-sm text-gray-500">
                Edit, sign, and modify your PDF documents
              </p>
            </div>

            {fileName && (
              <p className="text-sm text-green-600 font-medium bg-green-50 p-2 rounded-lg">
                ✓ Loaded: {fileName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editing Tools - Only show when PDF is loaded */}
      {fileName && !isProcessing && pdfDoc && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Text Tool */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Type className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Add Text to PDF</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-input">Text to Add</Label>
                    <Input
                      id="text-input"
                      type="text"
                      value={textToAdd}
                      onChange={(e) => setTextToAdd(e.target.value)}
                      placeholder="Enter text you want to add..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="x-position">X Position</Label>
                      <Input
                        id="x-position"
                        type="number"
                        value={textPosition.x}
                        onChange={(e) => setTextPosition(prev => ({
                          ...prev,
                          x: parseInt(e.target.value) || 0
                        }))}
                        min="0"
                        max="500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="y-position">Y Position</Label>
                      <Input
                        id="y-position"
                        type="number"
                        value={textPosition.y}
                        onChange={(e) => setTextPosition(prev => ({
                          ...prev,
                          y: parseInt(e.target.value) || 0
                        }))}
                        min="0"
                        max="800"
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handleAddText} className="w-full">
                    Add Text to PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Signature Tool */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <PenTool className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Add Signature</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signature">Type Your Signature</Label>
                    <Input
                      id="signature"
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Type your name for signature..."
                    />
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center min-h-[100px] flex items-center justify-center">
                    {signature ? (
                      <div className="text-2xl font-signature text-gray-800 border-b-2 border-gray-800 px-4">
                        {signature}
                      </div>
                    ) : (
                      <p className="text-gray-500">Your signature will appear here</p>
                    )}
                  </div>
                  
                  <Button onClick={handleSaveSignature} variant="outline" className="w-full">
                    Save Signature
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleSavePDF} 
              size="lg"
              className="bg-green-600 hover:bg-green-700 px-8 py-3"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              {isProcessing ? 'Processing...' : 'Save & Download Edited PDF'}
            </Button>
          </div>
        </>
      )}

      {/* Loading State */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div>
                <p className="font-medium">
                  {pdfDoc ? 'Processing your edits...' : `Loading ${fileName}...`}
                </p>
                <p className="text-sm text-gray-500">
                  {pdfDoc ? 'Applying your changes to the PDF' : 'Preparing your PDF for editing'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Type className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold">Add Text</h3>
            <p className="text-sm text-gray-600 mt-1">
              Insert text anywhere in your PDF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <PenTool className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold">Sign Documents</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add digital signatures to contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold">Fill Forms</h3>
            <p className="text-sm text-gray-600 mt-1">
              Complete PDF forms easily
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PDFEditor;
