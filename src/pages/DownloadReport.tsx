import { useState } from 'react';
import { Calendar, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';

type ReportType = 'weekly' | 'monthly' | 'total' | 'custom';

export default function DownloadReport() {
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (reportType === 'custom' && (!startDate || !endDate)) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates for custom report',
        variant: 'destructive',
      });
      return;
    }

    if (reportType === 'custom' && new Date(startDate) > new Date(endDate)) {
      toast({
        title: 'Error',
        description: 'Start date must be before end date',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get API base URL from environment or default
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dairyfarmbiz-backend.onrender.com/api/v1';
      let url = `${API_BASE_URL}/reports/${reportType}`;
      if (reportType === 'custom') {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      // Extract filename from content-disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `dairy-report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Create a download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Success',
        description: 'Report downloaded successfully',
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            <CardTitle>Download Excel Report</CardTitle>
          </div>
          <CardDescription>
            Export your dairy farm data as a comprehensive Excel report with multiple sheets including
            summary, animals, milk collection, expenses, and breeding records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Report Type</Label>
            <RadioGroup value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer flex-1">
                  <div className="font-medium">Weekly Report</div>
                  <div className="text-sm text-muted-foreground">Last 7 days data</div>
                </Label>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer flex-1">
                  <div className="font-medium">Monthly Report</div>
                  <div className="text-sm text-muted-foreground">Current month data</div>
                </Label>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="total" id="total" />
                <Label htmlFor="total" className="cursor-pointer flex-1">
                  <div className="font-medium">Total Report</div>
                  <div className="text-sm text-muted-foreground">All time data</div>
                </Label>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer flex-1">
                  <div className="font-medium">Custom Date Range</div>
                  <div className="text-sm text-muted-foreground">Select your own date range</div>
                </Label>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </RadioGroup>
          </div>

          {/* Custom Date Range Inputs */}
          {reportType === 'custom' && (
            <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={startDate}
                />
              </div>
            </div>
          )}

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Excel Report
              </>
            )}
          </Button>

          {/* Info Box */}
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
              📊 Report includes:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Summary with key metrics and financial overview</li>
              <li>• Complete animal inventory with details</li>
              <li>• Milk collection records with revenue</li>
              <li>• Expense breakdown by category</li>
              <li>• Breeding and insemination records</li>
              <li>• Historical milk rate information</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
}
