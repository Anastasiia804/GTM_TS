/**
 * MongoDB Database Implementation
 * Replace the in-memory storage in server.js with this implementation
 */

const mongoose = require('mongoose');

// ============== SCHEMAS ==============

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ContainerSchema = new mongoose.Schema({
  containerId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  domain: { type: String },
  description: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enabled: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TriggerSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['pageview', 'dom_ready', 'window_load', 'custom_event', 'url_match', 'click', 'element_visibility']
  },
  eventName: { type: String },
  url: { type: String },
  matchType: { type: String, enum: ['contains', 'equals', 'regex'] },
  selector: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const TagSchema = new mongoose.Schema({
  tagId: { type: String, required: true, unique: true, index: true },
  containerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['html', 'script', 'image', 'custom']
  },
  html: { type: String },
  src: { type: String },
  code: { type: String },
  attributes: { type: Map, of: String },
  fireOnce: { type: Boolean, default: true },
  enabled: { type: Boolean, default: true },
  triggers: [TriggerSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Analytics Schema (optional)
const AnalyticsSchema = new mongoose.Schema({
  containerId: { type: String, required: true, index: true },
  tagId: { type: String, required: true },
  event: { type: String, required: true },
  url: { type: String },
  userAgent: { type: String },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Create indexes for performance
TagSchema.index({ containerId: 1, enabled: 1 });
AnalyticsSchema.index({ containerId: 1, timestamp: -1 });
AnalyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

// ============== MODELS ==============

const User = mongoose.model('User', UserSchema);
const Container = mongoose.model('Container', ContainerSchema);
const Tag = mongoose.model('Tag', TagSchema);
const Analytics = mongoose.model('Analytics', AnalyticsSchema);

// ============== DATABASE CLASS ==============

class Database {
  constructor() {
    this.connected = false;
  }

  async connect(connectionString) {
    try {
      await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      this.connected = true;
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connected) {
      await mongoose.disconnect();
      this.connected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  // ============== USER METHODS ==============

  async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findUserByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  // ============== CONTAINER METHODS ==============

  async createContainer(containerData) {
    const container = new Container({
      ...containerData,
      containerId: 'CTM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    });
    return await container.save();
  }

  async findContainerById(containerId) {
    return await Container.findOne({ containerId });
  }

  async findContainersByUserId(userId) {
    return await Container.find({ userId }).sort({ createdAt: -1 });
  }

  async updateContainer(containerId, updates) {
    return await Container.findOneAndUpdate(
      { containerId },
      { 
        ...updates, 
        updatedAt: new Date(),
        $inc: { version: 1 }
      },
      { new: true }
    );
  }

  async deleteContainer(containerId) {
    // Delete all tags associated with this container
    await Tag.deleteMany({ containerId });
    return await Container.findOneAndDelete({ containerId });
  }

  // ============== TAG METHODS ==============

  async createTag(tagData) {
    const tag = new Tag({
      ...tagData,
      tagId: 'TAG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    });
    
    const saved = await tag.save();
    
    // Increment container version
    await Container.findOneAndUpdate(
      { containerId: tagData.containerId },
      { 
        updatedAt: new Date(),
        $inc: { version: 1 }
      }
    );
    
    return saved;
  }

  async findTagsByContainerId(containerId, enabledOnly = false) {
    const query = { containerId };
    if (enabledOnly) {
      query.enabled = true;
    }
    return await Tag.find(query).sort({ createdAt: -1 });
  }

  async findTagById(tagId) {
    return await Tag.findOne({ tagId });
  }

  async updateTag(tagId, updates) {
    const tag = await Tag.findOneAndUpdate(
      { tagId },
      { 
        ...updates, 
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (tag) {
      // Increment container version
      await Container.findOneAndUpdate(
        { containerId: tag.containerId },
        { 
          updatedAt: new Date(),
          $inc: { version: 1 }
        }
      );
    }
    
    return tag;
  }

  async deleteTag(tagId) {
    const tag = await Tag.findOneAndDelete({ tagId });
    
    if (tag) {
      // Increment container version
      await Container.findOneAndUpdate(
        { containerId: tag.containerId },
        { 
          updatedAt: new Date(),
          $inc: { version: 1 }
        }
      );
    }
    
    return tag;
  }

  // ============== TRIGGER METHODS ==============

  async addTrigger(tagId, triggerData) {
    const tag = await Tag.findOneAndUpdate(
      { tagId },
      { 
        $push: { triggers: triggerData },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (tag) {
      // Increment container version
      await Container.findOneAndUpdate(
        { containerId: tag.containerId },
        { 
          updatedAt: new Date(),
          $inc: { version: 1 }
        }
      );
    }
    
    return tag;
  }

  async removeTrigger(tagId, triggerId) {
    const tag = await Tag.findOneAndUpdate(
      { tagId },
      { 
        $pull: { triggers: { _id: triggerId } },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (tag) {
      // Increment container version
      await Container.findOneAndUpdate(
        { containerId: tag.containerId },
        { 
          updatedAt: new Date(),
          $inc: { version: 1 }
        }
      );
    }
    
    return tag;
  }

  // ============== ANALYTICS METHODS ==============

  async logAnalytics(analyticsData) {
    const analytics = new Analytics(analyticsData);
    return await analytics.save();
  }

  async getAnalytics(containerId, startDate, endDate) {
    const query = { containerId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    return await Analytics.find(query).sort({ timestamp: -1 }).limit(1000);
  }

  async getAnalyticsStats(containerId, startDate, endDate) {
    const matchStage = { containerId };
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = startDate;
      if (endDate) matchStage.timestamp.$lte = endDate;
    }

    return await Analytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            tagId: '$tagId',
            event: '$event'
          },
          count: { $sum: 1 },
          lastFired: { $max: '$timestamp' }
        }
      },
      {
        $group: {
          _id: '$_id.tagId',
          events: {
            $push: {
              event: '$_id.event',
              count: '$count',
              lastFired: '$lastFired'
            }
          },
          totalFires: { $sum: '$count' }
        }
      },
      { $sort: { totalFires: -1 } }
    ]);
  }

  // ============== CONTAINER CONFIG (for container.js) ==============

  async getContainerConfig(containerId) {
    const container = await Container.findOne({ 
      containerId, 
      enabled: true 
    });
    
    if (!container) {
      return null;
    }

    const tags = await Tag.find({ 
      containerId, 
      enabled: true 
    }).lean();

    return {
      containerId,
      name: container.name,
      tags: tags.map(tag => ({
        id: tag.tagId,
        name: tag.name,
        type: tag.type,
        html: tag.html,
        src: tag.src,
        code: tag.code,
        attributes: tag.attributes ? Object.fromEntries(tag.attributes) : {},
        fireOnce: tag.fireOnce,
        enabled: tag.enabled,
        triggers: tag.triggers
      })),
      version: container.version,
      updatedAt: container.updatedAt
    };
  }
}

// ============== USAGE EXAMPLE ==============

/*
// In your server.js, replace the in-memory database with:

const Database = require('./database-mongodb');
const db = new Database();

// Connect to database
db.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/tag-manager')
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });

// Update endpoints to use database methods:

// Example: Get container config
app.get('/api/config/:containerId', async (req, res) => {
  try {
    const config = await db.getContainerConfig(req.params.containerId);
    if (!config) {
      return res.status(404).json({ error: 'Container not found' });
    }
    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Example: Create container
app.post('/api/containers', authenticateToken, async (req, res) => {
  try {
    const container = await db.createContainer({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(container);
  } catch (error) {
    console.error('Error creating container:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
*/

module.exports = Database;
