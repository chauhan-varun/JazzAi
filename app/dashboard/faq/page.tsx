'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { parseJsonSafely } from '@/lib/utils';

interface Faq {
    _id: string;
    question: string;
    answer: string;
    category: string | null;
    keywords: string;
    createdAt: Date;
    updatedAt: Date;
}

export default function FaqPage() {
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [filteredFaqs, setFilteredFaqs] = useState<Faq[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: '',
        keywords: '',
    });

    useEffect(() => {
        fetchFaqs();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = faqs.filter(
                (faq) =>
                    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (faq.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
            );
            setFilteredFaqs(filtered);
        } else {
            setFilteredFaqs(faqs);
        }
    }, [searchQuery, faqs]);

    const fetchFaqs = async () => {
        try {
            const response = await fetch('/api/faqs');
            if (response.ok) {
                const data = await response.json();
                setFaqs(data.faqs || []);
            }
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const keywordsArray = formData.keywords
            .split(',')
            .map((k) => k.trim())
            .filter((k) => k);

        const payload = {
            ...formData,
            keywords: keywordsArray,
            ...(editingFaq && { id: editingFaq._id }),
        };

        try {
            const response = await fetch('/api/faqs', {
                method: editingFaq ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                fetchFaqs();
                handleCloseDialog();
            }
        } catch (error) {
            console.error('Error saving FAQ:', error);
        }
    };

    const handleEdit = (faq: Faq) => {
        setEditingFaq(faq);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category || '',
            keywords: parseJsonSafely<string[]>(faq.keywords, []).join(', '),
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const response = await fetch(`/api/faqs?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchFaqs();
            }
        } catch (error) {
            console.error('Error deleting FAQ:', error);
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingFaq(null);
        setFormData({
            question: '',
            answer: '',
            category: '',
            keywords: '',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">FAQ Management</h1>
                    <p className="text-muted-foreground">Manage your knowledge base</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Add FAQ
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
                            <DialogDescription>
                                Create a new FAQ entry for Luna AI to use in responses
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="question">Question</Label>
                                    <Input
                                        id="question"
                                        placeholder="How do I reset my password?"
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="answer">Answer</Label>
                                    <Textarea
                                        id="answer"
                                        placeholder="To reset your password, click on..."
                                        value={formData.answer}
                                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                        required
                                        rows={6}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category (Optional)</Label>
                                    <Input
                                        id="category"
                                        placeholder="Account, Billing, Technical..."
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="keywords">Keywords (comma separated)</Label>
                                    <Input
                                        id="keywords"
                                        placeholder="password, reset, forgot, login..."
                                        value={formData.keywords}
                                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Add keywords to improve search matching
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                    {editingFaq ? 'Update' : 'Create'} FAQ
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <CardTitle>Knowledge Base</CardTitle>
                            <CardDescription>
                                {filteredFaqs.length} FAQ{filteredFaqs.length !== 1 ? 's' : ''} available
                            </CardDescription>
                        </div>
                        <div className="w-96">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search FAQs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">
                                {searchQuery ? 'No FAQs match your search' : 'No FAQs yet'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add your first FAQ
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30%]">Question</TableHead>
                                    <TableHead className="w-[40%]">Answer</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFaqs.map((faq) => (
                                    <TableRow key={faq._id}>
                                        <TableCell className="font-medium">{faq.question}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {faq.answer.length > 100
                                                ? `${faq.answer.substring(0, 100)}...`
                                                : faq.answer}
                                        </TableCell>
                                        <TableCell>
                                            {faq.category ? (
                                                <Badge variant="secondary">{faq.category}</Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(faq)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(faq._id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

