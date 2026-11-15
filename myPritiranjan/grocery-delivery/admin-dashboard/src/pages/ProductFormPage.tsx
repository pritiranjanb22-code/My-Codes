import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import toast from 'react-hot-toast';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  categoryId: z.string().uuid('Please select a category'),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sellingPrice: z.number().positive('Price must be positive'),
  mrpPrice: z.number().positive().optional().nullable(),
  unit: z.string().min(1, 'Unit is required'),
  minOrderQuantity: z.number().positive().default(1),
  maxOrderQuantity: z.number().positive().optional().nullable(),
  stockQuantity: z.number().min(0).default(0),
  lowStockThreshold: z.number().positive().default(10),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  brand: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      minOrderQuantity: 1,
      lowStockThreshold: 10,
      isActive: true,
      isFeatured: false,
      stockQuantity: 0,
    },
  });

  const sellingPrice = watch('sellingPrice');
  const mrpPrice = watch('mrpPrice');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (error) {
        toast.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          const product = await api.getProductById(id!);
          reset({
            name: product.name,
            categoryId: product.categoryId,
            description: product.description || '',
            shortDescription: product.shortDescription || '',
            sellingPrice: product.sellingPrice,
            mrpPrice: product.mrpPrice,
            unit: product.unit,
            minOrderQuantity: product.minOrderQuantity,
            maxOrderQuantity: product.maxOrderQuantity,
            stockQuantity: product.stockQuantity,
            lowStockThreshold: product.lowStockThreshold,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            tags: product.tags || [],
            brand: product.brand || '',
            barcode: product.barcode || '',
          });
          
          if (product.imageUrl) {
            setImagePreview(product.imageUrl);
          }
        } catch (error) {
          toast.error('Failed to fetch product');
          navigate('/products');
        }
      };
      fetchProduct();
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
      formData.append('folder', 'products');
      
      const response = await api.uploadFile(file, 'products');
      setImagePreview(response.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
  };

  const onSubmit = async (data: ProductFormData) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'tags' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      if (imagePreview && !imagePreview.startsWith('http')) {
        // This would be a base64 or blob - in real app, upload first
      }

      if (isEditing) {
        await api.updateProduct(id!, formData);
        toast.success('Product updated successfully');
      } else {
        await api.createProduct(formData);
        toast.success('Product created successfully');
      }
      
      navigate('/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedDiscount = sellingPrice && mrpPrice && mrpPrice > sellingPrice
    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-gray-500 mt-1">{isEditing ? 'Update product details' : 'Create a new product for your store'}</p>
        </div>
        <button onClick={() => navigate('/products')} className="btn-outline">
          Back to Products
        </button>
      </div>

      {calculatedDiscount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            <strong>Auto-calculated Discount: {calculatedDiscount}%</strong> (MRP: {formatCurrency(mrpPrice!)} → Selling: {formatCurrency(sellingPrice!)})
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Product Name *</label>
              <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Enter product name" />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Category *</label>
              <select {...register('categoryId')} className={`input ${errors.categoryId ? 'input-error' : ''}`}>
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea {...register('description')} rows={3} className={`input ${errors.description ? 'input-error' : ''}`} placeholder="Product description" />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="label">Short Description</label>
              <textarea {...register('shortDescription')} rows={2} className={`input ${errors.shortDescription ? 'input-error' : ''}`} placeholder="Brief description for listings" />
              {errors.shortDescription && <p className="mt-1 text-sm text-red-500">{errors.shortDescription.message}</p>}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Selling Price (₹) *</label>
              <input type="number" step="0.01" min="0" {...register('sellingPrice', { valueAsNumber: true })} className={`input ${errors.sellingPrice ? 'input-error' : ''}`} placeholder="0.00" />
              {errors.sellingPrice && <p className="mt-1 text-sm text-red-500">{errors.sellingPrice.message}</p>}
            </div>
            <div>
              <label className="label">MRP Price (₹)</label>
              <input type="number" step="0.01" min="0" {...register('mrpPrice', { valueAsNumber: true })} className={`input ${errors.mrpPrice ? 'input-error' : ''}`} placeholder="0.00" />
              {errors.mrpPrice && <p className="mt-1 text-sm text-red-500">{errors.mrpPrice.message}</p>}
            </div>
            <div>
              <label className="label">Discount</label>
              <input type="text" value={calculatedDiscount > 0 ? `${calculatedDiscount}%` : 'Auto-calculated'} className="input bg-gray-50" readOnly />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Unit *</label>
              <select {...register('unit')} className="input">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="liter">liter</option>
                <option value="ml">ml</option>
                <option value="piece">piece</option>
                <option value="packet">packet</option>
                <option value="bottle">bottle</option>
                <option value="can">can</option>
                <option value="box">box</option>
                <option value="dozen">dozen</option>
              </select>
            </div>
            <div>
              <label className="label">Min Order Quantity *</label>
              <input type="number" step="0.01" min="0.01" {...register('minOrderQuantity', { valueAsNumber: true })} className="input" />
            </div>
            <div>
              <label className="label">Max Order Quantity</label>
              <input type="number" step="0.01" min="0.01" {...register('maxOrderQuantity', { valueAsNumber: true })} className="input" placeholder="Optional" />
            </div>
            <div>
              <label className="label">Stock Quantity *</label>
              <input type="number" step="0.01" min="0" {...register('stockQuantity', { valueAsNumber: true })} className="input" />
            </div>
            <div>
              <label className="label">Low Stock Threshold</label>
              <input type="number" step="1" min="1" {...register('lowStockThreshold', { valueAsNumber: true })} className="input" />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Image</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
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

        {/* Additional Details */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Brand</label>
              <input {...register('brand')} className="input" placeholder="Product brand" />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input {...register('barcode')} className="input" placeholder="Product barcode" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Tags (comma separated)</label>
              <input 
                {...register('tags', { 
                  setValueAs: (value) => value.split(',').map(t => t.trim()).filter(Boolean) 
                })} 
                className="input" 
                placeholder="organic, fresh, local" 
              />
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isFeatured')} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
              <span className="text-sm font-medium text-gray-700">Featured</span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/products')} className="btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              isEditing ? 'Update Product' : 'Create Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

import { formatCurrency, formatDate } from '../utils/helpers';