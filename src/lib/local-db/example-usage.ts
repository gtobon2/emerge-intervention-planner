/**
 * EMERGE Intervention Planner - Local Database Usage Examples
 *
 * This file demonstrates how to use the local database in your application.
 * You can delete this file - it's just for reference.
 */

// ============================================
// BASIC SETUP
// ============================================

// 1. Import the database and hooks
import { db } from '@/lib/local-db';
import {
  useLocalGroups,
  useLocalGroupWithStudents,
  createGroup,
  updateGroup,
  deleteGroup,
} from '@/lib/local-db/hooks';

// 2. Import seeding functions (for first-time setup)
import { seedIfEmpty, isDatabaseEmpty } from '@/lib/local-db/seed';

// 3. Import backup/restore functions
import { exportToFile, importFromFile, clearAllDataWithConfirmation } from '@/lib/local-db/backup';

// ============================================
// EXAMPLE 1: SEEDING ON FIRST RUN
// ============================================

// In your app initialization (e.g., _app.tsx or layout.tsx):
async function initializeDatabase() {
  const seeded = await seedIfEmpty();
  if (seeded) {
    console.log('Database seeded with demo data');
  }
}

// ============================================
// EXAMPLE 2: USING HOOKS IN COMPONENTS
// ============================================

// In a React component (.tsx file):
/*
function GroupsList() {
  const { groups, isLoading } = useLocalGroups();

  if (isLoading) {
    return <div>Loading groups...</div>;
  }

  return (
    <div>
      {groups.map((group) => (
        <div key={group.id}>
          <h3>{group.name}</h3>
          <p>Grade {group.grade}, Tier {group.tier}</p>
        </div>
      ))}
    </div>
  );
}
*/

// ============================================
// EXAMPLE 3: CREATING NEW RECORDS
// ============================================

async function handleCreateGroup() {
  const newGroupId = await createGroup({
    name: 'New Intervention Group',
    curriculum: 'wilson',
    tier: 2,
    grade: 3,
    current_position: { step: 1, substep: '1' },
    schedule: {
      days: ['monday', 'wednesday', 'friday'],
      time: '09:00',
      duration: 40,
    },
  });

  console.log('Created group with ID:', newGroupId);
}

// ============================================
// EXAMPLE 4: UPDATING RECORDS
// ============================================

async function handleUpdateGroup(groupId: number) {
  await updateGroup(groupId, {
    name: 'Updated Group Name',
    current_position: { step: 2, substep: '1' },
  });

  console.log('Group updated');
}

// ============================================
// EXAMPLE 5: DELETING RECORDS
// ============================================

async function handleDeleteGroup(groupId: number) {
  // Delete group and all related data (students, sessions, etc.)
  await deleteGroup(groupId, true);

  console.log('Group and related data deleted');
}

// ============================================
// EXAMPLE 6: QUERYING WITH RELATIONSHIPS
// ============================================

// In a React component (.tsx file):
/*
function GroupDetails({ groupId }: { groupId: number }) {
  const { group, isLoading } = useLocalGroupWithStudents(groupId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!group) {
    return <div>Group not found</div>;
  }

  return (
    <div>
      <h2>{group.name}</h2>
      <h3>Students ({group.students.length})</h3>
      <ul>
        {group.students.map((student) => (
          <li key={student.id}>{student.name}</li>
        ))}
      </ul>
    </div>
  );
}
*/

// ============================================
// EXAMPLE 7: BACKUP AND RESTORE
// ============================================

async function handleExportData() {
  await exportToFile(); // Downloads JSON file
  console.log('Data exported');
}

async function handleImportData(file: File) {
  const result = await importFromFile(file, {
    clearExisting: false,
    skipDuplicates: true,
    remapIds: true,
  });

  if (result.success) {
    console.log('Imported:', result.stats);
  } else {
    console.error('Import errors:', result.errors);
  }
}

async function handleClearAllData() {
  const cleared = await clearAllDataWithConfirmation();
  if (cleared) {
    console.log('All data cleared');
  }
}

// ============================================
// EXAMPLE 8: DIRECT DATABASE QUERIES
// ============================================

// You can also use Dexie directly for more complex queries:
async function customQuery() {
  // Get all Tier 3 groups
  const tier3Groups = await db.groups
    .where('tier')
    .equals(3)
    .toArray();

  // Get sessions for this week
  const today = new Date().toISOString().split('T')[0];
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const thisWeeksSessions = await db.sessions
    .where('date')
    .between(today, weekFromNow, true, true)
    .toArray();

  // Complex query with filter
  const recentWilsonSessions = await db.sessions
    .where('date')
    .above('2024-12-01')
    .filter(session => {
      // Note: You'd need to join with groups to check curriculum
      return session.status === 'completed';
    })
    .toArray();

  return {
    tier3Groups,
    thisWeeksSessions,
    recentWilsonSessions,
  };
}

// ============================================
// EXAMPLE 9: TRANSACTION EXAMPLE
// ============================================

async function moveStudentToNewGroup(studentId: number, newGroupId: number) {
  // Use transaction for data consistency
  await db.transaction('rw', [db.students, db.progressMonitoring], async () => {
    // Update student's group
    await db.students.update(studentId, { group_id: newGroupId });

    // Update all progress monitoring records
    await db.progressMonitoring
      .where('student_id')
      .equals(studentId)
      .modify({ group_id: newGroupId });
  });

  console.log('Student moved to new group');
}

// Export examples for reference
export {
  initializeDatabase,
  handleCreateGroup,
  handleUpdateGroup,
  handleDeleteGroup,
  handleExportData,
  handleImportData,
  handleClearAllData,
  customQuery,
  moveStudentToNewGroup,
};
