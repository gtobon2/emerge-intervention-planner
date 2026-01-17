'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  useSchoolCalendarStore,
  expandEventDates,
  NON_STUDENT_DAY_TEMPLATES,
} from '@/stores/school-calendar';
import type {
  SchoolCalendarEvent,
  SchoolCalendarEventInsert,
  NonStudentDayType,
} from '@/lib/supabase/types';
import {
  getNonStudentDayTypeLabel,
  getNonStudentDayTypeColor,
} from '@/lib/supabase/types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface EventFormData {
  date: string;
  end_date: string;
  type: NonStudentDayType;
  title: string;
  notes: string;
  modified_start_time: string;
  modified_end_time: string;
}

const defaultFormData: EventFormData = {
  date: '',
  end_date: '',
  type: 'holiday',
  title: '',
  notes: '',
  modified_start_time: '',
  modified_end_time: '',
};

export default function SchoolCalendarPage() {
  const {
    events,
    isLoading,
    fetchAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useSchoolCalendarStore();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolCalendarEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch events on mount
  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [startingDayOfWeek, daysInMonth]);

  // Expand events to date map for quick lookup
  const eventsByDate = useMemo(() => {
    return expandEventDates(events);
  }, [events]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate.get(dateStr) || [];
  };

  // Handle day click
  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setFormData({
      ...defaultFormData,
      date: dateStr,
    });
    setShowAddModal(true);
  };

  // Handle event edit
  const handleEditEvent = (event: SchoolCalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      date: event.date,
      end_date: event.end_date || '',
      type: event.type,
      title: event.title,
      notes: event.notes || '',
      modified_start_time: event.modified_start_time || '',
      modified_end_time: event.modified_end_time || '',
    });
    setShowEditModal(true);
  };

  // Handle form submission for new event
  const handleCreateEvent = async () => {
    if (!formData.title.trim() || !formData.date) return;

    setIsSubmitting(true);
    try {
      const eventData: SchoolCalendarEventInsert = {
        date: formData.date,
        end_date: formData.end_date || null,
        type: formData.type,
        title: formData.title.trim(),
        notes: formData.notes.trim() || null,
        affects_grades: null, // Affects all grades
        modified_start_time: formData.modified_start_time || null,
        modified_end_time: formData.modified_end_time || null,
        created_by: null,
      };

      await createEvent(eventData);
      setShowAddModal(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission for edit
  const handleUpdateEvent = async () => {
    if (!editingEvent || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await updateEvent(editingEvent.id, {
        date: formData.date,
        end_date: formData.end_date || null,
        type: formData.type,
        title: formData.title.trim(),
        notes: formData.notes.trim() || null,
        modified_start_time: formData.modified_start_time || null,
        modified_end_time: formData.modified_end_time || null,
      });
      setShowEditModal(false);
      setEditingEvent(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to update event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEvent(eventId);
      setShowEditModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // Apply template
  const handleApplyTemplate = (template: typeof NON_STUDENT_DAY_TEMPLATES[0]) => {
    setFormData((prev) => ({
      ...prev,
      type: template.type,
      title: template.suggestedTitle,
    }));
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const typeOptions = NON_STUDENT_DAY_TEMPLATES.map((t) => ({
    value: t.type,
    label: t.label,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-semibold text-lg">School Calendar</h1>
                <p className="text-sm text-gray-500">
                  Manage non-student days, holidays, and schedule modifications
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setFormData(defaultFormData);
                setShowAddModal(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    {MONTHS[month]} {year}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="h-24" />;
                    }

                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = getEventsForDay(day);
                    const isToday = dateStr === todayStr;
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        className={`
                          h-24 p-1 border rounded-lg text-left transition-colors
                          hover:bg-gray-50 focus:ring-2 focus:ring-movement focus:ring-offset-1
                          ${isToday ? 'ring-2 ring-movement' : 'border-gray-200'}
                          ${hasEvents ? 'bg-red-50/50' : 'bg-white'}
                        `}
                      >
                        <div className={`
                          text-sm font-medium mb-1
                          ${isToday ? 'text-movement' : 'text-gray-900'}
                        `}>
                          {day}
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 2).map((event, i) => (
                            <div
                              key={`${event.id}-${i}`}
                              className={`
                                text-xs px-1 py-0.5 rounded truncate
                                ${getNonStudentDayTypeColor(event.type)}
                              `}
                              title={event.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 px-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Upcoming events and legend */}
          <div className="space-y-6">
            {/* Event type legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {NON_STUDENT_DAY_TEMPLATES.map((template) => (
                    <div
                      key={template.type}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className={`w-3 h-3 rounded ${getNonStudentDayTypeColor(template.type)}`}
                      />
                      <span>{template.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Upcoming Non-Student Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events
                      .filter((e) => new Date(e.date) >= today)
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(0, 5)
                      .map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleEditEvent(event)}
                          className="w-full text-left p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">
                              {event.title}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${getNonStudentDayTypeColor(event.type)}`}
                            >
                              {getNonStudentDayTypeLabel(event.type)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {event.end_date && event.end_date !== event.date && (
                              <>
                                {' - '}
                                {new Date(event.end_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </>
                            )}
                          </div>
                        </button>
                      ))}
                    {events.filter((e) => new Date(e.date) >= today).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No upcoming events
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Non-Student Day"
        size="md"
      >
        <div className="space-y-4">
          {/* Quick templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {NON_STUDENT_DAY_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => handleApplyTemplate(template)}
                  className={`
                    px-2 py-1 text-xs rounded-lg border transition-colors
                    ${formData.type === template.type
                      ? getNonStudentDayTypeColor(template.type)
                      : 'border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Event Title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Thanksgiving Break"
            required
          />

          <Select
            label="Event Type"
            options={typeOptions}
            value={formData.type}
            onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as NonStudentDayType }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
            <Input
              label="End Date (for ranges)"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
            />
          </div>

          {(formData.type === 'early_dismissal' || formData.type === 'late_start') && (
            <div className="grid grid-cols-2 gap-4">
              {formData.type === 'late_start' && (
                <Input
                  label="Modified Start Time"
                  type="time"
                  value={formData.modified_start_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, modified_start_time: e.target.value }))}
                />
              )}
              {formData.type === 'early_dismissal' && (
                <Input
                  label="Modified End Time"
                  type="time"
                  value={formData.modified_end_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, modified_end_time: e.target.value }))}
                />
              )}
            </div>
          )}

          <Input
            label="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional details..."
          />

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateEvent}
              disabled={isSubmitting || !formData.title.trim() || !formData.date}
            >
              {isSubmitting ? 'Adding...' : 'Add Event'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
        }}
        title="Edit Event"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Event Title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
          />

          <Select
            label="Event Type"
            options={typeOptions}
            value={formData.type}
            onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as NonStudentDayType }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
            <Input
              label="End Date (for ranges)"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
            />
          </div>

          {(formData.type === 'early_dismissal' || formData.type === 'late_start') && (
            <div className="grid grid-cols-2 gap-4">
              {formData.type === 'late_start' && (
                <Input
                  label="Modified Start Time"
                  type="time"
                  value={formData.modified_start_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, modified_start_time: e.target.value }))}
                />
              )}
              {formData.type === 'early_dismissal' && (
                <Input
                  label="Modified End Time"
                  type="time"
                  value={formData.modified_end_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, modified_end_time: e.target.value }))}
                />
              )}
            </div>
          )}

          <Input
            label="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          />

          <div className="flex gap-3 justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => editingEvent && handleDeleteEvent(editingEvent.id)}
              disabled={isSubmitting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEvent(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateEvent}
                disabled={isSubmitting || !formData.title.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
