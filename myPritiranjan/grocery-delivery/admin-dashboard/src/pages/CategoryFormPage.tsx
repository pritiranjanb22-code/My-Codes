import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X, Tag, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { Category } from '../types';
import toast from 'react-hot-toast';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  displayOrder: z.number().int().min(0).default(0),
  parentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const ICONS = [
  'shopping-bag', 'utensils', 'wheat', 'fish', 'apple', 'carrot', 'bread', 'cheese',
  'milk', 'egg', 'meat', 'chicken', 'beef', 'pork', 'lamb', 'seafood',
  'soup', 'salad', 'pizza', 'burger', 'sandwich', 'pasta', 'rice', 'noodles',
  'coffee', 'tea', 'juice', 'water', 'soda', 'beer', 'wine', 'cocktail',
  'cake', 'cookie', 'ice-cream', 'chocolate', 'candy', 'snack', 'chips', 'nuts',
  'oil', 'vinegar', 'sauce', 'spice', 'herb', 'salt', 'pepper', 'sugar',
  'flour', 'bread', 'cereal', 'oats', 'granola', 'yogurt', 'butter', 'cream',
  'detergent', 'soap', 'shampoo', 'toothpaste', 'toilet-paper', 'tissue', 'cleaner', 'sponge',
  'battery', 'light-bulb', 'extension-cord', 'tape', 'glue', 'scissors', 'knife', 'fork',
];

export function CategoryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      displayOrder: 0,
      isActive: true,
      icon: 'tag',
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories(data.filter(c => !isEditing || c.id !== id));
      } catch (error) {
        toast.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, [isEditing, id]);

  useEffect(() => {
    if (isEditing) {
      const fetchCategory = async () => {
        try {
          const category = await api.getCategoryById(id!);
          reset({
            name: category.name,
            description: category.description || '',
            icon: category.icon || 'tag',
            displayOrder: category.displayOrder,
            parentId: category.parentId,
            isActive: category.isActive,
          });
          
          if (category.imageUrl) {
            setIconPreview(category.imageUrl);
          }
        } catch (error) {
          toast.error('Failed to fetch category');
          navigate('/categories');
        }
      };
      fetchCategory();
    }
  }, [id, navigate, reset]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'categories');
      
      const response = await api.uploadFile(file, 'categories');
      setIconPreview(response.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setIconPreview(null);
  };

  const onSubmit = async (data: CategoryFormData) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (isEditing) {
        await api.updateCategory(id!, formData);
        toast.success('Category updated successfully');
      } else {
        await api.createCategory(formData);
        toast.success('Category created successfully');
      }
      
      navigate('/categories');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/categories')} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Category' : 'Add New Category'}</h1>
            <p className="text-gray-500 mt-1">{isEditing ? 'Update category details' : 'Create a new product category'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="space-y-6">
            <div>
              <label className="label">Category Name *</label>
              <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Enter category name" />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>
            
            <div>
              <label className="label">Description</label>
              <textarea {...register('description')} rows={3} className={`input ${errors.description ? 'input-error' : ''}`} placeholder="Category description" />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <label className="label">Icon</label>
              <select {...register('icon')} className={`input ${errors.icon ? 'input-error' : ''}`}>
                {ICONS.map(icon => (
                  <option key={icon} value={icon}>{icon.replace('-', ' ')}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Select an icon that represents this category</p>
            </div>

            <div>
              <label className="label">Display Order</label>
              <input type="number" min="0" {...register('displayOrder', { valueAsNumber: true })} className={`input ${errors.displayOrder ? 'input-error' : ''}`} placeholder="0" />
              {errors.displayOrder && <p className="mt-1 text-sm text-red-500">{errors.displayOrder.message}</p>}
              <p className="mt-1 text-sm text-gray-500">Lower numbers appear first</p>
            </div>

            <div>
              <label className="label">Parent Category (Optional)</label>
              <select {...register('parentId')} className={`input ${errors.parentId ? 'input-error' : ''}`}>
                <option value="">No Parent (Top Level)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.parentId && <p className="mt-1 text-sm text-red-500">{errors.parentId.message}</p>}
              <p className="mt-1 text-sm text-gray-500">Create subcategories by selecting a parent</p>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Image</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50">
              {iconPreview ? (
                <>
                  <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Tag className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-sm">No image</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="btn-outline flex items-center gap-2 w-fit">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" disabled={uploading} />
                <label htmlFor="image-upload" className="cursor-pointer">Upload Image</label>
              </label>
              {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
              <p className="text-xs text-gray-500">Max 5MB • JPG, PNG, WebP</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/categories')} className="btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              isEditing ? 'Update Category' : 'Create Category'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}