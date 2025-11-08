'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Key, Webhook, Zap, Database } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your Luna AI configuration</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="integrations">
                        <Zap className="h-4 w-4 mr-2" />
                        Integrations
                    </TabsTrigger>
                    <TabsTrigger value="database">
                        <Database className="h-4 w-4 mr-2" />
                        Database
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bot Configuration</CardTitle>
                            <CardDescription>Configure Luna AI bot behavior</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="botName">Bot Name</Label>
                                <Input id="botName" defaultValue="Luna AI" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="greetingMessage">Greeting Message</Label>
                                <Input
                                    id="greetingMessage"
                                    defaultValue="Hi! 👋 I'm Luna, your friendly support assistant. How can I help you today?"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="faqThreshold">FAQ Match Threshold</Label>
                                <Input id="faqThreshold" type="number" defaultValue="10" min="0" max="100" />
                                <p className="text-xs text-muted-foreground">
                                    Minimum score required for FAQ match (0-100)
                                </p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Auto-suggest Handoff</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Suggest connecting to agent when confidence is low
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Response Style</CardTitle>
                            <CardDescription>Customize bot response tone and style</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Use Emojis</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Include emojis in bot responses
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Casual Tone</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Use friendly, conversational language
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxResponseLength">Max Response Length (words)</Label>
                                <Input id="maxResponseLength" type="number" defaultValue="160" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>WhatsApp Cloud API</CardTitle>
                            <CardDescription>Configure WhatsApp Business API integration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                        <Webhook className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Connection Status</p>
                                        <p className="text-sm text-muted-foreground">Webhook active and receiving messages</p>
                                    </div>
                                </div>
                                <Badge className="bg-green-600">Connected</Badge>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whatsappToken">Access Token</Label>
                                <Input
                                    id="whatsappToken"
                                    type="password"
                                    defaultValue="••••••••••••••••"
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                                <Input
                                    id="phoneNumberId"
                                    defaultValue="123456789012345"
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="webhookUrl">Webhook URL</Label>
                                <Input
                                    id="webhookUrl"
                                    defaultValue={`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/whatsapp/webhook`}
                                    disabled
                                />
                            </div>

                            <Button variant="outline" className="w-full">
                                <Key className="mr-2 h-4 w-4" />
                                Update Credentials
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Perplexity AI</CardTitle>
                            <CardDescription>Configure AI model for response generation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium">API Status</p>
                                        <p className="text-sm text-muted-foreground">Model: llama-3.1-sonar-small-128k-online</p>
                                    </div>
                                </div>
                                <Badge className="bg-green-600">Active</Badge>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="perplexityKey">API Key</Label>
                                <Input
                                    id="perplexityKey"
                                    type="password"
                                    defaultValue="••••••••••••••••"
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="temperature">Temperature</Label>
                                <Input id="temperature" type="number" step="0.1" defaultValue="0.7" min="0" max="1" />
                                <p className="text-xs text-muted-foreground">
                                    Controls randomness. Lower = more focused, Higher = more creative
                                </p>
                            </div>

                            <Button variant="outline" className="w-full">
                                <Key className="mr-2 h-4 w-4" />
                                Update API Key
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="database" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>MongoDB Database</CardTitle>
                            <CardDescription>Database connection and statistics</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                        <Database className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Connection Status</p>
                                        <p className="text-sm text-muted-foreground">Connected to MongoDB Atlas</p>
                                    </div>
                                </div>
                                <Badge className="bg-green-600">Connected</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">Customers</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">Messages</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">FAQs</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">Agents</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Database URI</Label>
                                <Input type="password" defaultValue="mongodb://••••••••••" disabled />
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1">Test Connection</Button>
                                <Button variant="outline" className="flex-1">View Logs</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Data Management</CardTitle>
                            <CardDescription>Backup and maintenance operations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                                Export All Data
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                Import Data
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-destructive">
                                Clear All Data
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

