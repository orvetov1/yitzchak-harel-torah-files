
import React from 'react';
import Layout from '../components/Layout';
import PDFList from '../components/PDFList';

const Midrash = () => {
  // Mock data - in real implementation this would come from database
  const pdfItems = [
    {
      id: '1',
      title: 'מדרש רבה - בראשית פרשה א׳',
      description: 'לקט מדרשים על פרשת בראשית עם הסברים וביאורים',
      filePath: '/sample.pdf',
      category: 'midrash'
    }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="hebrew-title text-3xl sm:text-4xl font-bold text-primary mb-4">
            מדרש ואגדה
          </h1>
          
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <p className="hebrew-text text-base leading-relaxed text-muted-foreground mb-4">
              אוסף מדרשי חז״ל ואגדות הקודש המפרשים ומעמיקים בפשט ובדרש של כתבי הקודש.
              כאן תמצאו חומרים על מדרשי הלכה ואגדה, פרקי אבות ועוד.
            </p>
            
            <div className="bg-accent/20 border border-accent rounded-md p-4">
              <p className="hebrew-text text-sm text-muted-foreground">
                <strong>הוראות צפייה והורדה:</strong> לחצו על "צפה" לקריאה ישירה בדפדפן, או על "הורד" לשמירת הקובץ למחשב שלכם.
              </p>
            </div>
          </div>
        </div>

        <PDFList items={pdfItems} category="midrash" />
      </div>
    </Layout>
  );
};

export default Midrash;
