import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Assignments() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    subject: 'English',
    grade_level: 'Grade 10',
    word_target: 500,
    status: 'draft'
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setIsCreating(false);
      resetForm();
      toast.success('Assignment created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      setEditingId(null);
      resetForm();
      toast.success('Assignment updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      toast.success('Assignment deleted');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      prompt: '',
      subject: 'English',
      grade_level: 'Grade 10',
      word_target: 500,
      status: 'draft'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (assignment) => {
    setEditingId(assignment.id);
    setFormData({
      title: assignment.title,
      prompt: assignment.prompt,
      subject: assignment.subject,
      grade_level: assignment.grade_level,
      word_target: assignment.word_target,
      status: assignment.status
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Writing Assignments</h1>
            <p className="text-slate-600">Manage prompts for process-based assessment</p>
          </div>
          {!isCreating && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-slate-900 hover:bg-slate-800 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Assignment
            </Button>
          )}
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="mb-6 shadow-md border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg">
                {editingId ? 'Edit Assignment' : 'Create New Assignment'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., WWI Causes Analysis"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="prompt">Writing Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder="Enter the detailed writing prompt..."
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="TOK">Theory of Knowledge</SelectItem>
                        <SelectItem value="Extended Essay">Extended Essay</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="grade_level">Grade Level</Label>
                    <Select
                      value={formData.grade_level}
                      onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Grade 9">Grade 9</SelectItem>
                        <SelectItem value="Grade 10">Grade 10</SelectItem>
                        <SelectItem value="Grade 11">Grade 11</SelectItem>
                        <SelectItem value="Grade 12">Grade 12</SelectItem>
                        <SelectItem value="IB DP1">IB DP1</SelectItem>
                        <SelectItem value="IB DP2">IB DP2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="word_target">Target Word Count</Label>
                    <Input
                      id="word_target"
                      type="number"
                      value={formData.word_target}
                      onChange={(e) => setFormData({ ...formData, word_target: parseInt(e.target.value) })}
                      min="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Assignments List */}
        <div className="grid gap-4">
          {assignments.map(assignment => (
            <Card key={assignment.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {assignment.title}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assignment.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : assignment.status === 'draft'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-4 whitespace-pre-wrap line-clamp-3">
                      {assignment.prompt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{assignment.subject}</span>
                      <span>•</span>
                      <span>{assignment.grade_level}</span>
                      <span>•</span>
                      <span>{assignment.word_target} words</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(assignment)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this assignment?')) {
                          deleteMutation.mutate(assignment.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {assignments.length === 0 && !isCreating && (
            <div className="text-center py-12 text-slate-500">
              No assignments yet. Create your first assignment to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}