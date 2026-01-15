import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, X, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageCourses() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subject: 'English',
    grade_level: 'Grade 10',
    teacher_name: '',
    teacher_email: '',
    description: '',
    color: 'blue',
    status: 'active'
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date')
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      setIsCreating(false);
      resetForm();
      toast.success('Course created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Course.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      setEditingId(null);
      resetForm();
      toast.success('Course updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Course.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course deleted');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      subject: 'English',
      grade_level: 'Grade 10',
      teacher_name: '',
      teacher_email: '',
      description: '',
      color: 'blue',
      status: 'active'
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

  const handleEdit = (course) => {
    setEditingId(course.id);
    setFormData({
      name: course.name,
      code: course.code || '',
      subject: course.subject,
      grade_level: course.grade_level,
      teacher_name: course.teacher_name || '',
      teacher_email: course.teacher_email || '',
      description: course.description || '',
      color: course.color || 'blue',
      status: course.status
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const getCourseAssignmentCount = (courseId) => {
    return assignments.filter(a => a.course_id === courseId).length;
  };

  const colorOptions = [
    { value: 'blue', label: 'Blue' },
    { value: 'emerald', label: 'Emerald' },
    { value: 'purple', label: 'Purple' },
    { value: 'amber', label: 'Amber' },
    { value: 'rose', label: 'Rose' },
    { value: 'indigo', label: 'Indigo' },
    { value: 'pink', label: 'Pink' },
    { value: 'slate', label: 'Slate' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Manage Courses</h1>
            <p className="text-slate-600">Organize assignments into courses for students</p>
          </div>
          {!isCreating && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-slate-900 hover:bg-slate-800 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Course
            </Button>
          )}
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="mb-6 shadow-md border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg">
                {editingId ? 'Edit Course' : 'Create New Course'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Course Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., IB English HL"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="code">Course Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., ENG-HL-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief course description..."
                    rows={3}
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
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Languages">Languages</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
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
                    <Label htmlFor="teacher_name">Teacher Name</Label>
                    <Input
                      id="teacher_name"
                      value={formData.teacher_name}
                      onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                      placeholder="Teacher's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="teacher_email">Teacher Email</Label>
                    <Input
                      id="teacher_email"
                      type="email"
                      value={formData.teacher_email}
                      onChange={(e) => setFormData({ ...formData, teacher_email: e.target.value })}
                      placeholder="teacher@school.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">Display Color</Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) => setFormData({ ...formData, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="active">Active</SelectItem>
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

        {/* Courses List */}
        <div className="grid gap-4">
          {courses.map(course => (
            <Card key={course.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-5 h-5 text-slate-600" />
                      <h3 className="text-xl font-semibold text-slate-900">
                        {course.name}
                      </h3>
                      {course.code && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {course.code}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        course.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                    {course.description && (
                      <p className="text-slate-600 mb-3">{course.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{course.subject}</span>
                      <span>•</span>
                      <span>{course.grade_level}</span>
                      {course.teacher_name && (
                        <>
                          <span>•</span>
                          <span>{course.teacher_name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-medium text-slate-700">
                        {getCourseAssignmentCount(course.id)} assignments
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(course)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this course? Assignments will remain but be unassigned.')) {
                          deleteMutation.mutate(course.id);
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

          {courses.length === 0 && !isCreating && (
            <div className="text-center py-12 text-slate-500">
              No courses yet. Create your first course to organize assignments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}