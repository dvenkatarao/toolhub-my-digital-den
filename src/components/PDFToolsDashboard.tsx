import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PDFConverter from './PDFConverter';
import PDFEditor from './PDFEditor';

const PDFToolsDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF Tools</h1>
        <p className="text-lg text-gray-600">
          Simple, powerful PDF tools that work right in your browser
        </p>
      </div>

      <Tabs defaultValue="convert" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="convert" className="text-lg py-3">
            Convert Files
          </TabsTrigger>
          <TabsTrigger value="edit" className="text-lg py-3">
            Edit PDF
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="convert">
          <Card>
            <CardHeader>
              <CardTitle>Convert to PDF</CardTitle>
              <CardDescription>
                Convert your documents and images to PDF format. Your files never leave your computer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PDFConverter />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit PDF</CardTitle>
              <CardDescription>
                Fill forms, add text, and sign your PDF documents easily.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PDFEditor />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFToolsDashboard;
