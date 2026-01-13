const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

const configLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60 // Allow more requests for container script
});

// In-memory storage (replace with real database in production)
const database = {
  users: [
    {
      id: '1',
      email: 'admin@example.com',
      password: bcrypt.hashSync('admin123', 10), // Change in production
      role: 'admin'
    }
  ],
  containers: {},
  tags: {},
  triggers: {}
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============== AUTH ENDPOINTS ==============

// Login
app.post('/api/auth/login', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  
  const user = database.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});

// Register (optional - disable in production or add more security)
app.post('/api/auth/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const existingUser = database.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    role: 'user'
  };

  database.users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// ============== CONTAINER ENDPOINTS ==============

// Get container configuration (public endpoint for container.js)
app.get('/api/config/:containerId', configLimiter, (req, res) => {
  const { containerId } = req.params;
  
  const container = database.containers[containerId];
  if (!container || !container.enabled) {
    return res.status(404).json({ error: 'Container not found' });
  }

  // Get all enabled tags for this container
  const tags = Object.values(database.tags)
    .filter(tag => tag.containerId === containerId && tag.enabled)
    .map(tag => ({
      ...tag,
      triggers: tag.triggerIds.map(id => database.triggers[id]).filter(Boolean)
    }));

  res.json({
    containerId,
    name: container.name,
    tags,
    version: container.version,
    updatedAt: container.updatedAt
  });
});

// List all containers (protected)
app.get('/api/containers', authenticateToken, apiLimiter, (req, res) => {
  const containers = Object.values(database.containers)
    .filter(c => c.userId === req.user.id || req.user.role === 'admin')
    .map(c => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      enabled: c.enabled,
      version: c.version,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

  res.json(containers);
});

// Get single container (protected)
app.get('/api/containers/:id', authenticateToken, apiLimiter, (req, res) => {
  const container = database.containers[req.params.id];
  
  if (!container) {
    return res.status(404).json({ error: 'Container not found' });
  }

  if (container.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(container);
});

// Create container (protected)
app.post('/api/containers', authenticateToken, apiLimiter, [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('domain').optional().isURL()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, domain, description } = req.body;
  
  const containerId = 'CTM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  const container = {
    id: containerId,
    name,
    domain: domain || '',
    description: description || '',
    userId: req.user.id,
    enabled: true,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.containers[containerId] = container;

  res.status(201).json(container);
});

// Update container (protected)
app.put('/api/containers/:id', authenticateToken, apiLimiter, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('domain').optional().isURL(),
  body('enabled').optional().isBoolean()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const container = database.containers[req.params.id];
  
  if (!container) {
    return res.status(404).json({ error: 'Container not found' });
  }

  if (container.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { name, domain, description, enabled } = req.body;
  
  if (name) container.name = name;
  if (domain !== undefined) container.domain = domain;
  if (description !== undefined) container.description = description;
  if (enabled !== undefined) container.enabled = enabled;
  
  container.version += 1;
  container.updatedAt = new Date().toISOString();

  res.json(container);
});

// Delete container (protected)
app.delete('/api/containers/:id', authenticateToken, apiLimiter, (req, res) => {
  const container = database.containers[req.params.id];
  
  if (!container) {
    return res.status(404).json({ error: 'Container not found' });
  }

  if (container.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Delete associated tags and triggers
  Object.keys(database.tags).forEach(tagId => {
    if (database.tags[tagId].containerId === req.params.id) {
      delete database.tags[tagId];
    }
  });

  delete database.containers[req.params.id];

  res.status(204).send();
});

// ============== TAG ENDPOINTS ==============

// List tags for a container (protected)
app.get('/api/containers/:containerId/tags', authenticateToken, apiLimiter, (req, res) => {
  const container = database.containers[req.params.containerId];
  
  if (!container) {
    return res.status(404).json({ error: 'Container not found' });
  }

  if (container.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const tags = Object.values(database.tags)
    .filter(tag => tag.containerId === req.params.containerId)
    .map(tag => ({
      ...tag,
      triggers: tag.triggerIds.map(id => database.triggers[id]).filter(Boolean)
    }));

  res.json(tags);
});

// Create tag (protected)
app.post('/api/containers/:containerId/tags', authenticateToken, apiLimiter, [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('type').isIn(['html', 'script', 'image', 'custom']),
  body('enabled').optional().isBoolean()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const container = database.containers[req.params.containerId];
  
  if (!container) {
    return res.status(404).json({ error: 'Container not found' });
  }

  if (container.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { name, type, html, src, code, attributes, fireOnce, enabled } = req.body;
  
  const tagId = 'TAG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  const tag = {
    id: tagId,
    containerId: req.params.containerId,
    name,
    type,
    html: html || '',
    src: src || '',
    code: code || '',
    attributes: attributes || {},
    fireOnce: fireOnce !== false,
    enabled: enabled !== false,
    triggerIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.tags[tagId] = tag;
  
  // Increment container version
  container.version += 1;
  container.updatedAt = new Date().toISOString();

  res.status(201).json(tag);
});

// Update tag (protected)
app.put('/api/tags/:id', authenticateToken, apiLimiter, (req, res) => {
  const tag = database.tags[req.params.id];
  
  if (!tag) {
    return res.status(404).json({ error: 'Tag not found' });
  }

  const container = database.containers[tag.containerId];
  if (container.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { name, type, html, src, code, attributes, fireOnce, enabled } = req.body;
  
  if (name) tag.name = name;
  if (type) tag.type = type;
  if (html !== undefined) tag.html = html;
  if (src !== undefined) tag.src = src;
  if (code !== undefined) tag.code = code;
  if (attributes !== undefined) tag.attributes = attributes;
  if (fireOnce !== undefined) tag.fireOnce = fireOnce;
  if (enabled !== undefined) tag.enabled = enabled;
  
  tag.updatedAt = new Date().toISOString();
  
  // Increment container version
  container.version += 1;
  container.updatedAt = new Date().toISOString();

  res.json(tag);
});

// Delete tag (protected)
app.delete('/api/tags/:id', authenticateToken, apiLimiter, (req, res) => {
  const tag = database.tags[req.params.id];
  
  if (!tag) {
    return res.status(404).json({ error: 'Tag not found' });
  }

  const container = database.containers[tag.containerId];
  if (container.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Delete associated triggers
  tag.triggerIds.forEach(triggerId => {
    delete database.triggers[triggerId];
  });

  delete database.tags[req.params.id];
  
  // Increment container version
  container.version += 1;
  container.updatedAt = new Date().toISOString();

  res.status(204).send();
});

// ============== TRIGGER ENDPOINTS ==============

// Add trigger to tag (protected)
app.post('/api/tags/:tagId/triggers', authenticateToken, apiLimiter, [
  body('type').isIn(['pageview', 'dom_ready', 'window_load', 'custom_event', 'url_match', 'click', 'element_visibility'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const tag = database.tags[req.params.tagId];
  
  if (!tag) {
    return res.status(404).json({ error: 'Tag not found' });
  }

  const container = database.containers[tag.containerId];
  if (container.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { type, eventName, url, matchType, selector } = req.body;
  
  const triggerId = 'TRG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  const trigger = {
    id: triggerId,
    type,
    eventName: eventName || '',
    url: url || '',
    matchType: matchType || 'contains',
    selector: selector || '',
    createdAt: new Date().toISOString()
  };

  database.triggers[triggerId] = trigger;
  tag.triggerIds.push(triggerId);
  tag.updatedAt = new Date().toISOString();
  
  // Increment container version
  container.version += 1;
  container.updatedAt = new Date().toISOString();

  res.status(201).json(trigger);
});

// Delete trigger (protected)
app.delete('/api/triggers/:id', authenticateToken, apiLimiter, (req, res) => {
  const trigger = database.triggers[req.params.id];
  
  if (!trigger) {
    return res.status(404).json({ error: 'Trigger not found' });
  }

  // Find and update the parent tag
  const tag = Object.values(database.tags).find(t => t.triggerIds.includes(req.params.id));
  if (tag) {
    const container = database.containers[tag.containerId];
    if (container.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    tag.triggerIds = tag.triggerIds.filter(id => id !== req.params.id);
    tag.updatedAt = new Date().toISOString();
    
    // Increment container version
    container.version += 1;
    container.updatedAt = new Date().toISOString();
  }

  delete database.triggers[req.params.id];

  res.status(204).send();
});

// ============== ANALYTICS ENDPOINTS (Optional) ==============

// Track tag execution (can be called from container.js)
app.post('/api/analytics/track', configLimiter, (req, res) => {
  const { containerId, tagId, event, timestamp } = req.body;
  
  // Store analytics data (implement based on your needs)
  console.log('Analytics:', { containerId, tagId, event, timestamp });
  
  res.status(204).send();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Tag Management API running on port ${PORT}`);
  console.log(`Container script available at: http://localhost:${PORT}/container.js`);
});

module.exports = app;
