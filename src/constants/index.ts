export const SAMPLE_STUDY_PLANS = [
  {
    id: 1,
    first_name: "Sarah",
    profilePic: "https://randomuser.me/api/portraits/women/74.jpg",
    goal: "Pass Final Exam",
    subject: "Mathematics",
    study_days: 5,
    mastery_level: "Intermediate",
    assessment: {
      title: "Calculus & Linear Algebra",
      weekly_schedule: [
        { day: "Monday", focus: "Integration Techniques", duration: "60 min" },
        { day: "Tuesday", focus: "Matrix Operations", duration: "45 min" },
        { day: "Thursday", focus: "Practice Problems", duration: "90 min" },
        { day: "Friday", focus: "Past Paper Review", duration: "60 min" },
        { day: "Saturday", focus: "Weak Areas Drill", duration: "45 min" },
      ],
      description:
        "Structured review of calculus and linear algebra with spaced repetition across high-difficulty topics. Sessions are sequenced to build concept chains before tackling integration by parts and eigenvalue problems.",
    },
  },
  {
    id: 2,
    first_name: "Michael",
    profilePic: "https://randomuser.me/api/portraits/men/75.jpg",
    goal: "Ace Midterm",
    subject: "Computer Science",
    study_days: 4,
    mastery_level: "Advanced",
    assessment: {
      title: "Algorithms & Data Structures",
      weekly_schedule: [
        { day: "Monday", focus: "Graph Algorithms", duration: "75 min" },
        { day: "Wednesday", focus: "Dynamic Programming", duration: "90 min" },
        { day: "Friday", focus: "Complexity Analysis", duration: "60 min" },
        { day: "Sunday", focus: "Coding Practice", duration: "120 min" },
      ],
      description:
        "Deep dive into advanced algorithm design patterns, prioritising dynamic programming and graph traversal. LeetCode-style problem sets reinforce each concept immediately after theory sessions.",
    },
  },
  {
    id: 3,
    first_name: "Elena",
    profilePic: "https://randomuser.me/api/portraits/women/76.jpg",
    goal: "Score 80%+",
    subject: "Biology",
    study_days: 3,
    mastery_level: "Beginner",
    assessment: {
      title: "Cell Biology & Genetics",
      weekly_schedule: [
        { day: "Monday", focus: "Cell Structure", duration: "50 min" },
        { day: "Wednesday", focus: "Mendelian Genetics", duration: "60 min" },
        { day: "Saturday", focus: "Flashcard Review", duration: "45 min" },
      ],
      description:
        "Beginner-friendly plan that builds foundational understanding before moving to genetics. Active recall via flashcards is scheduled every session to reinforce terminology and diagrams.",
    },
  },
];
