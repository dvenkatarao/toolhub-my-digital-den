import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileText, Type, PenTool } from 'lucide-react';

const PDFEditor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [textToAdd, setTextToAdd] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      loadPDF(file);
    } else if (file) {
      alert('Please select a PDF file.');
    }
  };

  const loadPDF = async (file: File) => {
    setIsProcessing(true);
    try {
      // Simulate PDF loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In real implementation, you would use pdf-lib to load and display the PDF
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
    // In real implementation, you would add text to the PDF using pdf-lib
    alert(`Text "${textToAdd}" would be added at position (${textPosition.x}, ${textPosition.y})`);
  };

  const handleSave = () => {
    if (!fileName) {
      alert('Please load a PDF file first.');
      return;
    }
    // In real implementation, you would save the modified PDF
    alert('Modified PDF would be downloaded');
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      loadPDF(file);
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
            accept=".pdf"
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            
            <div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Choose PDF File
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                or drag and drop a PDF file here
              </p>
            </div>

            {fileName && (
              <p className="text-sm text-green-600 font-medium">
                Loaded: {fileName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editing Tools */}
      {fileName && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Text Tool */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Type className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Add Text</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Text to Add
                  </label>
                  <Input
                    type="text"
                    value={textToAdd}
                    onChange={(e) => setTextToAdd(e.target.value)}
                    placeholder="Enter text to add to the PDF"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      X Position
                    </label>
                    <Input
                      type="number"
                      value={textPosition.x}
                      onChange={(e) => setTextPosition(prev => ({
                        ...prev,
                        x: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Y Position
                    </label>
                    <Input
                      type="number"
                      value={textPosition.y}
                      onChange={(e) => setTextPosition(prev => ({
                        ...prev,
                        y: parseInt(e.target.value) || 0
                      }))}
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
                <p className="text-sm text-gray-600">
                  Draw your signature or upload an image of your signature to add to the PDF.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500 mb-3">Signature area will appear here</p>
                  <Button variant="outline" className="w-full">
                    Draw Signature
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      {fileName && (
        <div className="flex justify-center">
          <Button 
            onClick={handleSave} 
            size="lg"
            className="bg-green-600 hover:bg-green-700 px-8"
          >
            Save & Download Modified PDF
          </Button>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Type className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold">Add Text</h3>
            <p className="text-sm text-gray-600 mt-1">
              Insert text anywhere in your PDF document
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <PenTool className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold">Sign Documents</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add your signature to contracts and forms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold">Fill Forms</h3>
            <p className="text-sm text-gray-600 mt-1">
              Easily fill out PDF forms and applications
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PDFEditor;
