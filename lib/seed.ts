import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luna-ai';

async function seed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Clear existing data
    console.log('Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('customers').deleteMany({});
    await db.collection('messages').deleteMany({});
    await db.collection('faqs').deleteMany({});
    await db.collection('sessionStates').deleteMany({});

    // Create admin user
    console.log('Creating admin user...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await db.collection('users').insertOne({
      _id: new ObjectId().toString(),
      name: 'Admin User',
      email: 'admin@luna.ai',
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'offline',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create agent user
    console.log('Creating agent user...');
    const agentPasswordHash = await bcrypt.hash('password123', 10);
    await db.collection('users').insertOne({
      _id: new ObjectId().toString(),
      name: 'Agent Smith',
      email: 'agent@luna.ai',
      passwordHash: agentPasswordHash,
      role: 'agent',
      status: 'offline',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create sample FAQs
    console.log('Creating sample FAQs...');
    const faqs = [
      {
        _id: new ObjectId().toString(),
        question: 'How do I reset my password?',
        answer: 'To reset your password, click on the "Forgot Password" link on the login page. Enter your email address and we\'ll send you a reset link. Follow the instructions in the email to create a new password.',
        category: 'Account',
        keywords: JSON.stringify(['password', 'reset', 'forgot', 'login', 'access']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId().toString(),
        question: 'What are your business hours?',
        answer: 'Our customer support team is available Monday through Friday, 9 AM to 6 PM EST. We also offer 24/7 automated support through our AI assistant Luna!',
        category: 'General',
        keywords: JSON.stringify(['hours', 'business', 'support', 'time', 'available', 'open']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId().toString(),
        question: 'How do I upgrade my plan?',
        answer: 'You can upgrade your plan by going to Settings > Billing in your dashboard. Select the plan you want and follow the checkout process. Your upgrade will be effective immediately!',
        category: 'Billing',
        keywords: JSON.stringify(['upgrade', 'plan', 'billing', 'pricing', 'subscription', 'premium']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId().toString(),
        question: 'Is my data secure?',
        answer: 'Yes! We take security very seriously. All data is encrypted in transit and at rest. We use industry-standard encryption protocols and regularly audit our security practices. Your data is stored securely and never shared with third parties.',
        category: 'Security',
        keywords: JSON.stringify(['security', 'secure', 'data', 'privacy', 'encryption', 'safe']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId().toString(),
        question: 'Can I cancel my subscription?',
        answer: 'Yes, you can cancel your subscription at any time from Settings > Billing. When you cancel, you\'ll continue to have access until the end of your current billing period. No refunds for partial periods.',
        category: 'Billing',
        keywords: JSON.stringify(['cancel', 'subscription', 'unsubscribe', 'refund', 'billing']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId().toString(),
        question: 'How do I add team members?',
        answer: 'To add team members, go to Settings > Team and click "Invite Member". Enter their email address and select their role (Admin or Agent). They\'ll receive an invitation email to join your workspace.',
        category: 'Team',
        keywords: JSON.stringify(['team', 'members', 'invite', 'add', 'users', 'collaborate']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId().toString(),
        question: 'What integrations are available?',
        answer: 'Luna AI currently integrates with WhatsApp Business API, and we use Perplexity AI for intelligent responses. We\'re constantly adding new integrations - check our integrations page for the latest options!',
        category: 'Integrations',
        keywords: JSON.stringify(['integrations', 'whatsapp', 'api', 'connect', 'third-party']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId().toString(),
        question: 'How accurate is the AI?',
        answer: 'Luna AI uses advanced language models and your knowledge base to provide accurate responses. The accuracy depends on how well your FAQ is maintained. We recommend regularly updating your FAQs for best results. You can always step in with agent handoff when needed!',
        category: 'Technical',
        keywords: JSON.stringify(['ai', 'accuracy', 'accurate', 'quality', 'performance', 'how good']),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('faqs').insertMany(faqs);

    // Create sample customer
    console.log('Creating sample customer...');
    const customerId = new ObjectId().toString();
    await db.collection('customers').insertOne({
      _id: customerId,
      waId: '+1234567890',
      name: 'Demo Customer',
      lastSeenAt: new Date(),
      tags: JSON.stringify(['demo', 'test']),
      handoffAssignedTo: null,
      handoffActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create sample messages
    console.log('Creating sample messages...');
    await db.collection('messages').insertMany([
      {
        _id: new ObjectId().toString(),
        customerId,
        direction: 'in',
        channel: 'whatsapp',
        text: 'Hi! How do I reset my password?',
        meta: null,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        _id: new ObjectId().toString(),
        customerId,
        direction: 'out',
        channel: 'whatsapp',
        text: 'Hi there! 👋 To reset your password, just click on the "Forgot Password" link on the login page. Enter your email and we\'ll send you a reset link! 🔒 Follow the instructions in the email to create a new password. Does that help?',
        meta: null,
        createdAt: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
      },
    ]);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@luna.ai / admin123');
    console.log('Agent: agent@luna.ai / password123');
    console.log(`\n📊 Created ${faqs.length} FAQs, 1 customer, and 2 messages`);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();

