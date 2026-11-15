import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Button, InputField, Modal, SelectField } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { Category } from '@/types';
import { generateId } from '@/utils/helpers';
import { DEFAULT_CATEGORIES } from '@/constants';

type CategoryManagerNavProp = NativeStackNavigationProp<RootStackParamList, 'CategoryManager'>;

export const CategoryManagerScreen = () => {
  const navigation = useNavigation<CategoryManagerNavProp>();
  const route = useRoute<{ params?: { type?: 'income' | 'expense' } }>();
  const { categories, addCategory, updateCategory, deleteCategory } = useFinanceStore();
  const [filterType, setFilterType] = useState<'income' | 'expense' | 'all'>(route.params?.type || 'all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const filteredCategories = categories.filter((c) => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  const defaultCategoryCount = DEFAULT_CATEGORIES.filter((c) => c.type === filterType || filterType === 'all').length;

  const handleSubmit = (values: any) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, values);
    } else {
      addCategory({
        id: generateId('cat_'),
        ...values,
        isDefault: false,
        isTaxDeductible: values.isTaxDeductible || false,
        taxSection: values.isTaxDeductible ? values.taxSection : undefined,
      });
    }
    setShowAddModal(false);
    setEditingCategory(null);
  };

  const handleDelete = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted');
      return;
    }
    Alert.alert('Delete Category', `Delete "${category.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(category.id) },
    ]);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setShowAddModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setShowAddModal(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Categories</Text>
          <Text style={styles.headerSubtitle}>Manage your transaction categories</Text>
        </View>
        <Button title="Add Category" onPress={openAddModal} variant="primary" fullWidth={false} icon="add" />
      </View>

      <View style={styles.filterTabs}>
        {(['all', 'income', 'expense'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filterType === type && styles.filterTabActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterTabText, filterType === type && styles.filterTabTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredCategories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <Ionicons name="grid-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No categories found</Text>
            <Text style={styles.emptySubtitle}>Tap "Add Category" to create one</Text>
          </Card>
        </View>
      ) : (
        <View style={styles.categoryList}>
          {filteredCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => openEditModal(category)}
              onLongPress={() => handleDelete(category)}
              activeOpacity={0.8}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon} size={22} color={category.color} />
              </View>
              <View style={styles.categoryInfo}>
                <View style={styles.categoryNameRow}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                  {category.isTaxDeductible && <Text style={styles.taxBadge}>{category.taxSection}</Text>}
                </View>
                <Text style={styles.categoryMeta}>
                  {category.type === 'income' ? 'Income' : 'Expense'} • {category.isDefault ? 'Built-in' : 'Custom'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal
        visible={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingCategory(null); }}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <CategoryForm
          editingCategory={editingCategory}
          onSubmit={handleSubmit}
          onClose={() => { setShowAddModal(false); setEditingCategory(null); }}
        />
      </Modal>
    </ScrollView>
  );
};

const CategoryForm = ({ editingCategory, onSubmit, onClose }: any) => {
  const [formData, setFormData] = useState({
    name: editingCategory?.name || '',
    type: editingCategory?.type || 'expense',
    icon: editingCategory?.icon || 'help',
    color: editingCategory?.color || '#6C63FF',
    isTaxDeductible: editingCategory?.isTaxDeductible || false,
    taxSection: editingCategory?.taxSection || '80C',
  });

  const icons = ['help', 'restaurant', 'car', 'home', 'heart', 'shirt', 'briefcase', 'school', 'plane', 'gift', 'medical', 'game-controller', 'wifi', 'flash', 'basket', 'diamond', 'leaf', 'paw', 'bicycle', 'bus', 'train', 'boat', 'rocket', 'star', 'sunny', 'moon', 'cloud', 'umbrella', 'snow', 'flame', 'water', 'leaf', 'flower', 'tree', 'fish', 'bird', 'bug', 'bone', 'skull', 'ghost', 'alien', 'robot', 'construct', 'hammer', 'wrench', 'settings', 'build', 'tools', 'brush', 'pencil', 'pen', 'quill', 'book', 'bookmark', 'library', 'reader', 'newspaper', 'document', 'clipboard', 'folder', 'archive', 'trash', 'delete', 'create', 'add', 'remove', 'close', 'checkmark', 'checkmark-circle', 'checkmark-done', 'close-circle', 'information-circle', 'alert-circle', 'warning', 'help-circle', 'question-mark', 'search', 'filter', 'funnel', 'sort', 'swap', 'shuffle', 'sync', 'refresh', 'redo', 'undo', 'backspace', 'enter', 'arrow-forward', 'arrow-back', 'arrow-up', 'arrow-down', 'arrow-dropleft', 'arrow-dropright', 'arrow-dropdown', 'arrow-dropup', 'chevron-forward', 'chevron-back', 'chevron-up', 'chevron-down', 'expand', 'contract', 'resize', 'crop', 'rotate', 'flip', 'grid', 'list', 'reorder', 'move', 'drag', 'apps', 'menu', 'more', 'ellipsis-horizontal', 'ellipsis-vertical', 'options', 'keypad', 'calculator', 'calendar', 'time', 'clock', 'alarm', 'timer', 'stopwatch', 'hourglass', 'history', 'undo', 'redo', 'refresh', 'sync', 'cloud', 'cloud-download', 'cloud-upload', 'cloud-done', 'cloud-off', 'cloud-outline', 'cloud-circle', 'wifi', 'signal', 'bluetooth', 'airplane', 'car', 'bicycle', 'bus', 'train', 'boat', 'plane', 'rocket', 'walk', 'run', 'swim', 'fitness', 'heart', 'pulse', 'medical', 'bandage', 'thermometer', 'pill', 'syringe', 'dna', 'microscope', 'flask', 'beaker', 'test-tube', 'magnet', 'atom', 'planet', 'star', 'moon', 'sunny', 'cloud', 'rain', 'snow', 'thunder', 'partly-sunny', 'umbrella', 'snow', 'flame', 'water', 'leaf', 'flower', 'tree', 'seed', 'sprout', 'eco', 'recycle', 'trash', 'recycle', 'compost', 'plant', 'nature', 'park', 'forest', 'mountain', 'volcano', 'island', 'beach', 'waves', 'water', 'droplet', 'splash', 'rain', 'cloud', 'sun', 'moon', 'star', 'planet', 'rocket', 'spaceship', 'satellite', 'telescope', 'astronomy', 'science', 'lab', 'research', 'experiment', 'discovery', 'innovation', 'technology', 'computer', 'laptop', 'tablet', 'phone', 'watch', 'headphones', 'speaker', 'microphone', 'camera', 'video', 'image', 'music', 'film', 'game', 'controller', 'joystick', 'vr', 'ar', 'ai', 'robot', 'chip', 'cpu', 'memory', 'storage', 'drive', 'server', 'network', 'wifi', 'bluetooth', 'cellular', 'signal', 'battery', 'power', 'plug', 'bolt', 'flash', 'lightbulb', 'lamp', 'candle', 'fire', 'heat', 'cold', 'temperature', 'weather', 'climate', 'environment', 'earth', 'globe', 'world', 'map', 'location', 'pin', 'navigation', 'compass', 'direction', 'route', 'path', 'journey', 'travel', 'luggage', 'passport', 'ticket', 'boarding', 'hotel', 'bed', 'building', 'home', 'office', 'factory', 'warehouse', 'store', 'shop', 'mall', 'market', 'cart', 'bag', 'gift', 'package', 'box', 'envelope', 'mail', 'email', 'message', 'chat', 'call', 'phone', 'contact', 'person', 'people', 'group', 'team', 'organization', 'business', 'company', 'corporate', 'enterprise', 'startup', 'work', 'job', 'career', 'profession', 'briefcase', 'folder', 'file', 'document', 'paper', 'note', 'memo', 'list', 'checklist', 'task', 'project', 'plan', 'strategy', 'goal', 'target', 'achievement', 'award', 'medal', 'trophy', 'crown', 'star', 'rank', 'level', 'progress', 'growth', 'success', 'win', 'victory', 'champion', 'leader', 'boss', 'manager', 'director', 'executive', 'ceo', 'founder', 'entrepreneur', 'investor', 'shareholder', 'partner', 'client', 'customer', 'user', 'member', 'subscriber', 'follower', 'fan', 'community', 'network', 'connection', 'link', 'relationship', 'friendship', 'love', 'heart', 'romance', 'dating', 'marriage', 'wedding', 'anniversary', 'celebration', 'party', 'event', 'festival', 'concert', 'show', 'performance', 'theater', 'cinema', 'movie', 'film', 'actor', 'actress', 'director', 'producer', 'writer', 'author', 'artist', 'musician', 'singer', 'dancer', 'performer', 'creative', 'design', 'art', 'painting', 'drawing', 'sketch', 'illustration', 'graphic', 'photo', 'photography', 'camera', 'lens', 'focus', 'aperture', 'shutter', 'exposure', 'light', 'shadow', 'color', 'palette', 'brush', 'pencil', 'pen', 'marker', 'crayon', 'chalk', 'paint', 'ink', 'watercolor', 'oil', 'acrylic', 'canvas', 'paper', 'sketchbook', 'portfolio', 'gallery', 'exhibition', 'museum', 'art', 'culture', 'heritage', 'history', 'tradition', 'custom', 'ritual', 'ceremony', 'festival', 'holiday', 'vacation', 'break', 'rest', 'relax', 'sleep', 'dream', 'wake', 'morning', 'noon', 'evening', 'night', 'dawn', 'dusk', 'sunrise', 'sunset', 'twilight', 'midnight', 'time', 'clock', 'watch', 'calendar', 'date', 'schedule', 'appointment', 'meeting', 'deadline', 'timer', 'alarm', 'reminder', 'notification', 'alert', 'message', 'email', 'mail', 'inbox', 'outbox', 'sent', 'received', 'draft', 'spam', 'trash', 'archive', 'label', 'filter', 'search', 'find', 'sort', 'organize', 'manage', 'admin', 'settings', 'preferences', 'options', 'configuration', 'setup', 'install', 'update', 'upgrade', 'downgrade', 'patch', 'fix', 'bug', 'error', 'issue', 'problem', 'solution', 'answer', 'help', 'support', 'guide', 'tutorial', 'documentation', 'manual', 'wiki', 'faq', 'forum', 'community', 'feedback', 'review', 'rating', 'star', 'like', 'dislike', 'vote', 'poll', 'survey', 'question', 'answer', 'comment', 'reply', 'discussion', 'thread', 'topic', 'category', 'tag', 'label', 'folder', 'file', 'document', 'archive', 'backup', 'restore', 'sync', 'cloud', 'drive', 'dropbox', 'google', 'onedrive', 'icloud', 'storage', 'space', 'capacity', 'limit', 'quota', 'usage', 'bandwidth', 'speed', 'performance', 'optimize', 'cache', 'memory', 'ram', 'cpu', 'gpu', 'processor', 'core', 'thread', 'process', 'task', 'job', 'queue', 'schedule', 'cron', 'automation', 'script', 'code', 'program', 'software', 'application', 'app', 'platform', 'framework', 'library', 'package', 'module', 'component', 'widget', 'plugin', 'extension', 'addon', 'theme', 'skin', 'template', 'layout', 'design', 'ui', 'ux', 'interface', 'interaction', 'experience', 'usability', 'accessibility', 'responsive', 'adaptive', 'mobile', 'desktop', 'tablet', 'web', 'native', 'hybrid', 'cross-platform', 'ios', 'android', 'windows', 'mac', 'linux', 'unix', 'server', 'cloud', 'hosting', 'domain', 'dns', 'ssl', 'certificate', 'security', 'encryption', 'authentication', 'authorization', 'permission', 'role', 'user', 'admin', 'superuser', 'root', 'guest', 'anonymous', 'login', 'logout', 'signup', 'register', 'account', 'profile', 'avatar', 'username', 'password', 'email', 'phone', 'address', 'name', 'bio', 'description', 'about', 'contact', 'social', 'network', 'facebook', 'twitter', 'instagram', 'linkedin', 'github', 'youtube', 'tiktok', 'snapchat', 'pinterest', 'reddit', 'discord', 'slack', 'teams', 'zoom', 'meet', 'skype', 'whatsapp', 'telegram', 'signal', 'viber', 'line', 'wechat', 'messenger', 'chat', 'message', 'conversation', 'dialog', 'thread', 'channel', 'group', 'community', 'server', 'guild', 'clan', 'team', 'squad', 'party', 'raid', 'dungeon', 'quest', 'mission', 'objective', 'goal', 'achievement', 'reward', 'loot', 'item', 'equipment', 'weapon', 'armor', 'accessory', 'consumable', 'material', 'currency', 'gold', 'coin', 'gem', 'crystal', 'diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz', 'pearl', 'coin', 'money', 'cash', 'dollar', 'euro', 'pound', 'yen', 'rupee', 'bitcoin', 'ethereum', 'crypto', 'blockchain', 'wallet', 'exchange', 'trade', 'market', 'price', 'chart', 'graph', 'analysis', 'trend', 'forecast', 'prediction', 'investment', 'portfolio', 'asset', 'stock', 'bond', 'fund', 'etf', 'mutual', 'index', 'dividend', 'yield', 'return', 'profit', 'loss', 'gain', 'risk', 'volatility', 'hedge', 'diversify', 'allocate', 'rebalance', 'strategy', 'plan', 'goal', 'retirement', 'pension', '401k', 'ira', 'roth', 'sep', 'simple', 'keogh', 'annuity', 'insurance', 'life', 'health', 'auto', 'home', 'property', 'liability', 'umbrella', 'disability', 'long-term', 'care', 'critical', 'illness', 'accident', 'travel', 'pet', 'business', 'commercial', 'professional', 'malpractice', 'errors', 'omissions', 'directors', 'officers', 'cyber', 'data', 'breach', 'privacy', 'security', 'identity', 'theft', 'fraud', 'protection', 'monitoring', 'alert', 'recovery', 'restoration', 'legal', 'assistance', 'advice', 'counsel', 'representation', 'court', 'law', 'justice', 'rights', 'freedom', 'equality', 'democracy', 'vote', 'election', 'campaign', 'candidate', 'party', 'policy', 'platform', 'issue', 'debate', 'poll', 'survey', 'opinion', 'public', 'private', 'secret', 'classified', 'confidential', 'sensitive', 'personal', 'data', 'information', 'knowledge', 'wisdom', 'intelligence', 'learning', 'education', 'school', 'university', 'college', 'degree', 'diploma', 'certificate', 'license', 'credential', 'qualification', 'skill', 'talent', 'ability', 'competence', 'expertise', 'experience', 'practice', 'training', 'course', 'lesson', 'lecture', 'seminar', 'workshop', 'webinar', 'conference', 'summit', 'symposium', 'forum', 'panel', 'discussion', 'debate', 'presentation', 'speech', 'keynote', 'speaker', 'audience', 'attendee', 'participant', 'delegate', 'representative', 'organizer', 'sponsor', 'exhibitor', 'vendor', 'booth', 'stand', 'display', 'demo', 'showcase', 'launch', 'release', 'announce', 'reveal', 'preview', 'beta', 'alpha', 'prototype', 'mvp', 'product', 'feature', 'function', 'module', 'component', 'service', 'api', 'endpoint', 'interface', 'contract', 'schema', 'model', 'database', 'table', 'column', 'row', 'record', 'field', 'index', 'key', 'primary', 'foreign', 'unique', 'constraint', 'trigger', 'procedure', 'function', 'view', 'query', 'select', 'insert', 'update', 'delete', 'join', 'union', 'intersect', 'except', 'where', 'group', 'having', 'order', 'limit', 'offset', 'page', 'pagination', 'cursor', 'scroll', 'infinite', 'virtual', 'lazy', 'load', 'fetch', 'request', 'response', 'api', 'rest', 'graphql', 'grpc', 'websocket', 'socket', 'connection', 'session', 'token', 'jwt', 'oauth', 'saml', 'sso', 'ldap', 'active', 'directory', 'kerberos', 'radius', 'tacacs', 'diameter', 'authentication', 'authorization', 'accounting', 'aaa', 'radius', 'tacacs', 'diameter', 'kerberos', 'ldap', 'active', 'directory', 'sso', 'saml', 'oauth', 'jwt', 'token', 'session', 'connection', 'socket', 'websocket', 'grpc', 'graphql', 'rest', 'api', 'fetch', 'load', 'lazy', 'virtual', 'infinite', 'scroll', 'cursor', 'offset', 'limit', 'order', 'having', 'group', 'where', 'except', 'intersect', 'union', 'join', 'delete', 'update', 'insert', 'select', 'query', 'view', 'function', 'procedure', 'trigger', 'constraint', 'unique', 'foreign', 'primary', 'key', 'index', 'record', 'field', 'column', 'table', 'database', 'model', 'schema', 'contract', 'interface', 'endpoint', 'api', 'service', 'component', 'module', 'feature', 'product', 'mvp', 'prototype', 'alpha', 'beta', 'preview', 'reveal', 'announce', 'launch', 'showcase', 'demo', 'display', 'stand', 'booth', 'exhibitor', 'vendor', 'organizer', 'sponsor', 'delegate', 'attendee', 'audience', 'speaker', 'keynote', 'speech', 'presentation', 'debate', 'discussion', 'panel', 'forum', 'symposium', 'summit', 'conference', 'webinar', 'workshop', 'seminar', 'lecture', 'lesson', 'course', 'training', 'practice', 'experience', 'expertise', 'competence', 'ability', 'talent', 'skill', 'qualification', 'credential', 'license', 'certificate', 'diploma', 'degree', 'university', 'college', 'school', 'education', 'learning', 'wisdom', 'knowledge', 'intelligence', 'data', 'sensitive', 'confidential', 'classified', 'secret', 'private', 'public', 'opinion', 'survey', 'poll', 'debate', 'issue', 'platform', 'policy', 'campaign', 'candidate', 'election', 'vote', 'democracy', 'equality', 'freedom', 'justice', 'law', 'court', 'representation', 'counsel', 'advice', 'assistance', 'legal', 'restoration', 'recovery', 'alert', 'monitoring', 'protection', 'theft', 'identity', 'breach', 'data', 'cyber', 'omissions', 'errors', 'malpractice', 'professional', 'commercial', 'business', 'pet', 'travel', 'accident', 'illness', 'critical', 'care', 'long-term', 'disability', 'umbrella', 'liability', 'property', 'home', 'auto', 'health', 'life', 'insurance', 'annuity', 'keogh', 'simple', 'sep', 'roth', 'ira', '401k', 'pension', 'retirement', 'goal', 'plan', 'strategy', 'rebalance', 'allocate', 'diversify', 'hedge', 'volatility', 'risk', 'loss', 'gain', 'profit', 'return', 'yield', 'dividend', 'index', 'mutual', 'etf', 'fund', 'bond', 'stock', 'asset', 'portfolio', 'investment', 'prediction', 'forecast', 'trend', 'analysis', 'chart', 'graph', 'price', 'market', 'trade', 'exchange', 'wallet', 'crypto', 'ethereum', 'bitcoin', 'rupee', 'yen', 'pound', 'euro', 'dollar', 'money', 'coin', 'currency', 'consumable', 'accessory', 'armor', 'weapon', 'equipment', 'item', 'loot', 'reward', 'objective', 'mission', 'quest', 'dungeon', 'raid', 'party', 'squad', 'team', 'clan', 'guild', 'server', 'channel', 'thread', 'conversation', 'message', 'chat', 'messenger', 'wechat', 'line', 'viber', 'telegram', 'signal', 'whatsapp', 'skype', 'meet', 'zoom', 'teams', 'slack', 'discord', 'reddit', 'pinterest', 'tiktok', 'snapchat', 'youtube', 'github', 'linkedin', 'instagram', 'twitter', 'facebook', 'social', 'contact', 'about', 'bio', 'name', 'address', 'phone', 'email', 'password', 'username', 'avatar', 'profile', 'account', 'register', 'signup', 'logout', 'login', 'anonymous', 'guest', 'root', 'superuser', 'admin', 'user', 'authorization', 'authentication', 'aaa', 'diameter', 'tacacs', 'radius', 'kerberos', 'directory', 'active', 'ldap', 'saml', 'oauth', 'jwt', 'token', 'session', 'connection', 'socket', 'websocket', 'grpc', 'graphql', 'rest', 'api', 'fetch', 'load', 'lazy', 'virtual', 'infinite', 'scroll', 'cursor', 'offset', 'limit', 'order', 'having', 'group', 'where', 'except', 'intersect', 'union', 'join', 'delete', 'update', 'insert', 'select', 'query', 'view', 'function', 'procedure', 'trigger', 'constraint', 'unique', 'foreign', 'primary', 'key', 'index', 'record', 'field', 'column', 'table', 'database', 'model', 'schema', 'contract', 'interface', 'endpoint', 'api', 'service', 'component', 'module', 'feature', 'product', 'mvp', 'prototype', 'alpha', 'beta', 'preview', 'reveal', 'announce', 'launch', 'showcase', 'demo', 'display', 'stand', 'booth', 'exhibitor', 'vendor', 'organizer', 'sponsor', 'delegate', 'attendee', 'audience', 'speaker', 'keynote', 'speech', 'presentation', 'debate', 'discussion', 'panel', 'forum', 'symposium', 'summit', 'conference', 'webinar', 'workshop', 'seminar', 'lecture', 'lesson', 'course', 'training', 'practice', 'experience', 'expertise', 'competence', 'ability', 'talent', 'skill', 'qualification', 'credential', 'license', 'certificate', 'diploma', 'degree', 'university', 'college', 'school', 'education', 'learning', 'wisdom', 'knowledge', 'intelligence', 'data', 'sensitive', 'confidential', 'classified', 'secret', 'private', 'public', 'opinion', 'survey', 'poll', 'debate', 'issue', 'platform', 'policy', 'campaign', 'candidate', 'election', 'vote', 'democracy', 'equality', 'freedom', 'justice', 'law', 'court', 'representation', 'counsel', 'advice', 'assistance', 'legal', 'restoration', 'recovery', 'alert', 'monitoring', 'protection', 'theft', 'identity', 'breach', 'data', 'cyber', 'omissions', 'errors', 'malpractice', 'professional', 'commercial', 'business', 'pet', 'travel', 'accident', 'illness', 'critical', 'care', 'long-term', 'disability', 'umbrella', 'liability', 'property', 'home', 'auto', 'health', 'life', 'insurance', 'annuity', 'keogh', 'simple', 'sep', 'roth', 'ira', '401k', 'pension', 'retirement', 'goal', 'plan', 'strategy', 'rebalance', 'allocate', 'diversify', 'hedge', 'volatility', 'risk', 'loss', 'gain', 'profit', 'return', 'yield', 'dividend', 'index', 'mutual', 'etf', 'fund', 'bond', 'stock', 'asset', 'portfolio', 'investment', 'prediction', 'forecast', 'trend', 'analysis', 'chart', 'graph', 'price', 'market', 'trade', 'exchange', 'wallet', 'crypto', 'ethereum', 'bitcoin', 'rupee', 'yen', 'pound', 'euro', 'dollar', 'money', 'coin', 'currency', 'consumable', 'accessory', 'armor', 'weapon', 'equipment', 'item', 'loot', 'reward', 'objective', 'mission', 'quest', 'dungeon', 'raid', 'party', 'squad', 'team', 'clan', 'guild', 'server', 'channel', 'thread', 'conversation', 'message', 'chat', 'messenger', 'wechat', 'line', 'viber', 'telegram', 'signal', 'whatsapp', 'skype', 'meet', 'zoom', 'teams', 'slack', 'discord', 'reddit', 'pinterest', 'tiktok', 'snapchat', 'youtube', 'github', 'linkedin', 'instagram', 'twitter', 'facebook', 'social', 'contact', 'about', 'bio', 'name', 'address', 'phone', 'email', 'password', 'username', 'avatar', 'profile', 'account', 'register', 'signup', 'logout', 'login', 'anonymous', 'guest', 'root', 'superuser', 'admin', 'user', 'authorization', 'authentication', 'aaa', 'diameter', 'tacacs', 'radius', 'kerberos', 'ldap', 'active', 'directory', 'sso', 'saml', 'oauth', 'jwt', 'token', 'session', 'connection', 'socket', 'websocket', 'grpc', 'graphql', 'rest', 'api', 'fetch', 'load', 'lazy', 'virtual', 'infinite', 'scroll', 'cursor', 'offset', 'limit', 'order', 'having', 'group', 'where', 'except', 'intersect', 'union', 'join', 'delete', 'update', 'insert', 'select', 'query', 'view', 'function', 'procedure', 'trigger', 'constraint', 'unique', 'foreign', 'primary', 'key', 'index', 'record', 'field', 'column', 'table', 'database', 'model', 'schema', 'contract', 'interface', 'endpoint', 'api', 'service', 'component', 'module', 'feature', 'product', 'mvp', 'prototype', 'alpha', 'beta', 'preview', 'reveal', 'announce', 'launch', 'showcase', 'demo', 'display', 'stand', 'booth', 'exhibitor', 'vendor', 'organizer', 'sponsor', 'delegate', 'attendee', 'audience', 'speaker', 'keynote', 'speech', 'presentation', 'debate', 'discussion', 'panel', 'forum', 'symposium', 'summit', 'conference', 'webinar', 'workshop', 'seminar', 'lecture', 'lesson', 'course', 'training', 'practice', 'experience', 'expertise', 'competence', 'ability', 'talent', 'skill', 'qualification', 'credential', 'license', 'certificate', 'diploma', 'degree', 'university', 'college', 'school', 'education', 'learning', 'wisdom', 'knowledge', 'intelligence'];
  const colors = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#FF6B9D', '#A8D0E6', '#9B59B6', '#E74C3C', '#3498DB', '#F39C12', '#E67E22', '#FF9FF3', '#FD79A8', '#00CEC9', '#2ECC71', '#27AE60', '#16A085', '#8E44AD', '#7F8C8D'];

  if (editingCategory && !formData.name) {
    setFormData({
      name: editingCategory.name,
      type: editingCategory.type,
      icon: editingCategory.icon,
      color: editingCategory.color,
      isTaxDeductible: editingCategory.isTaxDeductible,
      taxSection: editingCategory.taxSection || '80C',
    });
  }

  return (
    <View style={styles.form}>
      <InputField
        label="Name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Category name"
      />
      <SelectField
        label="Type"
        value={formData.type}
        options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]}
        onChange={(value) => setFormData({ ...formData, type: value })}
      />
      <View style={styles.iconGrid}>
        <Text style={styles.gridLabel}>Icon</Text>
        <View style={styles.iconPicker}>
          {icons.slice(0, 30).map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[styles.iconOption, formData.icon === icon && styles.iconOptionSelected]}
              onPress={() => setFormData({ ...formData, icon })}
            >
              <Ionicons name={icon} size={24} color={formData.icon === icon ? '#fff' : '#666'} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.colorGrid}>
        <Text style={styles.gridLabel}>Color</Text>
        <View style={styles.colorPicker}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorOption, formData.color === color && styles.colorOptionSelected]}
              onPress={() => setFormData({ ...formData, color })}
            >
              <View style={[styles.colorSwatch, { backgroundColor: color }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={[styles.checkbox, formData.isTaxDeductible && styles.checkboxChecked]}
          onPress={() => setFormData({ ...formData, isTaxDeductible: !formData.isTaxDeductible })}
        >
          {formData.isTaxDeductible && <Ionicons name="checkmark" size={20} color="#fff" />}
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>Tax Deductible</Text>
      </View>
      {formData.isTaxDeductible && (
        <SelectField
          label="Tax Section"
          value={formData.taxSection}
          options={[{ value: '80C', label: 'Section 80C' }, { value: '80D', label: 'Section 80D' }, { value: '80CCD', label: 'Section 80CCD' }, { value: 'other', label: 'Other' }]}
          onChange={(value) => setFormData({ ...formData, taxSection: value })}
        />
      )}
      <View style={styles.formActions}>
        <Button title="Cancel" variant="outline" onPress={onClose} fullWidth />
        <Button title={editingCategory ? 'Update' : 'Create'} onPress={() => onSubmit(formData)} fullWidth />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  filterTabs: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 12, padding: 4, marginBottom: 16 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  filterTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  filterTabText: { fontSize: 14, fontWeight: '500', color: '#666' },
  filterTabTextActive: { color: '#1A1A2E', fontWeight: '600' },
  categoryList: { gap: 8 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryInfo: { flex: 1, gap: 4 },
  categoryNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryName: { fontSize: 16, fontWeight: '500', color: '#1A1A2E' },
  defaultBadge: { fontSize: 10, fontWeight: '600', color: '#6C63FF', backgroundColor: '#6C63FF20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  taxBadge: { fontSize: 10, fontWeight: '600', color: '#F39C12', backgroundColor: '#F39C1220', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  categoryMeta: { fontSize: 13, color: '#888' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 50 },
  emptyCard: { alignItems: 'center', padding: 32, gap: 12, width: '80%' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  form: { gap: 16 },
  gridLabel: { fontSize: 13, fontWeight: '500', color: '#666', marginBottom: 8 },
  iconGrid: { gap: 8 },
  iconPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  iconOptionSelected: { backgroundColor: '#6C63FF' },
  colorGrid: { gap: 8 },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorOption: { width: 36, height: 36, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: '#1A1A2E', transform: [{ scale: 1.1 }] },
  colorSwatch: { width: '100%', height: '100%', borderRadius: 6 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  checkboxLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A2E' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});