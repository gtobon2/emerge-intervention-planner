'use client';

import { useState } from 'react';
import { TrendingUp, Plus, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent, Select } from '@/components/ui';

export default function ProgressPage() {
  const [selectedGroup, setSelectedGroup] = useState('');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Progress Monitoring</h1>
            <p className="text-text-muted">
              Track student progress and make data-based decisions
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Data Point
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
          <Filter className="w-4 h-4 text-text-muted" />
          <Select
            options={[
              { value: '', label: 'Select a group' },
              { value: 'wilson-a', label: 'Wilson Group A' },
              { value: 'wilson-b', label: 'Wilson Group B' },
              { value: 'delta-5a', label: 'Delta Math 5A' },
            ]}
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-64"
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-movement" />
                  Progress Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-text-muted">
                  {selectedGroup ? (
                    <div className="text-center">
                      <p className="mb-4">Recharts line graph will be displayed here.</p>
                      <p className="text-sm">
                        Features: Data points, goal line, trend line, phase change markers
                      </p>
                    </div>
                  ) : (
                    <p>Select a group to view progress data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Decision Rules */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Decision Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="font-medium text-green-400 mb-1">4+ points above goal</p>
                    <p className="text-text-muted">Consider raising the goal or advancing in curriculum</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="font-medium text-yellow-400 mb-1">Variable performance</p>
                    <p className="text-text-muted">Continue monitoring, maintain current intervention</p>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="font-medium text-red-400 mb-1">4+ points below goal</p>
                    <p className="text-text-muted">Consider adjusting intervention intensity or approach</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
