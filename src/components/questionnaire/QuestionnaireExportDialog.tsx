import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

type QuestionnaireQuestion = Database['public']['Tables']['questionnaire_questions']['Row'];

interface QuestionnaireExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  dealName?: string;
  questions: QuestionnaireQuestion[];
  responses: Record<string, any>;
  categorizedQuestions: Record<string, QuestionnaireQuestion[]>;
  completionPercentage: number;
}

export const QuestionnaireExportDialog = ({
  isOpen,
  onClose,
  dealId,
  dealName,
  questions,
  responses,
  categorizedQuestions,
  completionPercentage
}: QuestionnaireExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formatResponse = (value: any, questionType: string): string => {
    if (value === null || value === undefined || value === '') {
      return 'Not answered';
    }
    
    if (questionType === 'yes_no') {
      return value === 'Yes' || value === true ? 'Yes' : 'No';
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return String(value);
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      let currentY = margin;
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Post-LOI Questionnaire', margin, currentY);
      currentY += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      if (dealName) {
        pdf.text(`Deal: ${dealName}`, margin, currentY);
        currentY += 8;
      }
      
      pdf.text(`Completion: ${completionPercentage}%`, margin, currentY);
      currentY += 8;
      
      pdf.text(`Export Date: ${new Date().toLocaleDateString()}`, margin, currentY);
      currentY += 20;
      
      // Table of Contents
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Table of Contents', margin, currentY);
      currentY += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      Object.keys(categorizedQuestions).forEach((category, index) => {
        pdf.text(`${index + 1}. ${category}`, margin + 5, currentY);
        currentY += 6;
      });
      
      currentY += 20;
      
      // Questions by Category
      Object.entries(categorizedQuestions).forEach(([category, categoryQuestions]) => {
        // Check if we need a new page
        if (currentY > pdf.internal.pageSize.height - 50) {
          pdf.addPage();
          currentY = margin;
        }
        
        // Category header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(category, margin, currentY);
        currentY += 15;
        
        categoryQuestions.forEach((question) => {
          // Check if we need a new page for question
          if (currentY > pdf.internal.pageSize.height - 60) {
            pdf.addPage();
            currentY = margin;
          }
          
          // Question
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          const questionLines = pdf.splitTextToSize(
            `Q: ${question.question_text}${question.is_required ? ' *' : ''}`,
            pageWidth - 2 * margin
          );
          pdf.text(questionLines, margin, currentY);
          currentY += questionLines.length * 5;
          
          // Answer
          pdf.setFont('helvetica', 'normal');
          const responseText = formatResponse(responses[question.id], question.question_type);
          const answerLines = pdf.splitTextToSize(
            `A: ${responseText}`,
            pageWidth - 2 * margin
          );
          pdf.text(answerLines, margin, currentY);
          currentY += answerLines.length * 5 + 8;
        });
        
        currentY += 10;
      });
      
      // Save the PDF
      const fileName = `questionnaire-${dealName?.replace(/[^a-z0-9]/gi, '-') || 'export'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Export Complete",
        description: "Your questionnaire has been exported to PDF successfully.",
      });
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export questionnaire to PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Post-LOI Questionnaire Summary'],
        [''],
        ['Deal Name', dealName || 'N/A'],
        ['Export Date', new Date().toLocaleDateString()],
        ['Completion Percentage', `${completionPercentage}%`],
        ['Total Questions', questions.length],
        ['Answered Questions', Object.keys(responses).length],
        ['']
      ];
      
      // Add category breakdown
      summaryData.push(['Category Breakdown']);
      summaryData.push(['Category', 'Total Questions', 'Answered', 'Completion %']);
      
      Object.entries(categorizedQuestions).forEach(([category, categoryQuestions]) => {
        const answered = categoryQuestions.filter(q => responses[q.id] !== undefined).length;
        const completion = Math.round((answered / categoryQuestions.length) * 100);
        summaryData.push([category, categoryQuestions.length, answered, `${completion}%`]);
      });
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Individual category sheets
      Object.entries(categorizedQuestions).forEach(([category, categoryQuestions]) => {
        const categoryData = [
          ['Question', 'Answer', 'Required', 'Question Type', 'Help Text']
        ];
        
        categoryQuestions.forEach((question) => {
          const response = formatResponse(responses[question.id], question.question_type);
          categoryData.push([
            question.question_text,
            response,
            question.is_required ? 'Yes' : 'No',
            question.question_type,
            question.help_text || ''
          ]);
        });
        
        const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
        
        // Set column widths
        categorySheet['!cols'] = [
          { width: 50 },  // Question
          { width: 30 },  // Answer
          { width: 10 },  // Required
          { width: 15 },  // Question Type
          { width: 30 }   // Help Text
        ];
        
        // Clean category name for sheet name (Excel has restrictions)
        const sheetName = category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
        XLSX.utils.book_append_sheet(workbook, categorySheet, sheetName);
      });
      
      // All questions sheet
      const allQuestionsData = [
        ['Category', 'Question', 'Answer', 'Required', 'Question Type', 'Date Completed']
      ];
      
      questions.forEach((question) => {
        const response = formatResponse(responses[question.id], question.question_type);
        allQuestionsData.push([
          question.category,
          question.question_text,
          response,
          question.is_required ? 'Yes' : 'No',
          question.question_type,
          responses[question.id] ? new Date().toLocaleDateString() : 'Not completed'
        ]);
      });
      
      const allQuestionsSheet = XLSX.utils.aoa_to_sheet(allQuestionsData);
      allQuestionsSheet['!cols'] = [
        { width: 20 },  // Category
        { width: 50 },  // Question
        { width: 30 },  // Answer
        { width: 10 },  // Required
        { width: 15 },  // Question Type
        { width: 15 }   // Date Completed
      ];
      
      XLSX.utils.book_append_sheet(workbook, allQuestionsSheet, 'All Questions');
      
      // Save the Excel file
      const fileName = `questionnaire-${dealName?.replace(/[^a-z0-9]/gi, '-') || 'export'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Excel Export Complete",
        description: "Your questionnaire has been exported to Excel successfully.",
      });
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export questionnaire to Excel.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Questionnaire</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={exportToPDF}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Export as PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Professional document format with clean layout, perfect for sharing and printing.
                  </p>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={exportToPDF}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Download PDF'}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={exportToExcel}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Export as Excel</h3>
                  <p className="text-sm text-muted-foreground">
                    Structured spreadsheet with multiple tabs, ideal for data analysis and manipulation.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={exportToExcel}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Download Excel'}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Both formats include all answered questions and maintain the category structure. 
            Exports are automatically named with the deal name and current date.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};