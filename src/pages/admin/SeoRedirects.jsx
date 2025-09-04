import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Plus, Trash2, Download, Upload } from "lucide-react";

export default function SeoRedirects() {
  const [redirects, setRedirects] = useState([
    { id: 1, from: '/old-product', to: '/new-product', type: '301', status: 'active' },
    { id: 2, from: '/category/old-name', to: '/category/new-name', type: '301', status: 'active' }
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <RefreshCw className="h-6 w-6" />
        <h1 className="text-3xl font-bold">URL Redirects</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Redirect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-url">From URL</Label>
              <Input id="from-url" placeholder="/old-path" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="to-url">To URL</Label>
              <Input id="to-url" placeholder="/new-path" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="redirect-type">Type</Label>
              <Select defaultValue="301">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 (Permanent)</SelectItem>
                  <SelectItem value="302">302 (Temporary)</SelectItem>
                  <SelectItem value="307">307 (Temporary)</SelectItem>
                  <SelectItem value="308">308 (Permanent)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Redirect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Redirects</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redirects.map(redirect => (
                <TableRow key={redirect.id}>
                  <TableCell className="font-mono text-sm">{redirect.from}</TableCell>
                  <TableCell className="font-mono text-sm">{redirect.to}</TableCell>
                  <TableCell>{redirect.type}</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      {redirect.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}