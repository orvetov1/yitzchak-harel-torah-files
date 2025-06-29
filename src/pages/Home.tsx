
import React from 'react';
import Layout from '../components/Layout';

const Home = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="hebrew-title text-4xl sm:text-5xl font-bold text-primary mb-6">
            האתר של יצחק הראל
          </h1>
          <p className="hebrew-text text-lg text-muted-foreground mb-4">
            yk.harel.2@gmail.com
          </p>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 mb-8 shadow-sm">
            <h2 className="hebrew-title text-2xl font-semibold text-foreground mb-6 text-center">
              ברוכים הבאים לארכיון התורני
            </h2>
            
            <div className="hebrew-text text-base leading-relaxed space-y-4 text-muted-foreground">
              <p>
                אתר זה נועד להציג ולהנגיש תכנים תורניים איכותיים במגוון תחומים. 
                כאן תוכלו למצוא חומרי לימוד וחקר בנושאי מקרא, מדרש ואגדה, ועקרונות הלכתיים.
              </p>
              
              <p>
                כל התכנים מוצגים בפורמט PDF נוח לקריאה ולהורדה, ומסודרים בקטגוריות ברורות 
                למציאה קלה ומהירה של החומר הרצוי.
              </p>
              
              <p>
                האתר מתעדכן באופן שוטף בתכנים חדשים ורלוונטיים.
              </p>
            </div>
          </div>

          <div className="bg-accent/30 border border-accent rounded-lg p-6">
            <h3 className="hebrew-title text-lg font-semibold text-foreground mb-4">
              אופן השימוש באתר
            </h3>
            <div className="hebrew-text text-sm text-muted-foreground space-y-2">
              <p>• עברו לקטגוריה הרצויה דרך התפריט העליון</p>
              <p>• לחצו על "צפה" לקריאה ישירה בדפדפן</p>
              <p>• לחצו על "הורד" לשמירת הקובץ במחשב</p>
              <p>• השתמשו בעמוד "צור קשר" לפניות ושאלות</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
