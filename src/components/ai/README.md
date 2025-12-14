# AI Components for EMERGE Intervention Planner

This directory contains AI-powered UI components that enhance the session planning and documentation workflow.

## Components

### 1. AIPanel (`ai-panel.tsx`)
Reusable wrapper components for AI features with consistent styling.

**Exports:**
- `AIPanel` - Container with purple/blue gradient border and AI badge
- `AILoading` - Loading state with animated spinner and sparkles
- `AIError` - Error display with retry functionality
- `AIBadge` - Small AI indicator badge

**Usage:**
```tsx
<AIPanel>
  <AILoading message="Generating suggestions..." />
</AIPanel>
```

### 2. AIErrorSuggestions (`ai-error-suggestions.tsx`)
AI-powered error pattern suggestions for session planning.

**Props:**
```tsx
{
  curriculum: Curriculum;
  position: CurriculumPosition;
  previousErrors?: string[];
  onAddError: (error: AnticipatedError) => void;
  onAddAllErrors: (errors: AnticipatedError[]) => void;
}
```

**Features:**
- Calls `/api/ai/suggest-errors` endpoint
- Parses AI response into structured error suggestions
- Shows error pattern, underlying gap, correction protocol, and correction prompts
- Individual "Add" buttons for each suggestion
- "Add All" button to add all suggestions at once
- Visual feedback for added errors
- Error handling with retry functionality

**User Flow:**
1. User clicks "Suggest Errors with AI" button (pre-session view)
2. AI analyzes curriculum and position
3. Displays 3-5 likely error patterns in a modal
4. User can add individual errors or all errors to anticipated errors list
5. Added errors appear in the Anticipated Errors section

### 3. AISessionSummary (`ai-session-summary.tsx`)
AI-generated professional session summaries for IEP documentation.

**Props:**
```tsx
{
  session: Session;
  groupName: string;
  onSaveToNotes: (summary: string) => void;
}
```

**Features:**
- Calls `/api/ai/session-summary` endpoint
- Generates IEP-ready professional summaries
- Editable summary with textarea
- Copy to clipboard functionality
- Save to session notes
- Displays session metadata (date, OTR, exit ticket)
- Only enabled when session has data to summarize

**User Flow:**
1. User clicks "Generate Summary" button (active session view)
2. AI analyzes session data and generates professional summary
3. Summary displayed in formatted text
4. User can:
   - Copy to clipboard
   - Edit the text
   - Save to session notes
5. Summary appends to existing notes with header

## Integration

The AI components are integrated into the session page:

**Pre-Session View:**
- AI Error Suggestions button appears in the Anticipated Errors card header
- Generated errors can be added to the anticipated errors list

**Active Session View:**
- AI Summary button appears in the header next to "Complete Session"
- Summary generation uses current session state data
- Generated summary can be saved to session notes

## Styling

All AI components use a consistent design language:
- Purple/blue gradient color scheme
- Sparkles icon for AI features
- Subtle borders and backgrounds
- Loading states with animated spinners
- Success feedback with checkmarks
- Error states with retry options

## API Integration

The components interact with existing API routes:
- `/api/ai/suggest-errors` - Error pattern suggestions
- `/api/ai/session-summary` - Session summary generation

Both endpoints handle:
- AI service availability checks
- Error handling
- Response formatting
- Usage tracking

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Loading and error states
- Clear visual feedback
- Disabled states when unavailable
