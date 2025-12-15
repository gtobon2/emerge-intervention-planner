'use client';

import { useState } from 'react';
import {
  BookOpen,
  Users,
  Calendar,
  PlayCircle,
  BarChart3,
  AlertCircle,
  FileText,
  HelpCircle,
  ChevronRight,
  Search,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Card, Input, Button } from '@/components/ui';
import { useHelpStore } from '@/stores/help';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: {
    heading: string;
    text: string;
  }[];
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <PlayCircle className="w-5 h-5" />,
    content: [
      {
        heading: 'What is EMERGE?',
        text: 'EMERGE is a research-based intervention planner designed for reading and math interventionists. It helps you plan sessions, track student progress, and manage intervention groups effectively.',
      },
      {
        heading: 'Creating Your First Group',
        text: 'Navigate to Groups from the sidebar and click "New Group". Enter the group name, select a curriculum (Wilson, Delta Math, Camino, WordGen, or Amira), choose the tier level, and set the grade. You can also configure a recurring schedule.',
      },
      {
        heading: 'Adding Students',
        text: 'Once you have a group, add students by clicking on the group and then "Add Student". You can also import multiple students at once using the CSV import feature on the Students page.',
      },
    ],
  },
  {
    id: 'managing-groups',
    title: 'Managing Groups',
    icon: <Users className="w-5 h-5" />,
    content: [
      {
        heading: 'Group Settings',
        text: 'Each group has a curriculum type, tier level (1, 2, or 3), and grade level. The curriculum determines the structure of your sessions and which error patterns are suggested.',
      },
      {
        heading: 'Curriculum Positions',
        text: 'Track your position in each curriculum. Wilson uses Steps and Substeps, Delta Math uses Standards and Sessions, Camino uses Lessons, WordGen uses Units and Days, and Amira uses proficiency levels.',
      },
      {
        heading: 'Scheduling',
        text: 'Set up recurring session schedules by selecting which days of the week your group meets, the start time, and session duration. Sessions will appear automatically on your calendar.',
      },
    ],
  },
  {
    id: 'running-sessions',
    title: 'Running Sessions',
    icon: <Calendar className="w-5 h-5" />,
    content: [
      {
        heading: 'Starting a Session',
        text: 'From a group detail page or the calendar, click "Start Session" to begin. The session interface provides tools for real-time tracking during your intervention.',
      },
      {
        heading: 'OTR Tracking',
        text: 'Opportunities to Respond (OTR) measure student engagement. Click the + button to count group OTRs, or click on individual student circles to track per-student engagement.',
      },
      {
        heading: 'Error Tracking',
        text: 'When students make errors, check off anticipated errors or add unexpected ones. Track whether your correction worked for each student using the checkmark and X buttons.',
      },
      {
        heading: 'Session Timer',
        text: 'The built-in timer helps you pace your sessions. Start/stop the timer and compare against your target duration to maintain consistent intervention timing.',
      },
      {
        heading: 'Voice Notes',
        text: 'Click the microphone icon to dictate notes hands-free during sessions. Your speech will be transcribed and added to the session notes.',
      },
    ],
  },
  {
    id: 'progress-monitoring',
    title: 'Progress Monitoring',
    icon: <BarChart3 className="w-5 h-5" />,
    content: [
      {
        heading: 'Adding Data Points',
        text: 'Record progress monitoring scores regularly. Click "Add Data" and enter the date, measure type, score, and optionally the benchmark and goal values.',
      },
      {
        heading: 'Understanding Charts',
        text: 'Progress charts show student scores over time. The trend line indicates whether a student is improving (green), declining (red), or flat (gray).',
      },
      {
        heading: 'Decision Rules',
        text: 'For Tier 3 interventions, EMERGE helps you apply decision rules. If a student shows insufficient progress, consider adjusting your intervention intensity or approach.',
      },
    ],
  },
  {
    id: 'error-bank',
    title: 'Error Bank',
    icon: <AlertCircle className="w-5 h-5" />,
    content: [
      {
        heading: 'What is the Error Bank?',
        text: 'The Error Bank stores common student errors and evidence-based correction strategies. It comes pre-populated with errors for each curriculum and allows you to add your own.',
      },
      {
        heading: 'Using Errors During Sessions',
        text: 'When planning a session, select anticipated errors from the bank. During the session, these will appear as quick checkboxes for efficient tracking.',
      },
      {
        heading: 'Saving New Errors',
        text: 'When you encounter a new error during a session, save it to the bank with the correction protocol that worked. This builds your personal library of effective strategies.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: <FileText className="w-5 h-5" />,
    content: [
      {
        heading: 'Session Reports',
        text: 'Generate session summary reports showing total sessions, average OTRs, error frequency, and exit ticket performance over a date range.',
      },
      {
        heading: 'Student Progress Reports',
        text: 'Track individual student progress including PM scores over time, participation rates, and common errors. Perfect for parent conferences or team meetings.',
      },
      {
        heading: 'Group Performance Reports',
        text: 'See how your entire group is performing with aggregate metrics, attendance rates, and progress trends. Identify students who may need additional support.',
      },
      {
        heading: 'Exporting Data',
        text: 'All reports can be exported to CSV format for use in spreadsheets or sharing with colleagues. Click the Export button on any report page.',
      },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: <HelpCircle className="w-5 h-5" />,
    content: [
      {
        heading: 'How do I import students?',
        text: 'Go to the Students page and click "Import Students". Download the CSV template, fill it with your student data, and upload. The system will validate and import the students.',
      },
      {
        heading: 'Can I use EMERGE offline?',
        text: 'Currently, EMERGE requires an internet connection. We are working on offline support for future releases.',
      },
      {
        heading: 'How do I change my password?',
        text: 'Go to Settings and look for the Profile section. Click "Change Password" to update your credentials.',
      },
      {
        heading: 'How do I delete a group?',
        text: 'Open the group detail page and click the trash icon. You will be asked to confirm by typing the group name. Note: This will also remove associated sessions.',
      },
      {
        heading: 'Can multiple interventionists share data?',
        text: 'Currently, EMERGE is designed for individual interventionists. Multi-user collaboration features are planned for a future update.',
      },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');
  const { startTour } = useHelpStore();

  const filteredSections = searchQuery
    ? helpSections.filter(
        (section) =>
          section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.content.some(
            (item) =>
              item.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.text.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : helpSections;

  const currentSection = helpSections.find((s) => s.id === activeSection);

  return (
    <AppLayout>
      <div className="min-h-screen bg-foundation">
        {/* Header */}
        <div className="bg-surface border-b border-text-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-movement/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-movement" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Help Center</h1>
                  <p className="text-sm text-text-secondary">
                    Learn how to use EMERGE effectively
                  </p>
                </div>
              </div>
              <Button variant="primary" onClick={startTour}>
                <PlayCircle className="w-4 h-4 mr-2" />
                Take the Tour
              </Button>
            </div>

            {/* Search */}
            <div className="mt-6 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Table of Contents */}
            <div className="lg:w-64 flex-shrink-0">
              <Card className="p-4 sticky top-4">
                <h2 className="text-sm font-semibold text-text-primary mb-3">Contents</h2>
                <nav className="space-y-1">
                  {helpSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-movement/10 text-movement font-medium'
                          : 'text-text-secondary hover:bg-text-muted/10 hover:text-text-primary'
                      }`}
                    >
                      {section.icon}
                      {section.title}
                    </button>
                  ))}
                </nav>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {searchQuery ? (
                // Search Results
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Search Results for &quot;{searchQuery}&quot;
                  </h2>
                  {filteredSections.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">
                        No results found
                      </h3>
                      <p className="text-text-secondary">
                        Try different keywords or browse the topics below.
                      </p>
                    </Card>
                  ) : (
                    filteredSections.map((section) => (
                      <Card key={section.id} className="p-6">
                        <button
                          onClick={() => {
                            setActiveSection(section.id);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-2 text-lg font-semibold text-text-primary hover:text-movement mb-4"
                        >
                          {section.icon}
                          {section.title}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="space-y-4">
                          {section.content
                            .filter(
                              (item) =>
                                item.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.text.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((item, index) => (
                              <div key={index}>
                                <h4 className="font-medium text-text-primary">{item.heading}</h4>
                                <p className="text-sm text-text-secondary mt-1">{item.text}</p>
                              </div>
                            ))}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ) : currentSection ? (
                // Current Section Content
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-movement/10 rounded-lg text-movement">
                      {currentSection.icon}
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">{currentSection.title}</h2>
                  </div>
                  <div className="space-y-6">
                    {currentSection.content.map((item, index) => (
                      <div key={index}>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                          {item.heading}
                        </h3>
                        <p className="text-text-secondary leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
