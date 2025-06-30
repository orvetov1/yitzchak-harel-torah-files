
import React from 'react';
import Layout from '../components/Layout';
import PDFList from '../components/PDFList';
import { usePDFFiles } from '../hooks/usePDFFiles';

const Midrash = () => {
  const { items, isLoading, error } = usePDFFiles('midrash');

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center hebrew-text text-red-600">{error}</div>
        </div>
      </Layout>
    );
  }

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

        <PDFList items={items} category="midrash" isLoading={isLoading} />
      </div>
    </Layout>
  );
};

export default Midrash;
