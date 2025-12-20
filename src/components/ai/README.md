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

### 4. AIChat (`ai-chat.tsx`)
Conversational AI assistant for intervention support with built-in PII protection.

**Props:**
```tsx
{
  isOpen: boolean;
  onClose: () => void;
  students?: StudentContext[];  // Optional student context
  group?: GroupContext;         // Optional group context
  recentSessions?: SessionContext[];
}
```

**Features:**
- Full chat interface with conversation history
- **PII Masking**: Student names automatically replaced with anonymous IDs before sending to AI
- Privacy legend showing masked-to-real name mappings
- Context-aware responses based on student/group data
- Suggested prompts for common questions
- Calls `/api/ai/chat` endpoint

**Privacy Protection:**
The AIChat component uses the PII masking utilities from `@/lib/ai/pii-mask` to:
1. Replace student names with anonymous identifiers (e.g., "Maria" → "Student A1")
2. Mask names in user messages before sending to AI
3. Unmask AI responses to show real names to users
4. Display a privacy legend so users know the mapping

**Usage:**
```tsx
import { AIChat } from '@/components/ai';

function MyComponent() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button onClick={() => setShowChat(true)}>Open AI Chat</button>
      <AIChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        students={[{ id: '1', name: 'Maria', groupName: 'Reading Group A' }]}
        group={{ name: 'Reading Group A', curriculum: 'wilson', tier: 'tier2', grade: '3' }}
      />
    </>
  );
}
```

## PII Masking Utilities

Located in `@/lib/ai/pii-mask.ts`:

```tsx
import {
  createMaskingContext,
  maskStudent,
  maskTextContent,
  unmaskTextContent,
  createMaskingLegend,
} from '@/lib/ai/pii-mask';

// Create a context (one per conversation)
const context = createMaskingContext();

// Mask a student
const masked = maskStudent(context, 'student-123', 'Maria');
// Returns: { originalId: 'student-123', maskedId: 'student_1', maskedName: 'Student A1' }

// Mask text content
const maskedText = maskTextContent(context, 'Maria did well today', students);
// Returns: 'Student A1 did well today'

// Unmask AI response
const unmaskedText = unmaskTextContent(context, 'Student A1 needs more practice', students);
// Returns: 'Maria needs more practice'

// Get legend for display
const legend = createMaskingLegend(context, students);
// Returns: [{ maskedName: 'Student A1', originalName: 'Maria' }]
```

## Integration

### Global AI Chat Button

The AI Chat is accessible from any page via a floating button in the bottom-right corner. This is integrated in `AppLayout`:

```tsx
// src/components/layout/app-layout.tsx
<button
  onClick={() => setShowAIChat(true)}
  className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 ..."
>
  <Sparkles className="w-6 h-6" />
</button>

<AIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
```

### Page-Specific Context

When opening AIChat from a specific page (e.g., group detail), pass relevant context:

```tsx
<AIChat
  isOpen={showAIChat}
  onClose={() => setShowAIChat(false)}
  students={groupStudents}
  group={currentGroup}
  recentSessions={recentGroupSessions}
/>
```

## API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/ai/suggest-errors` | Error pattern suggestions |
| `/api/ai/session-summary` | Session summary generation |
| `/api/ai/chat` | Conversational chat with context |

All endpoints:
- Support both OpenAI and Anthropic providers
- Handle availability checks
- Return structured responses
- Track token usage

## Styling

All AI components use a consistent design language:
- Purple/blue gradient color scheme
- Sparkles icon for AI features
- Subtle borders and backgrounds
- Loading states with animated spinners
- Success feedback with checkmarks
- Error states with retry options

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Loading and error states
- Clear visual feedback
- Disabled states when unavailable
