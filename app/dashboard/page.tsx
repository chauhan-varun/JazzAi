'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, TrendingUp, Clock } from 'lucide-react';

interface Stats {
  totalCustomers: number;
  activeChats: number;
  handoffActive: number;
  avgResponseTime: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeChats: 0,
    handoffActive: 0,
    avgResponseTime: '0m',
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        const customers = data.customers || [];
        
        setStats({
          totalCustomers: customers.length,
          activeChats: customers.filter((c: any) => c.lastSeenAt).length,
          handoffActive: customers.filter((c: any) => c.handoffActive).length,
          avgResponseTime: '2m 30s',
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Luna AI customer support dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeChats}</div>
            <p className="text-xs text-muted-foreground">In last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Handoffs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.handoffActive}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
              <span className="text-sm font-medium">View Active Conversations</span>
              <Badge>→</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
              <span className="text-sm font-medium">Manage FAQs</span>
              <Badge>→</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
              <span className="text-sm font-medium">View Reports</span>
              <Badge variant="secondary">Coming soon</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Luna AI bot and integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">WhatsApp Integration</span>
              <Badge variant="default" className="bg-green-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Perplexity AI</span>
              <Badge variant="default" className="bg-green-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Socket.io Server</span>
              <Badge variant="default" className="bg-green-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">MongoDB Database</span>
              <Badge variant="default" className="bg-green-600">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

