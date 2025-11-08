'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Clock } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { io, Socket } from 'socket.io-client';

interface Customer {
  _id: string;
  waId: string;
  name: string | null;
  lastSeenAt: Date | null;
  handoffActive: boolean;
  handoffAssignedTo: string | null;
}

interface Message {
  _id: string;
  direction: 'in' | 'out';
  text: string;
  createdAt: Date;
  meta?: string;
}

export default function InboxPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchMessages(selectedCustomer._id);
      
      if (socket) {
        socket.emit('customer:join', { waId: selectedCustomer.waId });
      }
    }
  }, [selectedCustomer, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSocket = () => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      path: '/api/socket',
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('message', (data: any) => {
      if (data.data) {
        const newMessage: Message = {
          _id: Math.random().toString(),
          direction: data.data.direction,
          text: data.data.text,
          createdAt: new Date(data.data.timestamp),
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    setSocket(newSocket);
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchMessages = async (customerId: string) => {
    try {
      const response = await fetch(`/api/messages/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedCustomer) return;

    try {
      const response = await fetch('/api/agent-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer._id,
          waId: selectedCustomer.waId,
          text: messageText,
        }),
      });

      if (response.ok) {
        setMessageText('');
        // Message will be added via socket
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleToggleHandoff = async () => {
    if (!selectedCustomer) return;

    const newHandoffState = !selectedCustomer.handoffActive;

    try {
      const response = await fetch('/api/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer._id,
          waId: selectedCustomer.waId,
          handoffActive: newHandoffState,
        }),
      });

      if (response.ok) {
        setSelectedCustomer({
          ...selectedCustomer,
          handoffActive: newHandoffState,
        });
        setCustomers(customers.map(c =>
          c._id === selectedCustomer._id ? { ...c, handoffActive: newHandoffState } : c
        ));
      }
    } catch (error) {
      console.error('Error toggling handoff:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">Manage customer conversations</p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* Customer List */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-18rem)]">
              {customers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-1">
                  {customers.map((customer) => (
                    <button
                      key={customer._id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                        selectedCustomer?._id === customer._id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {customer.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {customer.name || customer.waId}
                            </p>
                            {customer.handoffActive && (
                              <Badge variant="default" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {customer.lastSeenAt
                              ? formatDistance(new Date(customer.lastSeenAt), new Date(), {
                                  addSuffix: true,
                                })
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-5">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedCustomer?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {selectedCustomer?.name || selectedCustomer?.waId || 'Select a conversation'}
                  </CardTitle>
                  {selectedCustomer && (
                    <p className="text-xs text-muted-foreground">{selectedCustomer.waId}</p>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4 h-[calc(100vh-26rem)]">
              {!selectedCustomer ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a conversation to view messages
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex items-start gap-2 ${
                        message.direction === 'out' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          message.direction === 'out'
                            ? 'bg-purple-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        {message.direction === 'out' ? (
                          <Bot className="h-4 w-4 text-white" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[70%] ${
                          message.direction === 'out'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.direction === 'out'
                              ? 'text-purple-200'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatDistance(new Date(message.createdAt), new Date(), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            {selectedCustomer && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!selectedCustomer.handoffActive}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || !selectedCustomer.handoffActive}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!selectedCustomer.handoffActive && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Enable handoff to send messages
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Customer Info</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCustomer ? (
              <p className="text-sm text-muted-foreground">Select a conversation</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="text-sm font-medium">{selectedCustomer.name || 'Unknown'}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">WhatsApp ID</Label>
                  <p className="text-sm font-mono">{selectedCustomer.waId}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Last Seen</Label>
                  <p className="text-sm">
                    {selectedCustomer.lastSeenAt
                      ? formatDistance(new Date(selectedCustomer.lastSeenAt), new Date(), {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="handoff">Agent Handoff</Label>
                      <p className="text-xs text-muted-foreground">
                        {selectedCustomer.handoffActive
                          ? 'You are handling this chat'
                          : 'Bot is handling this chat'}
                      </p>
                    </div>
                    <Switch
                      id="handoff"
                      checked={selectedCustomer.handoffActive}
                      onCheckedChange={handleToggleHandoff}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Quick Actions</Label>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      View Full History
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Add Tags
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Export Conversation
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

