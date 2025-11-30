import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoSubjects = [
  {
    name: 'Programming',
    topics: [
      'Java Fundamentals',
      'Python Basics',
      'JavaScript ES6+',
      'Data Structures',
      'Algorithms',
      'Object-Oriented Programming',
      'Functional Programming'
    ]
  },
  {
    name: 'Web Development',
    topics: [
      'HTML5 & CSS3',
      'React.js',
      'Node.js',
      'Express.js',
      'REST APIs',
      'Web Security',
      'Responsive Design'
    ]
  },
  {
    name: 'Database',
    topics: [
      'SQL Queries',
      'Database Design',
      'NoSQL Databases',
      'Indexing & Optimization',
      'Transactions',
      'Data Modeling',
      'ORM Concepts'
    ]
  },
  {
    name: 'System Design',
    topics: [
      'Microservices Architecture',
      'Distributed Systems',
      'Load Balancing',
      'Caching Strategies',
      'API Design',
      'Scalability Patterns',
      'Cloud Infrastructure'
    ]
  },
  {
    name: 'Aptitude',
    topics: [
      'Quantitative Reasoning',
      'Logical Reasoning',
      'Verbal Ability',
      'Data Interpretation',
      'Problem Solving',
      'Critical Thinking',
      'Numerical Analysis'
    ]
  }
];

async function seedDemoData() {
  try {
    console.log('🌱 Seeding demo subjects and topics...');

    for (const subjectData of demoSubjects) {
      // Create or update subject
      const subject = await prisma.questionSubject.upsert({
        where: { name: subjectData.name },
        update: {},
        create: { name: subjectData.name }
      });

      console.log(`✅ Subject: ${subject.name}`);

      // Create topics for this subject
      for (const topicName of subjectData.topics) {
        const topic = await prisma.questionTopic.upsert({
          where: {
            name_subjectId: {
              name: topicName,
              subjectId: subject.sys_id
            }
          },
          update: {},
          create: {
            name: topicName,
            subjectId: subject.sys_id
          }
        });

        console.log(`   📚 Topic: ${topic.name}`);
      }
    }

    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\n📊 Summary of seeded data:');
    
    const subjectsCount = await prisma.questionSubject.count();
    const topicsCount = await prisma.questionTopic.count();
    
    console.log(`   • Subjects: ${subjectsCount}`);
    console.log(`   • Topics: ${topicsCount}`);

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDemoData()
  .then(() => console.log('\n🚀 Seed script execution completed!'))
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  });