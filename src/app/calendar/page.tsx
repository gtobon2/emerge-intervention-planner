'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
            <p className="text-text-muted">
              Schedule and manage your intervention sessions
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Schedule Session
          </Button>
        </div>

        {/* Calendar Navigation */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-semibold text-text-primary">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-text-muted"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Placeholder */}
          <div className="text-center py-12 text-text-muted border-t border-border">
            <p className="mb-4">
              FullCalendar integration will be implemented here.
            </p>
            <p className="text-sm">
              Features: Week/Month view, drag-to-reschedule, Google Calendar sync
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
