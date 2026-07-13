const DEFAULT_THUMBNAILS = {
  python: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  webdev: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=80',
  cpp: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80',
  java: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  dsa: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80',
  ml: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
  ai: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
  uiux: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=800&q=80',
  cloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  cyber: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
};

export const seedCourses = [
  {
    code: 'PY-101',
    courseName: 'Python Programming Masterclass',
    description: 'Learn Python programming from scratch. Cover lists, dictionaries, files, functions, OOP, and write real scripts.',
    instructor: 'Dr. Sarah Jenkins',
    duration: '14h 30m',
    lessonsCount: 4,
    thumbnailUrl: DEFAULT_THUMBNAILS.python,
    category: 'Development'
  },
  {
    code: 'WD-102',
    courseName: 'Full-Stack Web Development',
    description: 'Master HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, and build premium full-stack responsive web applications.',
    instructor: 'Alex Rivera',
    duration: '28h 15m',
    lessonsCount: 4,
    thumbnailUrl: DEFAULT_THUMBNAILS.webdev,
    category: 'Development'
  },
  {
    code: 'CPP-103',
    courseName: 'C++ Systems Programming',
    description: 'Dive deep into system-level programming with modern C++. Understand memory management, pointers, and STL.',
    instructor: 'Prof. Marcus Vance',
    duration: '18h 45m',
    lessonsCount: 3,
    thumbnailUrl: DEFAULT_THUMBNAILS.cpp,
    category: 'Computer Science'
  },
  {
    code: 'JV-104',
    courseName: 'Java Enterprise Edition',
    description: 'Understand OOP, multithreading, collections, Java Spring Boot framework, and microservices architecture.',
    instructor: 'Elena Rostova',
    duration: '22h 10m',
    lessonsCount: 3,
    thumbnailUrl: DEFAULT_THUMBNAILS.java,
    category: 'Development'
  },
  {
    code: 'DSA-105',
    courseName: 'Data Structures & Algorithms',
    description: 'Ace your technical interviews. Master trees, graphs, sorting, searching, recursion, and dynamic programming.',
    instructor: 'Rohan Sharma',
    duration: '25h 00m',
    lessonsCount: 3,
    thumbnailUrl: DEFAULT_THUMBNAILS.dsa,
    category: 'Computer Science'
  },
  {
    code: 'ML-106',
    courseName: 'Machine Learning A-Z',
    description: 'Implement regression, classification, clustering, random forests, and neural networks using Scikit-Learn and Pandas.',
    instructor: 'Dr. Clara Thorne',
    duration: '20h 30m',
    lessonsCount: 3,
    thumbnailUrl: DEFAULT_THUMBNAILS.ml,
    category: 'Data Science'
  },
  {
    code: 'AI-107',
    courseName: 'Artificial Intelligence Foundations',
    description: 'Learn prompt engineering, generative AI, LLM fine-tuning, neural networks, and building AI agents.',
    instructor: 'David Kester',
    duration: '12h 15m',
    lessonsCount: 3,
    thumbnailUrl: DEFAULT_THUMBNAILS.ai,
    category: 'Data Science'
  },
  {
    code: 'UIUX-108',
    courseName: 'Modern UI/UX Design BootCamp',
    description: 'Design beautiful, user-centered wireframes and prototypes in Figma. Master typography, layout, and UX research.',
    instructor: 'Mia Henderson',
    duration: '10h 45m',
    lessonsCount: 3,
    thumbnailUrl: DEFAULT_THUMBNAILS.uiux,
    category: 'Design'
  },
  {
    code: 'CC-109',
    courseName: 'Cloud Computing with AWS',
    description: 'Deploy scaleable services on Amazon Web Services. Master EC2, S3, RDS, Lambda, VPC, and cloud security.',
    instructor: 'James Patterson',
    duration: '15h 20m',
    lessonsCount: 3,
    thumbnailUrl: DEFAULT_THUMBNAILS.cloud,
    category: 'IT & Cloud'
  },
  {
    code: 'CS-110',
    courseName: 'Cyber Security & Ethical Hacking',
    description: 'Protect systems against cyber hazards. Learn network penetration, cryptography, malware analysis, and risk mitigation.',
    instructor: 'Vikram Singh',
    duration: '17h 50m',
    lessonsCount: 3,
    thumbnailUrl: DEFAULT_THUMBNAILS.cyber,
    category: 'IT & Cloud'
  }
];

export const seedLectures = [
  { courseCode: 'PY-101', lectureNumber: 1, title: 'Introduction to Python & Workspace Setup', duration: '15:20', description: 'Install Python, select an IDE (VS Code), and run your first print program.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Python Programming Masterclass' },
  { courseCode: 'PY-101', lectureNumber: 2, title: 'Variables, Expressions, and Types', duration: '22:45', description: 'Understand integer, float, string types, and operations on variables.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Python Programming Masterclass' },
  { courseCode: 'PY-101', lectureNumber: 3, title: 'Control Structures & Conditional Statements', duration: '18:10', description: 'Learn logic branching using if-else structures and basic loops (for, while).', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Python Programming Masterclass' },
  { courseCode: 'PY-101', lectureNumber: 4, title: 'Functions, Arguments, and Return Values', duration: '25:30', description: 'Write modular, clean, and reusable functions with position and keyword arguments.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Python Programming Masterclass' },

  { courseCode: 'WD-102', lectureNumber: 1, title: 'HTML5 Semantic Structure & Elements', duration: '18:40', description: 'Learn elements, headers, forms, sections, and writing valid semantic layouts.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Full-Stack Web Development' },
  { courseCode: 'WD-102', lectureNumber: 2, title: 'CSS3 Flexbox and CSS Grid layouts', duration: '29:15', description: 'Master flex direction, grid template columns, gaps, alignment, and responsiveness.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Full-Stack Web Development' },
  { courseCode: 'WD-102', lectureNumber: 3, title: 'JavaScript Dom Manipulation & Events', duration: '35:20', description: 'Query elements, attach click event handlers, and update styles on the fly.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Full-Stack Web Development' },
  { courseCode: 'WD-102', lectureNumber: 4, title: 'React Hooks: useState and useEffect', duration: '41:10', description: 'Create dynamic interfaces with component states and fetch API data.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Full-Stack Web Development' },

  { courseCode: 'CPP-103', lectureNumber: 1, title: 'C++ Syntax & Compile Lifecycle', duration: '20:10', description: 'Set up g++ compiler and run your first console C++ compilation.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'C++ Systems Programming' },
  { courseCode: 'CPP-103', lectureNumber: 2, title: 'Pointers & Memory Addresses', duration: '28:50', description: 'Master references, pointer variables, memory addresses, and dereferencing.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'C++ Systems Programming' },
  { courseCode: 'CPP-103', lectureNumber: 3, title: 'Standard Template Library (STL)', duration: '32:15', description: 'Utilize vector, map, set, and standard algorithms in C++ templates.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'C++ Systems Programming' },

  { courseCode: 'JV-104', lectureNumber: 1, title: 'Java Virtual Machine (JVM) & JDK Architecture', duration: '18:50', description: 'Explore compile vs interpret, bytecode, JIT compilation, and classpath configurations.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Java Enterprise Edition' },
  { courseCode: 'JV-104', lectureNumber: 2, title: 'Object-Oriented Programming: Inheritance & Polymorphism', duration: '31:40', description: 'Design inheritance trees, method overriding, overloading, and abstract classes.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Java Enterprise Edition' },
  { courseCode: 'JV-104', lectureNumber: 3, title: 'Spring Boot REST Controller & API Endpoints', duration: '44:20', description: 'Build enterprise-grade microservice endpoints with @RestController and @GetMapping.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Java Enterprise Edition' },

  { courseCode: 'DSA-105', lectureNumber: 1, title: 'Big O Notation & Complexity Analysis', duration: '22:15', description: 'Analyze time and space complexity of iterations, nested loops, and recursion.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Data Structures & Algorithms' },
  { courseCode: 'DSA-105', lectureNumber: 2, title: 'Binary Search Tree & Traversal Algorithms', duration: '38:40', description: 'Build a BST, and perform In-order, Pre-order, and Post-order depth searches.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Data Structures & Algorithms' },
  { courseCode: 'DSA-105', lectureNumber: 3, title: 'Dynamic Programming: Memoization & Tabulation', duration: '49:10', description: 'Solve classic optimization problems like Fibonacci and 0/1 Knapsack with DP.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Data Structures & Algorithms' },

  { courseCode: 'ML-106', lectureNumber: 1, title: 'Supervised Learning: Linear Regression', duration: '25:10', description: 'Learn math models behind ordinary least squares and fit a scatter plot line.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Machine Learning A-Z' },
  { courseCode: 'ML-106', lectureNumber: 2, title: 'Decision Trees & Random Forests', duration: '35:40', description: 'Explore entropy, information gain, tree pruning, and ensemble voting methods.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Machine Learning A-Z' },
  { courseCode: 'ML-106', lectureNumber: 3, title: 'Hyperparameter Tuning & Cross Validation', duration: '30:20', description: 'Utilize GridSearchCV to optimize learning parameters and evaluate models.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Machine Learning A-Z' },

  { courseCode: 'AI-107', lectureNumber: 1, title: 'Neural Networks & Feedforward Architecture', duration: '28:10', description: 'Understand weights, biases, and activation functions like ReLU and Sigmoid.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Artificial Intelligence Foundations' },
  { courseCode: 'AI-107', lectureNumber: 2, title: 'Prompt Engineering & System Prompts', duration: '19:40', description: 'Master zero-shot, few-shot prompts, and setting boundaries for LLMs.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Artificial Intelligence Foundations' },
  { courseCode: 'AI-107', lectureNumber: 3, title: 'Retrieval Augmented Generation (RAG) Systems', duration: '36:15', description: 'Inject context databases into standard LLMs using vector databases like Chroma.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Artificial Intelligence Foundations' },

  { courseCode: 'UIUX-108', lectureNumber: 1, title: 'Typography and Color Psychology', duration: '18:50', description: 'Establish typographic scales, color contrast grids, and emotional brand connections.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Modern UI/UX Design BootCamp' },
  { courseCode: 'UIUX-108', lectureNumber: 2, title: 'Auto Layout and Component Variants in Figma', duration: '32:30', description: 'Construct flexible cards and button groups that morph according to text length.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Modern UI/UX Design BootCamp' },
  { courseCode: 'UIUX-108', lectureNumber: 3, title: 'High-Fidelity Interactive Prototyping', duration: '28:40', description: 'Configure state triggers, delays, smart animations, and interactive drawer overlays.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Modern UI/UX Design BootCamp' },

  { courseCode: 'CC-109', lectureNumber: 1, title: 'AWS Global Infrastructure: Regions & AZs', duration: '20:10', description: 'Learn difference between Availability Zones, Edge locations, and global data routing.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Cloud Computing with AWS' },
  { courseCode: 'CC-109', lectureNumber: 2, title: 'EC2 Virtual Machine Setup & Security Groups', duration: '26:50', description: 'Configure security firewalls, ssh key pairs, and host a web application on EC2.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Cloud Computing with AWS' },
  { courseCode: 'CC-109', lectureNumber: 3, title: 'Serverless Deployment with AWS Lambda', duration: '28:30', description: 'Write Javascript microservices and run them code-only without servers using API Gateway.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Cloud Computing with AWS' },

  { courseCode: 'CS-110', lectureNumber: 1, title: 'Introduction to Ethical Hacking & Kali Linux', duration: '24:10', description: 'Understand legal aspects of penetration testing, port configurations, and VM setups.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Cyber Security & Ethical Hacking' },
  { courseCode: 'CS-110', lectureNumber: 2, title: 'Network Scans with Nmap & Port Security', duration: '31:20', description: 'Discover open listening ports, service versions, OS signatures, and vulnerability scans.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: '', courseTitle: 'Cyber Security & Ethical Hacking' },
  { courseCode: 'CS-110', lectureNumber: 3, title: 'SQL Injection: Finding & Exploiting Database Gaps', duration: '36:40', description: 'Investigate dynamic queries, sanitizing inputs, and testing form parameters.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', thumbnailUrl: '', courseTitle: 'Cyber Security & Ethical Hacking' }
];

export const seedQuizzes = [
  {
    courseCode: 'PY-101',
    quizTitle: 'Python Essentials Assessment',
    description: 'Test your understanding of basic Python variables, types, and loops.',
    timer: 120, // seconds
    marks: 40,
    questions: [
      { questionText: 'What is the correct file extension for Python scripts?', options: ['.pyt', '.py', '.pyc', '.pyw'], correctAnswer: 1, marks: 10 },
      { questionText: 'Which of the following is not a mutable type in Python?', options: ['List', 'Dictionary', 'Tuple', 'Set'], correctAnswer: 2, marks: 10 },
      { questionText: 'How do you initialize a comment in Python?', options: ['// comment', '/* comment */', '# comment', '<!-- comment -->'], correctAnswer: 2, marks: 10 },
      { questionText: 'What does print(type(23.4)) display?', options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'double'>"], correctAnswer: 1, marks: 10 }
    ]
  },
  {
    courseCode: 'WD-102',
    quizTitle: 'Web Dev & React Basics Quiz',
    description: 'Verify your core knowledge of flexbox, DOM events, and React state hooks.',
    timer: 180, // seconds
    marks: 30,
    questions: [
      { questionText: 'Which HTML5 element represents self-contained compositions like blogs or articles?', options: ['<section>', '<article>', '<div>', '<aside>'], correctAnswer: 1, marks: 10 },
      { questionText: 'Which CSS flexbox property changes the direction of alignment axes?', options: ['justify-content', 'align-items', 'flex-direction', 'align-content'], correctAnswer: 2, marks: 10 },
      { questionText: 'In React, which hook is primarily used for handling side effects like API requests?', options: ['useState', 'useMemo', 'useRef', 'useEffect'], correctAnswer: 3, marks: 10 }
    ]
  }
];

export const seedCodingChallenges = [
  { courseCode: 'PY-101', title: 'Two Sum (Python)', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/two-sum/', description: 'Find if two numbers in a list sum to target.', tags: 'Arrays, Hash Table' },
  { courseCode: 'PY-101', title: 'Reverse Integer', difficulty: 'Medium', leetcodeUrl: 'https://leetcode.com/problems/reverse-integer/', description: 'Reverse digits of a signed 32-bit integer.', tags: 'Math' },
  { courseCode: 'WD-102', title: 'Fibonacci Number (JS)', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/fibonacci-number/', description: 'Return the N-th Fibonacci sequence number using Javascript.', tags: 'Math, DP' },
  { courseCode: 'WD-102', title: 'Valid Parentheses', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/', description: 'Determine if input string parentheses are valid.', tags: 'Stack, String' },
  { courseCode: 'CPP-103', title: 'Merge Sorted Array', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/merge-sorted-array/', description: 'Merge two sorted arrays in C++.', tags: 'Arrays, Two Pointers' },
  { courseCode: 'JV-104', title: 'LRU Cache (Java)', difficulty: 'Hard', leetcodeUrl: 'https://leetcode.com/problems/lru-cache/', description: 'Design and implement a Least Recently Used (LRU) Cache in Java.', tags: 'Design, LinkedList' },
  { courseCode: 'DSA-105', title: 'Binary Tree Inorder Traversal', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/binary-tree-inorder-traversal/', description: 'Return inorder traversal of binary tree nodes.', tags: 'Tree, Recursion' },
  { courseCode: 'DSA-105', title: 'Climbing Stairs', difficulty: 'Easy', leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/', description: 'Find total distinct ways to reach top of a staircase.', tags: 'DP, Memoization' }
];

export { DEFAULT_THUMBNAILS };