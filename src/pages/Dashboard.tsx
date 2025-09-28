import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome to ToolHub</h1>
            <p className="text-muted-foreground">Hello, {user?.email}</p>
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Link Shortener</CardTitle>
              <CardDescription>Create shorter, cleaner links</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Generator</CardTitle>
              <CardDescription>Generate QR codes instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Encrypted Text</CardTitle>
              <CardDescription>Send messages securely</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temporary Email</CardTitle>
              <CardDescription>Protect your inbox</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Image Compressor</CardTitle>
              <CardDescription>Optimize photos instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PDF Tools</CardTitle>
              <CardDescription>Handle documents easily</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Coming Soon</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;