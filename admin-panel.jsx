import React, { useState, useEffect } from 'react';
import { 
  Settings, Plus, Trash2, Edit2, Eye, EyeOff, 
  Copy, AlertCircle, CheckCircle, Code, Save
} from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

export default function AdminPanel() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [tags, setTags] = useState([]);
  const [showLogin, setShowLogin] = useState(!token);
  const [notification, setNotification] = useState(null);
  
  // Forms
  const [showContainerForm, setShowContainerForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  useEffect(() => {
    if (token) {
      loadContainers();
    }
  }, [token]);

  useEffect(() => {
    if (selectedContainer) {
      loadTags(selectedContainer.id);
    }
  }, [selectedContainer]);

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });

      if (response.status === 401) {
        setToken('');
        localStorage.removeItem('token');
        setShowLogin(true);
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      notify(error.message, 'error');
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      setShowLogin(false);
      notify('Logged in successfully');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    setShowLogin(true);
    setContainers([]);
    setSelectedContainer(null);
    setTags([]);
  };

  const loadContainers = async () => {
    try {
      const data = await apiCall('/containers');
      setContainers(data);
    } catch (error) {
      console.error('Failed to load containers:', error);
    }
  };

  const loadTags = async (containerId) => {
    try {
      const data = await apiCall(`/containers/${containerId}/tags`);
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const createContainer = async (formData) => {
    try {
      const newContainer = await apiCall('/containers', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setContainers([...containers, newContainer]);
      setShowContainerForm(false);
      notify('Container created successfully');
    } catch (error) {
      console.error('Failed to create container:', error);
    }
  };

  const updateContainer = async (id, updates) => {
    try {
      const updated = await apiCall(`/containers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      setContainers(containers.map(c => c.id === id ? updated : c));
      if (selectedContainer?.id === id) {
        setSelectedContainer(updated);
      }
      notify('Container updated successfully');
    } catch (error) {
      console.error('Failed to update container:', error);
    }
  };

  const deleteContainer = async (id) => {
    if (!confirm('Are you sure you want to delete this container?')) return;
    
    try {
      await apiCall(`/containers/${id}`, { method: 'DELETE' });
      setContainers(containers.filter(c => c.id !== id));
      if (selectedContainer?.id === id) {
        setSelectedContainer(null);
        setTags([]);
      }
      notify('Container deleted successfully');
    } catch (error) {
      console.error('Failed to delete container:', error);
    }
  };

  const createTag = async (formData) => {
    try {
      const newTag = await apiCall(`/containers/${selectedContainer.id}/tags`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setTags([...tags, newTag]);
      setShowTagForm(false);
      notify('Tag created successfully');
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const updateTag = async (id, updates) => {
    try {
      const updated = await apiCall(`/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      setTags(tags.map(t => t.id === id ? updated : t));
      setEditingTag(null);
      notify('Tag updated successfully');
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };

  const deleteTag = async (id) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    
    try {
      await apiCall(`/tags/${id}`, { method: 'DELETE' });
      setTags(tags.filter(t => t.id !== id));
      notify('Tag deleted successfully');
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const addTrigger = async (tagId, triggerData) => {
    try {
      await apiCall(`/tags/${tagId}/triggers`, {
        method: 'POST',
        body: JSON.stringify(triggerData)
      });
      loadTags(selectedContainer.id);
      notify('Trigger added successfully');
    } catch (error) {
      console.error('Failed to add trigger:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    notify('Copied to clipboard');
  };

  if (showLogin) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Tag Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Containers List */}
          <div className="col-span-4 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Containers</h2>
              <button
                onClick={() => setShowContainerForm(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {containers.map(container => (
                <div
                  key={container.id}
                  onClick={() => setSelectedContainer(container)}
                  className={`p-3 rounded-lg cursor-pointer border-2 transition ${
                    selectedContainer?.id === container.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{container.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{container.id}</p>
                      {container.domain && (
                        <p className="text-xs text-gray-600 mt-1">{container.domain}</p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateContainer(container.id, { enabled: !container.enabled });
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {container.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteContainer(container.id);
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-8 space-y-6">
            {selectedContainer ? (
              <>
                {/* Container Code */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Installation Code</h2>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative font-mono text-sm">
                    <button
                      onClick={() => copyToClipboard(`<script src="${window.location.origin}/container.js?id=${selectedContainer.id}"></script>`)}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <code>
                      {`<script src="${window.location.origin}/container.js?id=${selectedContainer.id}"></script>`}
                    </code>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Add this code to the &lt;head&gt; section of your website
                  </p>
                </div>

                {/* Tags List */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Tags</h2>
                    <button
                      onClick={() => setShowTagForm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Tag</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tags.map(tag => (
                      <TagCard
                        key={tag.id}
                        tag={tag}
                        onEdit={() => setEditingTag(tag)}
                        onDelete={() => deleteTag(tag.id)}
                        onToggle={() => updateTag(tag.id, { enabled: !tag.enabled })}
                        onAddTrigger={(triggerData) => addTrigger(tag.id, triggerData)}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Container Selected</h3>
                <p className="text-gray-600">Select a container from the left or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showContainerForm && (
        <ContainerFormModal
          onClose={() => setShowContainerForm(false)}
          onSubmit={createContainer}
        />
      )}

      {showTagForm && (
        <TagFormModal
          onClose={() => setShowTagForm(false)}
          onSubmit={createTag}
        />
      )}

      {editingTag && (
        <TagFormModal
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onSubmit={(data) => updateTag(editingTag.id, data)}
        />
      )}
    </div>
  );
}

// Login Form Component
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Settings className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Tag Manager</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Default credentials: admin@example.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

// Container Form Modal
function ContainerFormModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Create Container</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Container Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <input
              type="url"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Tag Form Modal
function TagFormModal({ tag, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    type: tag?.type || 'script',
    html: tag?.html || '',
    src: tag?.src || '',
    code: tag?.code || '',
    fireOnce: tag?.fireOnce ?? true,
    enabled: tag?.enabled ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
        <h2 className="text-xl font-semibold mb-4">{tag ? 'Edit Tag' : 'Create Tag'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="script">Script</option>
              <option value="html">HTML</option>
              <option value="image">Image Pixel</option>
              <option value="custom">Custom JavaScript</option>
            </select>
          </div>

          {formData.type === 'script' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Script URL</label>
              <input
                type="url"
                value={formData.src}
                onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                placeholder="https://example.com/script.js"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {formData.type === 'html' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HTML Code</label>
              <textarea
                value={formData.html}
                onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows="6"
                placeholder="<div>Your HTML here</div>"
              />
            </div>
          )}

          {formData.type === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pixel URL</label>
              <input
                type="url"
                value={formData.src}
                onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                placeholder="https://example.com/pixel.gif"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {formData.type === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">JavaScript Code</label>
              <textarea
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows="8"
                placeholder="console.log('Custom code here');"
              />
            </div>
          )}

          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.fireOnce}
                onChange={(e) => setFormData({ ...formData, fireOnce: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Fire once per page</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enabled</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {tag ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Tag Card Component
function TagCard({ tag, onEdit, onDelete, onToggle, onAddTrigger }) {
  const [showTriggers, setShowTriggers] = useState(false);
  const [showAddTrigger, setShowAddTrigger] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{tag.name}</h3>
            <span className={`px-2 py-1 text-xs rounded ${
              tag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {tag.enabled ? 'Active' : 'Inactive'}
            </span>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              {tag.type}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{tag.id}</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {tag.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-1 text-blue-400 hover:text-blue-600"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <button
          onClick={() => setShowTriggers(!showTriggers)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showTriggers ? 'Hide' : 'Show'} Triggers ({tag.triggers?.length || 0})
        </button>
      </div>

      {showTriggers && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200">
          {tag.triggers && tag.triggers.length > 0 ? (
            <div className="space-y-2">
              {tag.triggers.map(trigger => (
                <div key={trigger.id} className="text-sm">
                  <span className="font-medium">{trigger.type}</span>
                  {trigger.eventName && <span className="text-gray-600"> - {trigger.eventName}</span>}
                  {trigger.url && <span className="text-gray-600"> - {trigger.url}</span>}
                  {trigger.selector && <span className="text-gray-600"> - {trigger.selector}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No triggers configured</p>
          )}
          
          <button
            onClick={() => setShowAddTrigger(true)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Trigger
          </button>
        </div>
      )}

      {showAddTrigger && (
        <TriggerFormModal
          onClose={() => setShowAddTrigger(false)}
          onSubmit={(data) => {
            onAddTrigger(data);
            setShowAddTrigger(false);
          }}
        />
      )}
    </div>
  );
}

// Trigger Form Modal
function TriggerFormModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: 'pageview',
    eventName: '',
    url: '',
    matchType: 'contains',
    selector: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Add Trigger</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="pageview">Page View</option>
              <option value="dom_ready">DOM Ready</option>
              <option value="window_load">Window Loaded</option>
              <option value="custom_event">Custom Event</option>
              <option value="url_match">URL Match</option>
              <option value="click">Click</option>
              <option value="element_visibility">Element Visibility</option>
            </select>
          </div>

          {formData.type === 'custom_event' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
              <input
                type="text"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                placeholder="purchase"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {formData.type === 'url_match' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Pattern *</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="/checkout"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
                <select
                  value={formData.matchType}
                  onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals</option>
                  <option value="regex">Regex</option>
                </select>
              </div>
            </>
          )}

          {(formData.type === 'click' || formData.type === 'element_visibility') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CSS Selector *</label>
              <input
                type="text"
                value={formData.selector}
                onChange={(e) => setFormData({ ...formData, selector: e.target.value })}
                placeholder=".buy-button"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Trigger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
