
import React from 'react';
import Layout from '../components/Layout';

const About = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="hebrew-title text-3xl sm:text-4xl font-bold text-primary mb-6 text-center">
            אודות
          </h1>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <div className="hebrew-text text-base leading-relaxed space-y-6 text-muted-foreground">
            <p>
              האתר של יצחק הראל הוא ארכיון דיגיטלי המוקדש להנגשת תכנים תורניים איכותיים 
              לציבור הרחב. המטרה היא לספק גישה נוחה וקלה לחומרי לימוד ומחקר בתחומי התורה השונים.
            </p>

            <p>
              האתר מתמחה בהצגת תכנים בתחומי המקרא, מדרש ואגדה, ועקרונות הלכתיים, 
              כאשר כל התכנים מוגשים בפורמט PDF איכותי המותאם לקריאה ולהדפסה.
            </p>

            <p>
              התכנים באתר נבחרו בקפידה ומיועדים למתעניינים בלימוד תורני ברמה גבוהה, 
              תוך שמירה על דיוק ואמינות המקורות.
            </p>

            <div className="bg-accent/20 border border-accent rounded-md p-6 mt-8">
              <h3 className="hebrew-title text-lg font-semibold text-foreground mb-4">
                עקרונות האתר
              </h3>
              <ul className="hebrew-text text-sm space-y-2">
                <li>• הנגשת תכנים תורניים איכותיים</li>
                <li>• שמירה על דיוק ואמינות המקורות</li>
                <li>• ממשק פשוט ונוח לשימוש</li>
                <li>• עדכון שוטף של התכנים</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
