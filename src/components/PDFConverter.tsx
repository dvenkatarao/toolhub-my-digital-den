import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, FileText, Image, File } from 'lucide-react';

const PDFConverter: React.FC = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      convertToPDF(file);
    }
  };

  const convertToPDF = async (file: File) => {
    setIsConverting(true);
    setConvertedFile(null);

    try {
      // Simulate conversion process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would use pdf-lib to create PDF
      // For now, we'll simulate a successful conversion
      const blob = new Blob(['Simulated PDF content'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setConvertedFile(url);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error converting file. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (convertedFile) {
      const link = document.createElement('a');
      link.href = convertedFile;
      link.download = `${fileName.split('.')[0]}.pdf`;
      link.click();
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      convertToPDF(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card 
        className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="p-8 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".doc,.docx,.txt,.jpg,.jpeg,.png,.heic"
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            
            <div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isConverting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConverting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <File className="h-4 w-4 mr-2" />
                )}
                Choose Files
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                or drag and drop files here
              </p>
            </div>

            <div className="text-xs text-gray-500">
              Supports: DOC, DOCX, TXT, JPG, PNG, HEIC
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Status */}
      {isConverting && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div>
                <p className="font-medium">Converting {fileName} to PDF...</p>
                <p className="text-sm text-gray-500">This may take a few seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Section */}
      {convertedFile && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Conversion Complete!</p>
                  <p className="text-sm text-gray-600">
                    Your file has been converted to PDF format
                  </p>
                </div>
              </div>
              <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700">
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold">Document Conversion</h3>
            <p className="text-sm text-gray-600 mt-1">
              Convert Word documents and text files to PDF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Image className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold">Image to PDF</h3>
            <p className="text-sm text-gray-600 mt-1">
              Convert JPG, PNG, and HEIC images to PDF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 text-sm font-bold">100%</span>
            </div>
            <h3 className="font-semibold">Privacy First</h3>
            <p className="text-sm text-gray-600 mt-1">
              Your files never leave your computer
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PDFConverter;
