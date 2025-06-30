
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PDFFile {
  id: string;
  category_id: string;
}

interface StatisticsCardProps {
  pdfFiles: PDFFile[];
  categories: Category[];
}

export const StatisticsCard = ({ pdfFiles, categories }: StatisticsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="hebrew-title">סטטיסטיקות</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="hebrew-text">סה״כ קבצים:</span>
            <span className="font-bold">{pdfFiles.length}</span>
          </div>
          {categories.map((category) => (
            <div key={category.id} className="flex justify-between">
              <span className="hebrew-text">{category.name}:</span>
              <span className="font-bold">
                {pdfFiles.filter(f => f.category_id === category.id).length}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
