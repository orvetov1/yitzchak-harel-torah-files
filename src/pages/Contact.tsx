
import React from 'react';
import Layout from '../components/Layout';

const Contact = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="hebrew-title text-3xl sm:text-4xl font-bold text-primary mb-6 text-center">
            צור קשר
          </h1>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-sm text-center">
          <div className="mb-8">
            <h2 className="hebrew-title text-xl font-semibold text-foreground mb-4">
              יצחק הראל
            </h2>
            <p className="hebrew-text text-muted-foreground text-base">
              לפניות, שאלות או הצעות לשיפור האתר
            </p>
          </div>

          <div className="bg-accent/20 border border-accent rounded-lg p-6 max-w-md mx-auto">
            <div className="hebrew-text text-sm text-muted-foreground mb-2">
              כתובת דוא״ל:
            </div>
            <a 
              href="mailto:yk.harel.2@gmail.com"
              className="hebrew-text text-lg font-medium text-primary hover:text-primary/80 transition-colors"
            >
              yk.harel.2@gmail.com
            </a>
          </div>

          <div className="mt-8 hebrew-text text-sm text-muted-foreground max-w-2xl mx-auto">
            <p>
              אשמח לקבל פניות בנושאי התכנים באתר, הצעות לשיפורים, או כל שאלה אחרת הקשורה לאתר.
              אני משתדל להשיב לכל הפניות במהירות האפשרית.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
