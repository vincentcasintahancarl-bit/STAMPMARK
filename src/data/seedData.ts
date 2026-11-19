import {
  DiscussionPost,
  FriendRequest,
  FriendRequestStatus,
  GradeLevel,
  LessonUnit,
  MailReadMap,
  PostKind,
  SchoolClubMeta,
  SchoolEvent,
  SchoolEventCategory,
  SchoolMember,
  SubjectId,
  SubjectMeta,
  UserRole,
} from '../types/school';

export const HERO_BANNER_IMAGE = '/src/assets/images/hero_study_commons_1794823417579.jpg';
export const BIOLOGY_DIAGRAM_IMAGE = '/src/assets/images/lesson_biology_diagram_1794823418638.jpg';
export const PHYSICS_DIAGRAM_IMAGE = '/src/assets/images/lesson_physics_optics_1794823418640.jpg';

export const AVATAR_MAYA_IMAGE = '/src/assets/images/avatar_maya_lin_1794863578985.jpg';
export const AVATAR_RIVERA_IMAGE = '/src/assets/images/avatar_samuel_rivera_1794863579838.jpg';
export const AVATAR_JORDAN_IMAGE = '/src/assets/images/avatar_jordan_patel_1794863580581.jpg';
export const AVATAR_ELENA_IMAGE = '/src/assets/images/avatar_elena_brooks_1794863580256.jpg';

export const SCHOLAR_AVATAR_PRESETS: {
  id: string;
  label: string;
  url: string;
}[] = [
  { id: 'maya', label: 'Library Blazer', url: AVATAR_MAYA_IMAGE },
  { id: 'rivera', label: 'Study Hall Tweed', url: AVATAR_RIVERA_IMAGE },
  { id: 'jordan', label: 'Oak Library Knit', url: AVATAR_JORDAN_IMAGE },
  { id: 'elena', label: 'Stone Hall Cardigan', url: AVATAR_ELENA_IMAGE },
];

export const GRADE_LEVEL_OPTIONS: GradeLevel[] = [
  GradeLevel.GRADE_7,
  GradeLevel.GRADE_8,
  GradeLevel.GRADE_9,
  GradeLevel.GRADE_10,
  GradeLevel.GRADE_11,
  GradeLevel.GRADE_12,
];

export const SUBJECTS: SubjectMeta[] = [
  { id: SubjectId.MATHEMATICS, name: 'Mathematics', department: 'STEM' },
  { id: SubjectId.BIOLOGY, name: 'Biology', department: 'Life Sciences' },
  { id: SubjectId.PHYSICS, name: 'Physics', department: 'Physical Sciences' },
  { id: SubjectId.HISTORY, name: 'World History', department: 'Humanities' },
  { id: SubjectId.LITERATURE, name: 'Literature', department: 'Humanities' },
  { id: SubjectId.COMPUTER_SCIENCE, name: 'Computer Science', department: 'STEM' },
  { id: SubjectId.ICT, name: 'ICT', department: 'Technology & Computing' },
];

export const COURSE_TRACK_OPTIONS: string[] = [
  'STEM (Science, Technology, Engineering & Math)',
  'HUMSS (Humanities & Social Sciences)',
  'ABM (Accountancy, Business & Management)',
  'GAS (General Academic Strand)',
  'ICT (Information & Communications Technology)',
  'AP Honors Track',
  'Computer & Applied Sciences',
];

export const SCHOOL_CLUBS: SchoolClubMeta[] = [
  {
    id: 'science-olympiad',
    name: 'Science Olympiad',
    tagline: 'Experimental Lab & STEM Prep',
    crestTone: 'emerald',
  },
  {
    id: 'math-society',
    name: 'Mathematics Society',
    tagline: 'Proofs & Problem Solving',
    crestTone: 'navy',
  },
  {
    id: 'debate-guild',
    name: 'Debate & Rhetoric Guild',
    tagline: 'Parliamentary Debate & Logic',
    crestTone: 'crimson',
  },
  {
    id: 'robotics-club',
    name: 'Robotics & Coding Club',
    tagline: 'Algorithms & Hardware Builds',
    crestTone: 'indigo',
  },
  {
    id: 'literary-circle',
    name: 'Literary & Press Circle',
    tagline: 'School Gazette & Essays',
    crestTone: 'amber',
  },
  {
    id: 'eco-bio-club',
    name: 'Environmental & Bio Club',
    tagline: 'Field Ecology & Conservation',
    crestTone: 'teal',
  },
  {
    id: 'chess-society',
    name: 'Chess & Strategy Society',
    tagline: 'Tournament Tactics & Endgame',
    crestTone: 'plum',
  },
  {
    id: 'student-council',
    name: 'Student Council & Peer Mentors',
    tagline: 'Campus Leadership & Advisories',
    crestTone: 'gold',
  },
  {
    id: 'ict-club',
    name: 'ICT Club',
    tagline: 'Web Tech, Networking & Systems',
    crestTone: 'sky',
  },
];

export const TEACHER_MONITOR_MEMBER_ID = 'member-monitor';

export const TEACHER_MONITOR_DEMO_ACCOUNT = {
  email: 'teacher@school.edu',
  password: 'teacher123',
  memberId: TEACHER_MONITOR_MEMBER_ID,
  name: 'Prof. Evelyn Reyes',
};

export const INITIAL_MEMBERS: SchoolMember[] = [
  {
    id: 'member-maya',
    name: 'Maya Lin',
    username: 'maya.lin',
    avatarUrl: AVATAR_MAYA_IMAGE,
    role: UserRole.STUDENT,
    gradeOrDept: GradeLevel.GRADE_11,
    section: 'Section 11-Mendel',
    courseOrTrack: 'STEM (Science, Technology, Engineering & Math)',
    club: 'Science Olympiad',
    focusSubject: SubjectId.BIOLOGY,
    enrolledSubjects: [
      SubjectId.BIOLOGY,
      SubjectId.MATHEMATICS,
      SubjectId.PHYSICS,
      SubjectId.LITERATURE,
    ],
    bio: 'Grade 11 STEM student organizing visual study notes for cellular biology and calculus.',
  },
  {
    id: TEACHER_MONITOR_MEMBER_ID,
    name: 'Prof. Evelyn Reyes',
    username: 'prof.reyes',
    avatarUrl: AVATAR_ELENA_IMAGE,
    role: UserRole.TEACHER,
    gradeOrDept: 'Academic Monitor & Faculty',
    section: 'Faculty Monitor Desk',
    courseOrTrack: 'Academic Integrity & Classroom Safety',
    club: 'Student Council & Peer Mentors',
    monitoredClub: 'Student Council & Peer Mentors',
    focusSubject: SubjectId.MATHEMATICS,
    enrolledSubjects: [
      SubjectId.MATHEMATICS,
      SubjectId.COMPUTER_SCIENCE,
      SubjectId.ICT,
      SubjectId.PHYSICS,
    ],
    taughtSubjects: [
      SubjectId.MATHEMATICS,
      SubjectId.COMPUTER_SCIENCE,
      SubjectId.ICT,
      SubjectId.PHYSICS,
    ],
    bio: 'Lead Teacher Monitor overseeing classroom sharing, study messages, report reviews, and student conduct warnings.',
  },
  {
    id: 'member-rivera',
    name: 'Dr. Samuel Rivera',
    username: 'dr.rivera',
    avatarUrl: AVATAR_RIVERA_IMAGE,
    role: UserRole.TEACHER,
    gradeOrDept: 'Science Faculty',
    section: 'Lab Hall B · Advisories 11-12',
    courseOrTrack: 'AP Biology & Physics Faculty',
    club: 'Science Olympiad',
    monitoredClub: 'Science Olympiad',
    focusSubject: SubjectId.BIOLOGY,
    enrolledSubjects: [
      SubjectId.BIOLOGY,
      SubjectId.PHYSICS,
      SubjectId.MATHEMATICS,
    ],
    taughtSubjects: [
      SubjectId.BIOLOGY,
      SubjectId.PHYSICS,
      SubjectId.MATHEMATICS,
    ],
    bio: 'Life and Physical Sciences instructor holding weekly office hours on lab methodology.',
  },
  {
    id: 'member-jordan',
    name: 'Jordan Patel',
    username: 'jordan.patel',
    avatarUrl: AVATAR_JORDAN_IMAGE,
    role: UserRole.STUDY_LEAD,
    gradeOrDept: GradeLevel.GRADE_12,
    section: 'Section 12-Euler',
    courseOrTrack: 'STEM (Science, Technology, Engineering & Math)',
    club: 'Mathematics Society',
    focusSubject: SubjectId.MATHEMATICS,
    enrolledSubjects: [
      SubjectId.MATHEMATICS,
      SubjectId.PHYSICS,
      SubjectId.COMPUTER_SCIENCE,
    ],
    bio: 'Senior peer tutor helping Grade 11 and 12 students work through calculus and algorithm proofs.',
  },
  {
    id: 'member-elena',
    name: 'Elena Brooks',
    username: 'elena.brooks',
    avatarUrl: AVATAR_ELENA_IMAGE,
    role: UserRole.STUDENT,
    gradeOrDept: GradeLevel.GRADE_12,
    section: 'Section 12-Newton',
    courseOrTrack: 'AP Honors Track',
    club: 'Debate & Rhetoric Guild',
    focusSubject: SubjectId.PHYSICS,
    enrolledSubjects: [
      SubjectId.PHYSICS,
      SubjectId.MATHEMATICS,
      SubjectId.LITERATURE,
      SubjectId.HISTORY,
    ],
    bio: 'Grade 12 student focusing on optics, mechanics, and seminar essay workshops.',
  },
  {
    id: 'member-chen',
    name: 'Ms. Claire Chen',
    username: 'ms.chen',
    role: UserRole.TEACHER,
    gradeOrDept: 'Humanities Faculty',
    section: 'Seminar Room 204',
    courseOrTrack: 'World History & Literature Faculty',
    club: 'Literary & Press Circle',
    monitoredClub: 'Literary & Press Circle',
    focusSubject: SubjectId.HISTORY,
    enrolledSubjects: [
      SubjectId.HISTORY,
      SubjectId.LITERATURE,
      SubjectId.ICT,
    ],
    taughtSubjects: [
      SubjectId.HISTORY,
      SubjectId.LITERATURE,
      SubjectId.ICT,
    ],
    bio: 'Humanities chair guiding primary source analysis and thesis-driven writing across grades.',
  },
  {
    id: 'member-omar',
    name: 'Omar Hassan',
    username: 'omar.hassan',
    avatarUrl: AVATAR_JORDAN_IMAGE,
    role: UserRole.STUDENT,
    gradeOrDept: GradeLevel.GRADE_10,
    section: 'Section 10-Lovelace',
    courseOrTrack: 'Computer & Applied Sciences',
    club: 'Robotics & Coding Club',
    focusSubject: SubjectId.COMPUTER_SCIENCE,
    enrolledSubjects: [
      SubjectId.COMPUTER_SCIENCE,
      SubjectId.ICT,
      SubjectId.MATHEMATICS,
      SubjectId.HISTORY,
    ],
    bio: 'Sophomore building study guides for recursion, discrete math, and modern world history.',
  },
];

export const INITIAL_LESSONS: LessonUnit[] = [
  {
    id: 'lesson-bio-4',
    subjectId: SubjectId.BIOLOGY,
    unitNumber: 'Unit 4.2',
    title: 'Cellular Respiration & ATP Yield',
    summary: 'Glycolysis, the Krebs cycle, and oxidative phosphorylation across mitochondrial membranes.',
    teacherName: 'Dr. Samuel Rivera',
    diagramUrl: BIOLOGY_DIAGRAM_IMAGE,
    diagramCaption: 'Mitochondrial ATP production pathway across cytosol and matrix',
  },
  {
    id: 'lesson-phys-3',
    subjectId: SubjectId.PHYSICS,
    unitNumber: 'Unit 3.1',
    title: 'Light Refraction & Prism Dispersion',
    summary: "Snell's Law, refractive index variation by wavelength, and angle of minimum deviation.",
    teacherName: 'Dr. Samuel Rivera',
    diagramUrl: PHYSICS_DIAGRAM_IMAGE,
    diagramCaption: 'White light dispersion and refraction geometry in a glass prism',
  },
  {
    id: 'lesson-math-5',
    subjectId: SubjectId.MATHEMATICS,
    unitNumber: 'Unit 5.3',
    title: 'Chain Rule & Implicit Differentiation',
    summary: 'Differentiating composite functions and curves not explicitly solved for y.',
    teacherName: 'Jordan Patel',
  },
  {
    id: 'lesson-hist-2',
    subjectId: SubjectId.HISTORY,
    unitNumber: 'Unit 2.4',
    title: 'Industrialization & Urban Reform',
    summary: 'Primary source analysis of 19th-century factory acts, labor guilds, and city sanitation.',
    teacherName: 'Ms. Claire Chen',
  },
  {
    id: 'lesson-lit-6',
    subjectId: SubjectId.LITERATURE,
    unitNumber: 'Unit 6.1',
    title: 'Frame Narratives in Frankenstein',
    summary: 'Analyzing Walton, Victor, and the Creature as nested unreliable narrators.',
    teacherName: 'Ms. Claire Chen',
  },
  {
    id: 'lesson-cs-3',
    subjectId: SubjectId.COMPUTER_SCIENCE,
    unitNumber: 'Unit 3.2',
    title: 'Recursion & Call Stack Frames',
    summary: 'Tracing base cases, stack depth, and converting recursive trees to memoized solutions.',
    teacherName: 'Omar Hassan',
  },
  {
    id: 'lesson-ict-1',
    subjectId: SubjectId.ICT,
    unitNumber: 'Unit 1.4',
    title: 'Network Topologies, IPv4 & Cloud Workflows',
    summary: 'Comparing star and mesh topologies, subnet masks, DNS lookup steps, and collaborative digital systems.',
    teacherName: 'Prof. Evelyn Reyes',
  },
];

const now = Date.now();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export const INITIAL_POSTS: DiscussionPost[] = [
  {
    id: 'post-101',
    kind: PostKind.QUESTION,
    subjectId: SubjectId.BIOLOGY,
    lessonId: 'lesson-bio-4',
    gradeLevel: GradeLevel.GRADE_11,
    authorId: 'member-maya',
    title: 'Why does NADH yield more ATP than FADH2 in the electron transport chain?',
    body: 'In yesterday’s lab diagram, both NADH and FADH2 carry high-energy electrons into the inner mitochondrial membrane, yet our textbook notes say NADH produces ~2.5 ATP while FADH2 produces ~1.5 ATP. Where exactly does that difference happen?',
    formulaNote: 'C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP',
    imageUrl: BIOLOGY_DIAGRAM_IMAGE,
    imageAlt: 'Diagram of glycolysis, Krebs cycle, and electron transport chain in mitochondria',
    createdAt: now - 2 * HOUR,
    upvoterIds: ['member-elena', 'member-jordan', 'member-rivera', 'member-omar'],
    replies: [
      {
        id: 'reply-101-1',
        authorId: 'member-rivera',
        body: 'Great observation! NADH donates its electrons at Complex I, which pumps 4 protons (H+) into the intermembrane space before passing electrons onward through Complex III (4 H+) and Complex IV (2 H+). FADH2 enters later at Complex II, which does not pump any protons across the membrane—so fewer H+ ions flow back through ATP synthase.',
        formulaNote: 'NADH: ~10 H+ pumped -> ~2.5 ATP | FADH2: ~6 H+ pumped -> ~1.5 ATP',
        createdAt: now - 1.2 * HOUR,
        upvoterIds: ['member-maya', 'member-elena', 'member-jordan'],
        isAccepted: true,
      },
      {
        id: 'reply-101-2',
        authorId: 'member-elena',
        body: 'A memory trick that helped me: "Complex II is a side door"—electrons still get on the highway, they just skip the first proton tollbooth.',
        createdAt: now - 45 * 60 * 1000,
        upvoterIds: ['member-maya'],
        isAccepted: false,
      },
    ],
  },
  {
    id: 'post-102',
    kind: PostKind.IDEA,
    subjectId: SubjectId.PHYSICS,
    lessonId: 'lesson-phys-3',
    gradeLevel: GradeLevel.GRADE_12,
    authorId: 'member-elena',
    title: 'Three-step checklist for prism refraction problems without mixing up angles',
    body: 'Several of us lost points on Practice Set 3 by measuring incident angles from the prism face instead of the normal line. Before applying Snell’s Law, sketch the dashed normal perpendicular to the glass boundary first, then track whether the ray bends toward (air to glass) or away (glass to air) from that normal.',
    formulaNote: 'n1 * sin(theta1) = n2 * sin(theta2)   |   delta = i1 + e - A',
    imageUrl: PHYSICS_DIAGRAM_IMAGE,
    imageAlt: 'Diagram showing incident white light ray refracting and dispersing through a triangular glass prism',
    createdAt: now - 5 * HOUR,
    upvoterIds: ['member-maya', 'member-rivera', 'member-jordan', 'member-omar', 'member-chen'],
    replies: [
      {
        id: 'reply-102-1',
        authorId: 'member-jordan',
        body: 'Adding to this: remember violet light has a higher refractive index in crown glass than red light, which is why violet sits at the bottom of the dispersed spectrum screen.',
        createdAt: now - 3.5 * HOUR,
        upvoterIds: ['member-elena', 'member-rivera'],
        isAccepted: true,
      },
    ],
  },
  {
    id: 'post-103',
    kind: PostKind.QUESTION,
    subjectId: SubjectId.MATHEMATICS,
    lessonId: 'lesson-math-5',
    gradeLevel: GradeLevel.GRADE_12,
    authorId: 'member-omar',
    title: 'When taking d/dx of xy^2 during implicit differentiation, why do we need Product Rule?',
    body: 'I understand why y^2 becomes 2y(dy/dx) using the Chain Rule, but I keep forgetting why x * y^2 turns into two separate terms instead of just x * 2y(dy/dx).',
    formulaNote: 'd/dx [x * y^2] = (1)(y^2) + x(2y * dy/dx)',
    createdAt: now - 8 * HOUR,
    upvoterIds: ['member-maya', 'member-elena'],
    replies: [],
  },
  {
    id: 'post-104',
    kind: PostKind.IDEA,
    subjectId: SubjectId.HISTORY,
    lessonId: 'lesson-hist-2',
    gradeLevel: GradeLevel.GRADE_11,
    authorId: 'member-chen',
    title: 'Class Discussion Prompt: Comparing 1833 Factory Act testimonies with local town records',
    body: 'For Friday’s seminar, try pairing one parliamentary inspector report with a city sanitation map from the same decade. Notice how short-term wage increases often coincided with steeper overcrowding penalties—great evidence for thesis paragraphs on unintended urban policy outcomes.',
    createdAt: now - 1 * DAY,
    upvoterIds: ['member-maya', 'member-jordan', 'member-elena'],
    replies: [
      {
        id: 'reply-104-1',
        authorId: 'member-maya',
        body: 'I mapped the cholera outbreak streets from Chapter 4 next to the textile mill district and found almost complete overlap around the river canal.',
        createdAt: now - 19 * HOUR,
        upvoterIds: ['member-chen'],
        isAccepted: false,
      },
    ],
  },
  {
    id: 'post-105',
    kind: PostKind.IDEA,
    subjectId: SubjectId.COMPUTER_SCIENCE,
    lessonId: 'lesson-cs-3',
    gradeLevel: GradeLevel.GRADE_12,
    authorId: 'member-jordan',
    title: 'Visualizing recursion with sticky-note call stack frames before coding',
    body: 'Before writing any recursive JavaScript or Python function, grab 4 index cards. On each card write the function parameter and pause line. Stack a new card on top for every recursive call, and only cross a card off when it returns a concrete value. This immediately reveals missing base cases.',
    formulaNote: 'fib(n) = n <= 1 ? n : fib(n - 1) + fib(n - 2)  // O(2^n) without memo',
    createdAt: now - 1.5 * DAY,
    upvoterIds: ['member-omar', 'member-elena', 'member-rivera'],
    replies: [
      {
        id: 'reply-105-1',
        authorId: 'member-omar',
        body: 'Tried this for merge sort splitting arrays of length 5 and it finally clicked why both halves finish independently.',
        createdAt: now - 1.1 * DAY,
        upvoterIds: ['member-jordan'],
        isAccepted: false,
      },
    ],
  },
  {
    id: 'post-106',
    kind: PostKind.QUESTION,
    subjectId: SubjectId.LITERATURE,
    lessonId: 'lesson-lit-6',
    gradeLevel: GradeLevel.GRADE_11,
    authorId: 'member-maya',
    title: 'Does Walton’s Arctic framing change how we judge Victor Frankenstein’s confession?',
    body: 'In the opening letters, Robert Walton admits he is desperate for glory and companionship. Since the entire novel is filtered through Walton’s letters to his sister Margaret, should we view Victor’s remorse as genuine or partly shaped by Walton’s admiration?',
    createdAt: now - 2 * DAY,
    upvoterIds: ['member-chen', 'member-elena'],
    replies: [
      {
        id: 'reply-106-1',
        authorId: 'member-chen',
        body: 'Yes—Shelley uses Walton as a mirror for Victor’s early ambition. Notice how Victor edits Walton’s shipboard notes before dying; that detail signals he still cares deeply about how posterity remembers him.',
        createdAt: now - 1.6 * DAY,
        upvoterIds: ['member-maya'],
        isAccepted: false,
      },
    ],
  },
  {
    id: 'post-107',
    kind: PostKind.IDEA,
    subjectId: SubjectId.ICT,
    lessonId: 'lesson-ict-1',
    gradeLevel: GradeLevel.GRADE_11,
    authorId: 'member-omar',
    title: 'Quick checklist for reading IPv4 subnet masks (/24 vs /26) in ICT lab quizzes',
    body: 'Whenever our networking lab asks how many usable host addresses fit inside a subnet, convert the CIDR prefix into remaining host bits first: 32 minus the prefix equals host bits h, then compute (2^h) - 2 to subtract the network ID and broadcast address.',
    formulaNote: 'Usable hosts = 2^(32 - prefix) - 2   |   /26 -> 2^6 - 2 = 62 hosts',
    createdAt: now - 14 * HOUR,
    upvoterIds: ['member-jordan', 'member-maya'],
    replies: [
      {
        id: 'reply-107-1',
        authorId: 'member-jordan',
        body: 'Great tip—also double-check the default gateway IP so you do not count the router interface as a student workstation slot.',
        createdAt: now - 10 * HOUR,
        upvoterIds: ['member-omar'],
        isAccepted: true,
      },
    ],
  },
];

export const INITIAL_MAIL_READS: MailReadMap = {
  'member-maya': {
    'reply-106-1': now - 1.4 * DAY,
  },
};

export const INITIAL_EVENTS: SchoolEvent[] = [
  {
    id: 'event-ict-lab',
    title: 'ICT Networking & IPv4 Subnetting Hands-On Clinic',
    description:
      'Guided lab walkthrough covering star topologies, CIDR prefix subnet calculations, and troubleshooting classroom router configurations.',
    category: SchoolEventCategory.WORKSHOP,
    subjectId: SubjectId.ICT,
    gradeLevel: 'All Grades',
    startsAt: now + 1 * DAY + 4 * HOUR,
    location: 'ICT Computer Lab 2 · Room 305',
    clubName: 'ICT Club',
    createdByMemberId: TEACHER_MONITOR_MEMBER_ID,
    createdAt: now - 12 * HOUR,
    attendeeIds: ['member-monitor', 'member-omar', 'member-maya'],
  },
  {
    id: 'event-stem-review',
    title: 'Calculus & Optics Pre-Midterm Study Workshop',
    description:
      'Open problem-solving session for Chain Rule, implicit differentiation, and Snell’s Law prism ray tracing before Friday’s quiz.',
    category: SchoolEventCategory.EXAM_PREP,
    subjectId: SubjectId.MATHEMATICS,
    gradeLevel: GradeLevel.GRADE_12,
    startsAt: now + 3 * DAY,
    location: 'Science Hall B · Lecture Room 102',
    clubName: 'Mathematics Society',
    createdByMemberId: 'member-rivera',
    createdAt: now - 20 * HOUR,
    attendeeIds: ['member-rivera', 'member-jordan', 'member-elena'],
  },
  {
    id: 'event-club-fair',
    title: 'School Clubs & Academic Fair Orientation',
    description:
      'Meet club officers from Science Olympiad, Debate Guild, Robotics, ICT Club, and Literary Circle to sign up for term projects.',
    category: SchoolEventCategory.CLUB_MEET,
    subjectId: 'all',
    gradeLevel: 'All Grades',
    startsAt: now + 5 * DAY + 2 * HOUR,
    location: 'Main Library Commons & Quad',
    clubName: 'Student Council & Peer Mentors',
    createdByMemberId: 'member-chen',
    createdAt: now - 1 * DAY,
    attendeeIds: ['member-chen', 'member-maya', 'member-elena', 'member-omar'],
  },
];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'fr-jordan-maya',
    senderId: 'member-jordan',
    receiverId: 'member-maya',
    note: 'Let’s share Calculus and Computer Science study guides this term!',
    status: FriendRequestStatus.ACCEPTED,
    createdAt: now - 3 * DAY,
    respondedAt: now - 2.9 * DAY,
  },
  {
    id: 'fr-maya-rivera',
    senderId: 'member-maya',
    receiverId: 'member-rivera',
    note: 'Thank you for reviewing my Biology lab notes, Dr. Rivera!',
    status: FriendRequestStatus.ACCEPTED,
    createdAt: now - 4 * DAY,
    respondedAt: now - 3.8 * DAY,
  },
  {
    id: 'fr-elena-maya',
    senderId: 'member-elena',
    receiverId: 'member-maya',
    note: 'Want to compare Physics Optics and Literature notes before Friday’s quiz?',
    status: FriendRequestStatus.PENDING,
    createdAt: now - 5 * HOUR,
  },
  {
    id: 'fr-omar-maya',
    senderId: 'member-omar',
    receiverId: 'member-maya',
    note: 'Saw your ICT Club study tip—let’s team up on the networking lab!',
    status: FriendRequestStatus.PENDING,
    createdAt: now - 2 * HOUR,
  },
];
