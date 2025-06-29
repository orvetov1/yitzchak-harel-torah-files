
import React from 'react';
import Layout from '../components/Layout';
import PDFList from '../components/PDFList';

const Halakha = () => {
  // Mock data - in real implementation this would come from database
  const pdfItems = [
    {
      id: '1',
      title: 'עקרונות פסיקת ההלכה',
      description: 'מבוא לכללי הוראה ופסיקה בהלכה היהודית',
      filePath: '/sample.pdf',
      category: 'halakha'
    }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="hebrew-title text-3xl sm:text-4xl font-bold text-primary mb-4">
            עקרות הלכתית
          </h1>
          
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <p className="hebrew-text text-base leading-relaxed text-muted-foreground mb-4">
              חומרים העוסקים בעקרונות יסוד בהלכה היהודית, כללי פסיקה והוראה, 
              ומתודולוגיה של למידת הלכה. כאן תמצאו מאמרים ומחקרים בנושאי יסוד בהלכה.
            </p>
            
            <div className="bg-accent/20 border border-accent rounded-md p-4">
              <p className="hebrew-text text-sm text-muted-foreground">
                <strong>הוראות צפייה והורדה:</strong> לחצו על "צפה" לקריאה ישירה בדפדפן, או על "הורד" לשמירת הקובץ למחשב שלכם.
              </p>
            </div>
          </div>
        </div>

        <PDFList items={pdfItems} category="halakha" />
      </div>
    </Layout>
  );
};

export default Halakha;
