import React from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';

export const metadata = {
  title: 'Admin Control Center | TESTPREP',
  description: 'Manage subject-wise MCQs, question bank bulk import/export, and leaderboard moderation.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
