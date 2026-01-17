import { create } from 'zustand';
import * as supabaseService from '@/lib/supabase/services';
import type {
  SchoolCalendarEvent,
  SchoolCalendarEventInsert,
  SchoolCalendarEventUpdate,
  NonStudentDayType,
} from '@/lib/supabase/types';

interface SchoolCalendarState {
  events: SchoolCalendarEvent[];
  selectedEvent: SchoolCalendarEvent | null;
  // Cache of non-student days for quick lookup
  nonStudentDaysCache: Map<string, string[]>; // key: "startDate|endDate|gradeLevel"
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAllEvents: () => Promise<void>;
  fetchEventsInRange: (startDate: string, endDate: string) => Promise<void>;
  createEvent: (event: SchoolCalendarEventInsert) => Promise<SchoolCalendarEvent | null>;
  updateEvent: (id: string, updates: SchoolCalendarEventUpdate) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedEvent: (event: SchoolCalendarEvent | null) => void;

  // Helpers
  isNonStudentDay: (date: string, gradeLevel?: number) => Promise<boolean>;
  getNonStudentDays: (startDate: string, endDate: string, gradeLevel?: number) => Promise<string[]>;
  getEventsForDate: (date: string) => SchoolCalendarEvent[];
  getUpcomingNonStudentDays: (daysAhead?: number) => SchoolCalendarEvent[];
  clearError: () => void;
}

export const useSchoolCalendarStore = create<SchoolCalendarState>((set, get) => ({
  events: [],
  selectedEvent: null,
  nonStudentDaysCache: new Map(),
  isLoading: false,
  error: null,

  fetchAllEvents: async () => {
    set({ isLoading: true, error: null });

    try {
      const events = await supabaseService.fetchAllCalendarEvents();
      set({ events, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        events: [],
      });
    }
  },

  fetchEventsInRange: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });

    try {
      const events = await supabaseService.fetchCalendarEventsInRange(startDate, endDate);
      set({ events, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
      });
    }
  },

  createEvent: async (event: SchoolCalendarEventInsert) => {
    set({ isLoading: true, error: null });

    try {
      const newEvent = await supabaseService.createCalendarEvent(event);

      set((state) => ({
        events: [...state.events, newEvent].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
        nonStudentDaysCache: new Map(), // Clear cache on changes
        isLoading: false,
      }));

      return newEvent;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateEvent: async (id: string, updates: SchoolCalendarEventUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const updated = await supabaseService.updateCalendarEvent(id, updates);

      set((state) => ({
        events: state.events
          .map((e) => (e.id === id ? updated : e))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        selectedEvent: state.selectedEvent?.id === id ? updated : state.selectedEvent,
        nonStudentDaysCache: new Map(), // Clear cache on changes
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteEvent: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await supabaseService.deleteCalendarEvent(id);

      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        nonStudentDaysCache: new Map(), // Clear cache on changes
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  setSelectedEvent: (event) => {
    set({ selectedEvent: event });
  },

  isNonStudentDay: async (date: string, gradeLevel?: number) => {
    return supabaseService.isNonStudentDay(date, gradeLevel);
  },

  getNonStudentDays: async (startDate: string, endDate: string, gradeLevel?: number) => {
    const cacheKey = `${startDate}|${endDate}|${gradeLevel ?? 'all'}`;
    const cached = get().nonStudentDaysCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const days = await supabaseService.getNonStudentDaysInRange(startDate, endDate, gradeLevel);

    set((state) => {
      const newCache = new Map(state.nonStudentDaysCache);
      newCache.set(cacheKey, days);
      return { nonStudentDaysCache: newCache };
    });

    return days;
  },

  getEventsForDate: (date: string) => {
    const events = get().events;
    return events.filter((event) => {
      const eventStart = event.date;
      const eventEnd = event.end_date || event.date;
      return date >= eventStart && date <= eventEnd;
    });
  },

  getUpcomingNonStudentDays: (daysAhead = 7) => {
    const events = get().events;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    return events.filter((event) => {
      const eventStart = event.date;
      const eventEnd = event.end_date || event.date;
      // Event overlaps with the look-ahead window
      return eventEnd >= todayStr && eventStart <= futureDateStr;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper: Check if a date falls within any event
export function isDateInEvents(
  events: SchoolCalendarEvent[],
  date: string
): SchoolCalendarEvent | null {
  for (const event of events) {
    const eventEnd = event.end_date || event.date;
    if (date >= event.date && date <= eventEnd) {
      return event;
    }
  }
  return null;
}

// Helper: Get all dates between two dates
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Helper: Expand events with date ranges to individual dates
export function expandEventDates(events: SchoolCalendarEvent[]): Map<string, SchoolCalendarEvent[]> {
  const dateMap = new Map<string, SchoolCalendarEvent[]>();

  for (const event of events) {
    const dates = getDatesBetween(event.date, event.end_date || event.date);
    for (const date of dates) {
      const existing = dateMap.get(date) || [];
      existing.push(event);
      dateMap.set(date, existing);
    }
  }

  return dateMap;
}

// Default event templates for quick creation
export const NON_STUDENT_DAY_TEMPLATES: {
  type: NonStudentDayType;
  label: string;
  suggestedTitle: string;
}[] = [
  { type: 'holiday', label: 'Holiday', suggestedTitle: 'Holiday' },
  { type: 'pd_day', label: 'PD Day', suggestedTitle: 'Professional Development Day' },
  { type: 'institute_day', label: 'Institute Day', suggestedTitle: 'Institute Day' },
  { type: 'early_dismissal', label: 'Early Dismissal', suggestedTitle: 'Early Dismissal' },
  { type: 'late_start', label: 'Late Start', suggestedTitle: 'Late Start' },
  { type: 'testing_day', label: 'Testing Day', suggestedTitle: 'Standardized Testing' },
  { type: 'emergency_closure', label: 'Emergency Closure', suggestedTitle: 'Emergency School Closure' },
  { type: 'break', label: 'Break', suggestedTitle: 'School Break' },
];
