
import React from 'react';
import Layout from '../components/Layout';
import PDFList from '../components/PDFList';
import { usePDFFiles } from '../hooks/usePDFFiles';

const Mikra = () => {
  const { items, isLoading, error } = usePDFFiles('mikra');

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center hebrew-text">טוען קבצים...</div>
        </div>
      </Layout>
    );
  }

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
            מקרא
          </h1>
          
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <p className="hebrew-text text-base leading-relaxed text-muted-foreground mb-4">
              כאן תמצאו חומרי לימוד ופירושים על כתבי הקודש, כולל ביאורים על התורה, נביאים וכתובים.
              החומרים כוללים פירושי הראשונים והאחרונים, הסברים מילוליים ורעיוניים.
            </p>
            
            <div className="bg-accent/20 border border-accent rounded-md p-4">
              <p className="hebrew-text text-sm text-muted-foreground">
                <strong>הוראות צפייה והורדה:</strong> לחצו על "צפה" לקריאה ישירה בדפדפן, או על "הורד" לשמירת הקובץ למחשב שלכם.
              </p>
            </div>
          </div>
        </div>

        <PDFList items={items} category="mikra" />
      </div>
    </Layout>
  );
};

export default Mikra;
