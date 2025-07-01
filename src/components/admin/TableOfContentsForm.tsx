import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';

interface TableOfContentsItem {
  id: string;
  chapter_title: string;
  page_number: number;
  level: number;
  order_index: number;
}

interface TableOfContentsFormProps {
  items: TableOfContentsItem[];
  onChange: (items: TableOfContentsItem[]) => void;
}

export const TableOfContentsForm = ({ items, onChange }: TableOfContentsFormProps) => {
  const [newItem, setNewItem] = useState({
    chapter_title: '',
    page_number: 1,
    level: 1
  });

  const addItem = () => {
    if (!newItem.chapter_title.trim()) return;

    const item: TableOfContentsItem = {
      id: `temp-${Date.now()}`,
      chapter_title: newItem.chapter_title,
      page_number: newItem.page_number,
      level: newItem.level,
      order_index: items.length
    };

    onChange([...items, item]);
    setNewItem({ chapter_title: '', page_number: 1, level: 1 });
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    // Update order indices
    const reorderedItems = updatedItems.map((item, i) => ({
      ...item,
      order_index: i
    }));
    onChange(reorderedItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Update order indices
    const reorderedItems = newItems.map((item, i) => ({
      ...item,
      order_index: i
    }));
    
    onChange(reorderedItems);
  };

  const updateItem = (index: number, field: keyof TableOfContentsItem, value: string | number) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updatedItems);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="hebrew-title">תוכן עניינים</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new item form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 border rounded-lg">
          <div>
            <Label className="hebrew-text">כותרת פרק</Label>
            <Input
              value={newItem.chapter_title}
              onChange={(e) => setNewItem({ ...newItem, chapter_title: e.target.value })}
              placeholder="הזן כותרת פרק"
              className="hebrew-text"
            />
          </div>
          <div>
            <Label className="hebrew-text">מספר עמוד</Label>
            <Input
              type="number"
              min="1"
              value={newItem.page_number}
              onChange={(e) => setNewItem({ ...newItem, page_number: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <Label className="hebrew-text">רמה</Label>
            <Input
              type="number"
              min="1"
              max="3"
              value={newItem.level}
              onChange={(e) => setNewItem({ ...newItem, level: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addItem} className="hebrew-text w-full">
              <Plus size={16} className="ml-2" />
              הוסף פרק
            </Button>
          </div>
        </div>

        {/* Existing items list */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={item.chapter_title}
                    onChange={(e) => updateItem(index, 'chapter_title', e.target.value)}
                    className="hebrew-text"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={item.page_number}
                    onChange={(e) => updateItem(index, 'page_number', parseInt(e.target.value) || 1)}
                  />
                  <Input
                    type="number"
                    min="1"
                    max="3"
                    value={item.level}
                    onChange={(e) => updateItem(index, 'level', parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                  >
                    <MoveUp size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                  >
                    <MoveDown size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-8 hebrew-text text-muted-foreground">
            אין פרקים בתוכן העניינים עדיין
          </div>
        )}
      </CardContent>
    </Card>
  );
};
