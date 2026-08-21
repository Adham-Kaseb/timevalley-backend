import { Injectable, Logger } from '@nestjs/common';

export interface ChatQueryDto {
  message: string;
  language?: 'en' | 'ar';
  history?: { sender: 'user' | 'assistant'; text: string }[];
}

export interface AssistantResponse {
  reply: string;
  category: string;
  suggestedFaqs: string[];
  actionLinks: { label: string; url: string; icon?: string }[];
}

interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  links: { label: string; url: string; icon?: string }[];
  followUps: string[];
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  /**
   * Comprehensive 11-Domain Platform Knowledge Base (Arabic & English)
   */
  private readonly knowledgeBase = {
    en: {
      welcome:
        "Welcome to TimeValley! I am your interactive AI Guide. I can help you navigate our venture studio, 120h accredited diplomas, Day-Zero co-founder matching, pre-seed funding ($50k–$250k), interactive market tools, and expert advisory.\n\nWhat would you like to explore today?",
      defaultSuggestions: [
        "What is the 120h Venture Architect Diploma?",
        "How does Co-Founder & CTO Matching work?",
        "How do I apply for Pre-Seed Investment ($50k-$250k)?",
        "How to book a 1-on-1 Consultation with Dr. Wael?",
        "How do I verify a graduate certificate?",
      ],
      faqs: [
        {
          id: "diploma",
          question: "What is the Venture Architect & Founder Diploma?",
          answer:
            "Our flagship 120h Diploma is an intensive masterclass curriculum designed alongside tier-1 venture partners.\n\n• **40 Comprehensive Units across 5 Phases**: Day-Zero Validation, Product Architecture, Venture Finance & Cap-Tables, Growth Engineering, and Scale.\n• **Accredited Verification**: Completing over 90% issues an officially accredited credential with cryptographic verification.\n• **Interactive Deliverables**: Build investor pitch decks, financial models, and functional MVPs.\n• **High-Performance LMS**: Integrated HLS video lectures, interactive unit quizzes, and student progress gating.",
          category: "LMS & 120h Diploma",
          keywords: [
            "diploma", "curriculum", "course", "courses", "learn", "study", "units", "phases",
            "lms", "120h", "120 hours", "syllabus", "lecture", "student", "video", "quiz"
          ],
          links: [
            { label: "Explore Diploma Curriculum", url: "/diplomas", icon: "🎓" },
            { label: "Enroll & Register", url: "/register", icon: "🚀" },
          ],
          followUps: [
            "How do employers verify TimeValley Certificates?",
            "What topics are covered in the 5 Phases?",
            "How do I apply for Pre-Seed Investment?",
          ],
        },
        {
          id: "cofounder",
          question: "How does Co-Founder & CTO Matching work?",
          answer:
            "TimeValley's Day-Zero Co-Founder Matching connects technical CTOs, domain product experts, and growth leads before company formation.\n\n• **Algorithmic Cohort Matching**: Pairs talent based on complementary skills, domain mastery, and shared vision.\n• **Equitable Cap-Table Frameworks**: Standardized vesting, dynamic founder equity splits, and reverse vesting terms.\n• **Vetted Talent Pool**: Deeply screened engineers and operators across MENA and global markets.\n• **Role Specializations**: Match with Chief Technology Officers, Product Heads, and Growth Strategists.",
          category: "Co-Founder Matching",
          keywords: [
            "co-founder", "cofounder", "cto", "match", "matching", "team", "founder", "partner",
            "equity", "cap table", "vesting", "hire", "engineers", "developers"
          ],
          links: [
            { label: "Find Co-Founders & CTOs", url: "/teams", icon: "🤝" },
            { label: "Build Your Team", url: "/#founder-matching", icon: "🚀" },
          ],
          followUps: [
            "How do equity splits and vesting work?",
            "How do I apply for Pre-Seed Investment?",
            "What is the Venture Architect Diploma?",
          ],
        },
        {
          id: "investment",
          question: "How do I apply for Pre-Seed Investment?",
          answer:
            "TimeValley provides pre-seed capital equity checks ranging from $50,000 to $250,000 for high-potential tech ventures built within our ecosystem.\n\n• **Direct Access**: Direct syndication with regional Series A VCs and angel networks.\n• **Venture Builder Support**: Full product, legal, financial, and go-to-market backing alongside capital.\n• **Fast Evaluation**: Submissions undergo rapid thesis review within 5 business days.\n• **Co-Investment**: Seamless co-investment syndicate structures with top institutional investors.",
          category: "Pre-Seed Investment",
          keywords: [
            "invest", "investment", "fund", "funding", "capital", "pre-seed", "seed", "pitch",
            "venture capital", "vc", "angel", "$50k", "$250k", "equity check", "money"
          ],
          links: [
            { label: "Submit Venture Pitch", url: "/founder", icon: "💰" },
            { label: "View Portfolio Cases", url: "/#portfolio", icon: "📊" },
          ],
          followUps: [
            "What Strategic Advisory services do you offer?",
            "How does Co-Founder Matching work?",
            "How do I calculate market size (TAM/SAM)?",
          ],
        },
        {
          id: "advisory",
          question: "What Strategic Advisory services do you offer?",
          answer:
            "We provide bespoke advisory for founders and startups led by Dr. Wael and senior venture architects.\n\n• **Strategy Sessions**: ICP validation, Unit Economics & pricing modeling, Go-to-Market sprint execution.\n• **1-on-1 Consultations**: Direct tactical advisory on fundraising strategy, pitch deck audits, and tech architecture.\n• **Flexible Scheduling**: Book direct 30m or 60m private strategy slots with integrated calendar booking.",
          category: "Strategic Advisory",
          keywords: [
            "advisory", "consultation", "consult", "consulting", "wael", "dr wael", "meeting",
            "mentor", "mentorship", "strategy", "tactical", "advice", "book consultation"
          ],
          links: [
            { label: "Book 1-on-1 Consultation", url: "/consultations", icon: "💬" },
            { label: "Meet Founder Dr. Wael", url: "/founder", icon: "👔" },
          ],
          followUps: [
            "How do I apply for Pre-Seed Investment?",
            "What is the Ideation Matrix tool?",
            "What is the Venture Architect Diploma?",
          ],
        },
        {
          id: "ideation",
          question: "How does the AI Ideation Matrix work?",
          answer:
            "The Ideation Matrix is TimeValley's proprietary AI-assisted thesis generation and problem-validation engine.\n\n• **Problem-Solution Validator**: Analyzes startup hypotheses against market trends and customer friction points.\n• **Defensibility Analysis**: Evaluates moat strength, network effects, and unit economics feasibility.\n• **Instant Thesis Export**: Converts generated venture ideas into structured executive concept briefs.",
          category: "Venture Tools",
          keywords: [
            "idea", "ideation", "matrix", "thesis", "validate", "validation", "generator",
            "problem solution", "concept", "tools", "ai tool"
          ],
          links: [
            { label: "Launch Ideation Matrix", url: "/ideation", icon: "💡" },
            { label: "TAM/SAM/SOM Calculator", url: "/market-research", icon: "📊" },
          ],
          followUps: [
            "How do I calculate TAM / SAM / SOM market size?",
            "What is the 120h Venture Architect Diploma?",
            "How does Co-Founder Matching work?",
          ],
        },
        {
          id: "market",
          question: "How do I calculate TAM, SAM & SOM Market Sizing?",
          answer:
            "TimeValley provides an interactive Market Research Engine with bottom-up and top-down market sizing calculators:\n\n• **TAM (Total Addressable Market)**: Global market ceiling calculation.\n• **SAM (Serviceable Addressable Market)**: Regional and segment targeted volume.\n• **SOM (Serviceable Obtainable Market)**: Realistic capture share within 3–5 years.\n• **Sector Telemetry**: Real-time benchmarks for FinTech, SaaS, EdTech, and HealthTech.",
          category: "Venture Tools",
          keywords: [
            "market", "tam", "sam", "som", "calculator", "research", "sizing", "market size",
            "financial model", "telemetry", "benchmarks", "analysis"
          ],
          links: [
            { label: "Open Market Sizing Tool", url: "/market-research", icon: "📊" },
            { label: "Ideation Matrix", url: "/ideation", icon: "💡" },
          ],
          followUps: [
            "How do I apply for Pre-Seed Investment?",
            "How does the AI Ideation Matrix work?",
            "What Strategic Advisory services do you offer?",
          ],
        },
        {
          id: "verify",
          question: "How do employers verify TimeValley Certificates?",
          answer:
            "Every graduate certificate carries a unique cryptographic serial code (e.g., `TV-DIP-2026-XXXXXX`).\n\n• **Instant Verification**: Enter the code into our public registry to inspect student name, issue date, credential authenticity, and validated skills.\n• **Tamper-Proof**: Backed by secure cryptographic hash generation that cannot be forged.\n• **Global Recognition**: Accepted by partner venture funds, tech enterprises, and accelerator networks.",
          category: "Credential Verification",
          keywords: [
            "verify", "verification", "certificate", "credential", "serial", "code", "tv-dip",
            "blockchain", "authenticated", "check certificate", "employer"
          ],
          links: [
            { label: "Verify Certificate Registry", url: "/our-certificates", icon: "📜" },
            { label: "Explore Diplomas", url: "/diplomas", icon: "🎓" },
          ],
          followUps: [
            "What is the Venture Architect Diploma?",
            "How does Co-Founder Matching work?",
            "How to book a consultation with Dr. Wael?",
          ],
        },
        {
          id: "resources",
          question: "What templates and resources are in the Content Library?",
          answer:
            "The Content Library provides verified venture playbooks and legal blueprints ready for immediate use:\n\n• **Legal Blueprint SAFEs**: Standardized Simple Agreements for Future Equity & Term Sheets.\n• **Cap-Table Financial Models**: Dynamic Excel spreadsheets for multi-round founder equity dilution.\n• **Investor Pitch Decks**: Tier-1 VC pitch frameworks with high-conversion slide layouts.\n• **Go-to-Market Checklists**: Step-by-step launch protocols for B2B & B2C startups.",
          category: "Content Library",
          keywords: [
            "resource", "resources", "library", "content", "template", "templates", "safe",
            "pitch deck", "excel", "playbook", "legal", "download", "guide"
          ],
          links: [
            { label: "Explore Content Library", url: "/content-library", icon: "📚" },
            { label: "Explore Diplomas", url: "/diplomas", icon: "🎓" },
          ],
          followUps: [
            "How do I apply for Pre-Seed Investment?",
            "How does Co-Founder Matching work?",
            "What is the Ideation Matrix tool?",
          ],
        },
        {
          id: "community",
          question: "What is the TimeValley Founders Community & Ecosystem?",
          answer:
            "TimeValley connects over 144+ global ecosystem hubs with an elite private founders network:\n\n• **Founders Circle**: Private community channels for technical founders and CEOs.\n• **Demo Days & Pitch Sprints**: Quarterly live pitch events showcasing top portfolio ventures to active VCs.\n• **Peer Masterminds**: Weekly problem-solving pods for founders navigating early scale.\n• **Global Hubs**: Network footprints spanning Riyadh, Dubai, Cairo, London, and Silicon Valley.",
          category: "Community & Events",
          keywords: [
            "community", "events", "founders circle", "network", "networking", "demo day",
            "pitch sprint", "mastermind", "hubs", "ecosystem", "webinar", "meetup"
          ],
          links: [
            { label: "Join Community Circle", url: "/community", icon: "🌐" },
            { label: "Browse Live Events", url: "/events", icon: "📅" },
          ],
          followUps: [
            "How does Co-Founder Matching work?",
            "What Strategic Advisory services do you offer?",
            "How do I apply for Pre-Seed Investment?",
          ],
        },
        {
          id: "about",
          question: "Who is Dr. Wael and what is TimeValley's philosophy?",
          answer:
            "TimeValley is a modern Venture Studio and Academy founded by Dr. Wael to transform how high-impact tech ventures are conceived, funded, and scaled.\n\n• **Venture Studio Model**: Unlike traditional passive incubators, TimeValley provides active hands-on co-building, talent pairing, and direct capital deployment.\n• **Dr. Wael's Track Record**: Serial venture architect with decades of experience steering institutional VC syndication, ecosystem building, and executive advisory.",
          category: "About & Leadership",
          keywords: [
            "about", "dr wael", "wael", "founder", "mission", "vision", "philosophy",
            "story", "team", "venture studio", "accelerator", "who is"
          ],
          links: [
            { label: "Meet Founder Dr. Wael", url: "/founder", icon: "👔" },
            { label: "About TimeValley", url: "/about", icon: "🏛️" },
          ],
          followUps: [
            "What Strategic Advisory services do you offer?",
            "How do I apply for Pre-Seed Investment?",
            "What is the 120h Venture Architect Diploma?",
          ],
        },
        {
          id: "pricing_account",
          question: "How do enrollment, payments, and Student Workspace work?",
          answer:
            "Getting started on TimeValley is frictionless with dedicated student and founder workspaces:\n\n• **Secure Checkout**: Supports credit/debit cards, bank wire transfers, and verified promo codes.\n• **Student Workspace**: Personalized LMS dashboard tracking progress, video lecture units, and assignment grades.\n• **Scholarships & Vouchers**: Cohort scholarship grants and partnership discount codes can be applied at checkout.",
          category: "Account & Enrollment",
          keywords: [
            "price", "pricing", "cost", "enroll", "enrollment", "pay", "payment", "checkout",
            "card", "account", "login", "register", "workspace", "dashboard", "coupon", "discount"
          ],
          links: [
            { label: "Create Account & Register", url: "/register", icon: "🚀" },
            { label: "Student Login", url: "/login", icon: "🔑" },
          ],
          followUps: [
            "What is the Venture Architect Diploma?",
            "How do employers verify TimeValley Certificates?",
            "What Strategic Advisory services do you offer?",
          ],
        },
        {
          id: "contact",
          question: "How do I contact TimeValley and submit an inquiry?",
          answer:
            "You can connect directly with the TimeValley executive and admissions team through our official channels:\n\n• **Interactive Contact Form**: Submit your inquiry or partnership proposal directly through our web form.\n• **Official Inquiries Email**: contact@timevalley.com (Response within 24 business hours).\n• **1-on-1 Strategic Consultations**: Direct advisory sessions with Dr. Wael & venture architects.\n• **Global Hubs**: Ecosystem locations in Riyadh, Dubai, Cairo, and London.",
          category: "Contact & Direct Support",
          keywords: [
            "contact", "reach", "email", "support", "phone", "call", "helpdesk", "ticket",
            "message", "office", "address", "location", "headquarters", "customer service", "inquiry", "form"
          ],
          links: [
            { label: "Open Contact Form", url: "/#contact", icon: "✉️" },
            { label: "Book 1-on-1 Consultation", url: "/consultations", icon: "💬" },
            { label: "Meet Founder Dr. Wael", url: "/founder", icon: "👔" },
          ],
          followUps: [
            "How to book a 1-on-1 Consultation with Dr. Wael?",
            "How do I apply for Pre-Seed Investment?",
            "What is the 120h Venture Architect Diploma?",
          ],
        },
      ] as KnowledgeItem[],
    },
    ar: {
      welcome:
        "أهلاً بك في TimeValley! أنا دليلك الذكي لمساعدتك في استكشاف منظومة بناء الشركات الناشئة: مطابقة الشركاء والـ CTOs، دبلوماتنا المعتمدة (120 ساعة)، استثمارات Pre-Seed ($50k–$250k)، أدوات دراسة السوق، والاستشارات الريادية المباشرة.\n\nكيف يمكنني مساعدتك اليوم؟",
      defaultSuggestions: [
        "ما هي دبلومة Venture Architect المعتمدة (120 ساعة)؟",
        "كيف يعمل نظام مطابقة الشركاء المؤسسين والـ CTO؟",
        "كيف أقدم على تمويل واستثمار Pre-Seed ($50k-$250k)؟",
        "كيف أحجز استشارة 1-on-1 مع د. وائل؟",
        "كيف يتم التحقق من الشهادات المعتمدة؟",
      ],
      faqs: [
        {
          id: "diploma",
          question: "ما هي دبلومة Venture Architect المعتمدة (120 ساعة)؟",
          answer:
            "دبلومة Venture Architect & Founder هي برنامج تدريبي مكثف واحترافي يمتد لـ 120 ساعة موزعة على 40 وحدة تعليمية عبر 5 مراحل رئيسية:\n\n• **مراحل المساق**: التحقق من الفكرة، هندسة وتصميم المنتجات الرقمية، المالية وهياكل الملكية (Cap Tables)، النمو السريع، والتوسع.\n• **شهادة معتمدة وموثقة رقمياً**: إتمام أكثر من 90% يمنحك شهادة معتمدة بكود تحقق تشفيري عالمي.\n• **مخرجات عملية حقيقية**: إعداد العرض التقديمي (Pitch Deck)، النماذج المالية، وبناء النموذج الأولي (MVP).\n• **منصة LMS متطورة**: مشغل فيديو HLS عالي السرعة، اختبارات تفاعلية، ومتابعة دقيقة لمسار تقدمك.",
          category: "الدبلومات والأكاديمية",
          keywords: [
            "دبلوم", "دبلومة", "كورس", "كورسات", "تعليم", "دراسة", "وحدات", "مراحل",
            "120", "ساعة", "منهج", "شهادة", "lms", "فيديو", "محاضرات", "اختبار"
          ],
          links: [
            { label: "استعراض مساق الدبلومة", url: "/diplomas", icon: "🎓" },
            { label: "بدء التعلم والتسجيل", url: "/register", icon: "🚀" },
          ],
          followUps: [
            "كيف يتم التحقق من صحة الشهادات المعتمدة؟",
            "كيف أقدم على تمويل واستثمار Pre-Seed؟",
            "كيف يعمل نظام مطابقة الشركاء والـ CTO؟",
          ],
        },
        {
          id: "cofounder",
          question: "كيف يعمل نظام مطابقة الشركاء المؤسسين والـ CTO؟",
          answer:
            "يقوم نظام TimeValley لمطابقة المؤسسين بربط الرؤساء التنفيذيين للتقنية (CTOs) وخبراء المنتجات وقادة النمو قبل تأسيس الشركات رسمياً.\n\n• **خوارزميات التوافق الريادي**: مطابقة الكفاءات بناءً على تكامل المهارات التقنية والريادية والخبرات السوقية.\n• **هيكلة الحصص والملكية العادلة**: نماذج قانونية قياسية لعقود التأسيس وجداول التملك (Cap Tables) وحصص الاستحقاق (Vesting).\n• **كفاءات معتمدة ومفحوصة**: نخبة من أفضل المطورين وقادة المنتجات في الشرق الأوسط والعالم.",
          category: "مطابقة المؤسسين",
          keywords: [
            "شريك", "مؤسس", "مؤسسين", "cto", "تقني", "مطابقة", "فريق", "كوادر",
            "حصص", "ملكية", "عقود", "مبرمج", "مطور", "شراكة"
          ],
          links: [
            { label: "استكشاف مطابقة الشركاء", url: "/teams", icon: "🤝" },
            { label: "كوّن فريقك الريادي", url: "/#founder-matching", icon: "🚀" },
          ],
          followUps: [
            "كيف تقدم على تمويل Pre-Seed للشركات الناشئة؟",
            "ما هي دبلومة Venture Architect المعتمدة؟",
            "كيف تحجز جلسة استشارية مع د. وائل؟",
          ],
        },
        {
          id: "investment",
          question: "كيف أقدم على تمويل واستثمار Pre-Seed ($50k-$250k)؟",
          answer:
            "توفر TimeValley جولات استثمار مبدئي تتراوح بين 50,000$ إلى 250,000$ للشركات التقنية الواعدة المنطلقة من منظومتنا.\n\n• **شبكة استثمارية واسعة**: ربط مباشر مع صناديق رأس المال الجريء (VCs) والمستثمرين الملائكيين لجولات Series A.\n• **دعم متكامل (Venture Builder)**: دعم تقني، قانوني، تسويقي، واستراتيجي مرافق لضخ رأس المال.\n• **تقييم سريع**: مراجعة خطة العمل وأطروحة المشروع خلال 5 أيام عمل فقط.",
          category: "الاستثمار المبدئي",
          keywords: [
            "استثمار", "تمويل", "فلوس", "رأس مال", "مستثمر", "مستثمرين", "pre-seed",
            "عرض", "pitch", "صناديق", "vc", "دولار", "50000", "250000"
          ],
          links: [
            { label: "تقديم عرض المشروع", url: "/founder", icon: "💰" },
            { label: "قصص النجاح والمحفظة", url: "/#portfolio", icon: "📊" },
          ],
          followUps: [
            "ما هي جلسات الاستشارة الاستراتيجية مع د. وائل؟",
            "كيف يعمل نظام مطابقة الشركاء والـ CTO؟",
            "كيف أحسب حجم السوق TAM SAM SOM؟",
          ],
        },
        {
          id: "advisory",
          question: "ما هي جلسات الاستشارة الاستراتيجية مع د. وائل؟",
          answer:
            "نقدم جلسات استشارية استراتيجية متخصصة ومباشرة بقيادة د. وائل ونخبة من مهندسي المشاريع:\n\n• **مواضيع الاستشارات**: التحقق من ملاءمة المنتج للسوق (Product-Market Fit)، تسعير الخدمات، هندسة استراتيجيات الانطلاق (GTM).\n• **جلسات 1-on-1 مخصصة**: تدقيق عروض المستثمرين، خطط التمويل، وهندسة الحصص وجداول التملك.\n• **حجز مرن وفوري**: اختيار موعد الاستشارة المناسب وتأكيده عبر التقويم المباشر.",
          category: "الاستشارات الاستراتيجية",
          keywords: [
            "استشارة", "استشارات", "وائل", "دكتور وائل", "جلسة", "توجيه", "ارشاد",
            "اجتماع", "نصيحة", "استراتيجي", "حجز استشارة"
          ],
          links: [
            { label: "حجز جلسة استشارية", url: "/consultations", icon: "💬" },
            { label: "نبذة عن المؤسس د. وائل", url: "/founder", icon: "👔" },
          ],
          followUps: [
            "كيف أقدم على تمويل واستثمار Pre-Seed؟",
            "كيف تعمل مصفوفة الأفكار الذكية؟",
            "ما هي دبلومة الـ 120 ساعة؟",
          ],
        },
        {
          id: "ideation",
          question: "كيف تعمل مصفوفة الأفكار الذكية (Ideation Matrix)؟",
          answer:
            "مصفوفة الأفكار هي أداة ذكية متطورة من TimeValley لتوليد أطروحات المشاريع والتحقق من جدواها:\n\n• **التحقق من المشكلة والحل**: تحليل الفرضيات مقابل احتياجات السوق وسلوك العملاء الفعلي.\n• **تحليل الميزة التنافسية**: تقييم قوة الحصانة الدفاعية (Moat) واقتصاديات الوحدة.\n• **تصدير الأطروحة**: تحويل الفكرة إلى وثيقة تنفيذية جاهزة للبدء في البناء.",
          category: "أدوات ريادة الأعمال",
          keywords: [
            "فكرة", "افكار", "مصفوفة", "اطروحة", "تحقق", "توليد", "ذكاء اصطناعي",
            "مشروع", "ابتكار", "ادوات", "matrix"
          ],
          links: [
            { label: "تشغيل مصفوفة الأفكار", url: "/ideation", icon: "💡" },
            { label: "حاسبة حجم السوق", url: "/market-research", icon: "📊" },
          ],
          followUps: [
            "كيف أحسب حجم السوق TAM / SAM / SOM؟",
            "ما هي دبلومة Venture Architect المعتمدة؟",
            "كيف يعمل نظام مطابقة الشركاء؟",
          ],
        },
        {
          id: "market",
          question: "كيف أحسب حجم السوق عبر حاسبة TAM / SAM / SOM؟",
          answer:
            "توفر TimeValley محركاً تفاعلياً لدراسة السوق ونمذجة حجم الفرصة الاستثمارية:\n\n• **TAM (إجمالي السوق المحتمل)**: احتساب الحد الأقصى لحجم السوق عالمياً وإقليمياً.\n• **SAM (السوق المتاح للخدمة)**: الشريحة المستهدفة القابلة للوصول الجغرافي والقطاعي.\n• **SOM (السوق القابل للاستحواذ)**: الحصة السوقية الواقعية المتوقع الاستحواذ عليها خلال 3–5 سنوات.\n• **مؤشرات قطاعية**: بيانات مقارنة للتقنية المالية، SaaS، والتعليم الرقمي.",
          category: "أدوات ريادة الأعمال",
          keywords: [
            "سوق", "حجم السوق", "tam", "sam", "som", "حاسبة", "دراسة", "مالية",
            "احصائيات", "تحليل", "تقييم"
          ],
          links: [
            { label: "فتح حاسبة حجم السوق", url: "/market-research", icon: "📊" },
            { label: "مصفوفة الأفكار", url: "/ideation", icon: "💡" },
          ],
          followUps: [
            "كيف أقدم على تمويل واستثمار Pre-Seed؟",
            "كيف تعمل مصفوفة الأفكار الذكية؟",
            "ما هي جلسات الاستشارة مع د. وائل؟",
          ],
        },
        {
          id: "verify",
          question: "كيف يتم التحقق من صحة الشهادات المعتمدة؟",
          answer:
            "تحتوي كل شهادة تخرج على كود تسلسلي مشفر فريد (مثل `TV-DIP-2026-XXXXXX`).\n\n• **تحقق فوري**: أدخل الكود في سجل التحقق المعتمد لعرض بيانات الخريج وتاريخ الإصدار والمهارات المعتمدة فوراً.\n• **موثوقية تامة**: حماية مشفرة تمنع أي تلاعب أو تزوير.\n• **اعتراف واسع**: معتمدة لدى صناديق الاستثمار الجريء والشركات التقنية الشريكة.",
          category: "التحقق من الشهادات",
          keywords: [
            "شهادة", "شهادات", "توثيق", "تحقق", "كود", "تسلسلي", "سجل", "باركود",
            "تشفير", "خريج", "معتمدة"
          ],
          links: [
            { label: "سجل التحقق من الشهادات", url: "/our-certificates", icon: "📜" },
            { label: "استعراض الدبلومة", url: "/diplomas", icon: "🎓" },
          ],
          followUps: [
            "ما هي دبلومة Venture Architect المعتمدة؟",
            "كيف يعمل نظام مطابقة الشركاء؟",
            "كيف أحجز استشارة مع د. وائل؟",
          ],
        },
        {
          id: "resources",
          question: "ما هي النماذج والقوالب المتوفرة في مكتبة المحتوى؟",
          answer:
            "توفر مكتبة المحتوى أدلة ونماذج قانونية ومالية جاهزة للتحميل والاستخدام الفوري:\n\n• **عقود SAFE القياسية**: اتفاقيات الاستثمار البسيط للحصص المستقبلية.\n• **نماذج جداول التملك (Cap-Table Excel)**: ملفات إكسل ديناميكية لإدارة جولات التمويل وتوزيع الحصص.\n• **عروض المستثمرين (Pitch Decks)**: قوالب عرض احترافية معتمدة من أفضل صناديق الـ VC.\n• **أدلة إطلاق المنتجات (GTM)**: خطط تنفيذية متكاملة للانطلاق في السوق.",
          category: "مكتبة المحتوى",
          keywords: [
            "مكتبة", "نماذج", "قوالب", "safe", "ملفات", "تحميل", "اكسل", "عقد",
            "عرض تقديمي", "pitch deck", "موارد", "ادلة"
          ],
          links: [
            { label: "تصفح مكتبة المحتوى", url: "/content-library", icon: "📚" },
            { label: "استعراض الدبلومات", url: "/diplomas", icon: "🎓" },
          ],
          followUps: [
            "كيف أقدم على تمويل واستثمار Pre-Seed؟",
            "كيف يعمل نظام مطابقة الشركاء؟",
            "كيف تعمل مصفوفة الأفكار الذكية؟",
          ],
        },
        {
          id: "community",
          question: "ما هو مجتمع TimeValley وفعاليات رواد الأعمال؟",
          answer:
            "تربط TimeValley أكثر من 144 مركزاً بيئياً عالمياً بشبكة حصرية من المؤسسين والخبراء:\n\n• **حلقة المؤسسين (Founders Circle)**: قنوات تواصل خاصة لتبادل الخبرات والشراكات.\n• **أيام العروض (Demo Days)**: فعاليات دورية لعرض المشاريع أمام كبرى صناديق رأس المال الجريء.\n• **جلسات الماسترمايند**: لقاءات أسبوعية لحل التحديات التقنية والتشغيلية.\n• **مراكز عالمية**: شبكة تغطي الرياض، دبي، القاهرة، لندن، ووادي السيليكون.",
          category: "المجتمع والفعاليات",
          keywords: [
            "مجتمع", "فعاليات", "فعالية", "لقاءات", "شبكة", "demo day", "مراكز",
            "مؤسسين", "اعضاء", "شبكة المؤسسين", "webinar"
          ],
          links: [
            { label: "الانضمام لمجتمع المؤسسين", url: "/community", icon: "🌐" },
            { label: "استعراض الفعاليات الحية", url: "/events", icon: "📅" },
          ],
          followUps: [
            "كيف يعمل نظام مطابقة الشركاء والـ CTO؟",
            "ما هي جلسات الاستشارة مع د. وائل؟",
            "كيف أقدم على تمويل Pre-Seed؟",
          ],
        },
        {
          id: "about",
          question: "من هو د. وائل وما هي فلسفة منظومة TimeValley؟",
          answer:
            "TimeValley هي استوديو بناء شركات (Venture Studio) وأكاديمية متقدمة أسسها د. وائل لتغيير طريقة إطلاق وتوسيع الشركات التقنية:\n\n• **نموذج استوديو بناء الشركات**: تختلف TimeValley عن الحاضنات التقليدية بتقديم شراكة فعلية، بناء تقني مشترك، وضخ مالي مباشر.\n• **خبرة د. وائل**: رائد أعمال ومهندس مشاريع قاد العديد من الصفقات الاستثمارية وبرامج الاستشارات التنفيذية في المنطقة.",
          category: "عن المنصة والمؤسس",
          keywords: [
            "عن", "من نحن", "وائل", "دكتور وائل", "المؤسس", "فلسفة", "رؤية",
            "استوديو", "قصة", "من هو"
          ],
          links: [
            { label: "نبذة عن المؤسس د. وائل", url: "/founder", icon: "👔" },
            { label: "عن منصة TimeValley", url: "/about", icon: "🏛️" },
          ],
          followUps: [
            "ما هي جلسات الاستشارة مع د. وائل؟",
            "كيف أقدم على تمويل واستثمار Pre-Seed؟",
            "ما هي دبلومة الـ 120 ساعة؟",
          ],
        },
        {
          id: "pricing_account",
          question: "كيف يتم التسجيل والدفع والدخول لمساحة التعلم؟",
          answer:
            "التسجيل في TimeValley سلس ومباشر عبر بوابات آمنة ومساحات عمل مخصصة:\n\n• **دفع آمن**: دعم كامل للبطاقات الائتمانية، التحويلات البنكية، وأكواد الخصم والمنح.\n• **مساحة الطالب (Workspace)**: لوحة تحكم متطورة لمتابعة المحاضرات، حل الواجبات، ومراقبة مستوى الإنجاز.\n• **كوبونات ومنح دراسية**: إمكانية تطبيق كوبونات الخصم للمجموعات وبرامج الشراكات مباشرة في صفحة الدفع.",
          category: "الحسابات والتسجيل",
          keywords: [
            "تسجيل", "دخول", "حساب", "دفع", "سعر", "اسعار", "تكلفة", "شراء",
            "كوبون", "خصم", "مساحة", "workspace", "بطاقة", "checkout"
          ],
          links: [
            { label: "إنشاء حساب جديد", url: "/register", icon: "🚀" },
            { label: "تسجيل الدخول", url: "/login", icon: "🔑" },
          ],
          followUps: [
            "ما هي دبلومة Venture Architect المعتمدة؟",
            "كيف يتم التحقق من الشهادات؟",
            "ما هي جلسات الاستشارة مع د. وائل؟",
          ],
        },
        {
          id: "contact",
          question: "كيف يمكنني التواصل مع إدارة TimeValley وإرسال استفسار؟",
          answer:
            "يمكنك التواصل مباشرة مع فريق إدارة TimeValley وقسم القبول عبر القنوات المعتمدة التالية:\n\n• **نموذج التواصل السريع**: إرسال استفسارك أو طلب الشراكة مباشرة عبر نموذج التواصل في الموقع الرسمي.\n• **البريد الإلكتروني المعتمد**: contact@timevalley.com (الرد خلال 24 ساعة عمل).\n• **حجز الاستشارات المباشرة**: حجز جلسة استراتيجية 1-on-1 مع د. وائل أو مهندسي المشاريع.\n• **المراكز الإقليمية**: شبكة مراكز بيئية تدعم رواد الأعمال في الرياض، دبي، القاهرة، ولندن.",
          category: "التواصل والدعم الفني",
          keywords: [
            "تواصل", "اتواصل", "اتصال", "تواصل معنا", "ارسال استفسار", "ارسال", "ارسل", "رسالة", "رساله",
            "ايميل", "بريد", "هاتف", "رقم", "دعم", "فني", "خدمة العملاء", "شكوى", "مساعدة", "استفسار",
            "ارسال رسالة", "مقر", "عنوان", "مكتب", "نموذج التواصل", "الادارة", "ادارة", "contact", "email"
          ],
          links: [
            { label: "نموذج التواصل السريع", url: "/#contact", icon: "✉️" },
            { label: "حجز استشارة مباشرة", url: "/consultations", icon: "💬" },
            { label: "نبذة عن المؤسس د. وائل", url: "/founder", icon: "👔" },
          ],
          followUps: [
            "كيف أحجز استشارة 1-on-1 مع د. وائل؟",
            "كيف أقدم على تمويل واستثمار Pre-Seed؟",
            "ما هي دبلومة Venture Architect المعتمدة؟",
          ],
        },
      ] as KnowledgeItem[],
    },
  };

  /**
   * Arabic NLP string normalizer (strips diacritics, unifies alef, taa, yaa, and common prefixes)
   */
  private normalizeArabic(text: string): string {
    return text
      .replace(/[\u064B-\u065F\u0670]/g, '') // strip tashkeel
      .replace(/[إأآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()؟?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * English NLP normalizer
   */
  private normalizeEnglish(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Retrieves FAQ items and suggestions for a chosen language
   */
  getInitialFaqs(lang: 'en' | 'ar' = 'en') {
    const data = this.knowledgeBase[lang] || this.knowledgeBase.en;
    return {
      welcomeMessage: data.welcome,
      faqs: data.faqs.map((f) => ({
        id: f.id,
        question: f.question,
        category: f.category,
      })),
      suggestions: data.defaultSuggestions,
    };
  }

  /**
   * Handles user chat questions with contextual grounding and smart weighted matching
   */
  async handleChatQuery(dto: ChatQueryDto): Promise<AssistantResponse> {
    const rawText = (dto.message || '').trim();
    if (!rawText) {
      return this.getFallbackResponse(dto.language === 'ar' ? 'ar' : 'en');
    }

    const isArabic = dto.language === 'ar' || /[\u0600-\u06FF]/.test(rawText);
    const activeLang = isArabic ? 'ar' : 'en';
    const kb = this.knowledgeBase[activeLang];

    const normalizedQuery = isArabic
      ? this.normalizeArabic(rawText)
      : this.normalizeEnglish(rawText);
    const queryTokens = normalizedQuery.split(' ').filter((t) => t.length > 1);

    let bestMatch: KnowledgeItem | null = null;
    let highestScore = 0;

    for (const faq of kb.faqs) {
      let score = 0;
      const normQuestion = isArabic
        ? this.normalizeArabic(faq.question)
        : this.normalizeEnglish(faq.question);
      const normCategory = isArabic
        ? this.normalizeArabic(faq.category)
        : this.normalizeEnglish(faq.category);

      // 1. Direct Question Match
      if (normQuestion.includes(normalizedQuery) || normalizedQuery.includes(normQuestion)) {
        score += 100;
      }

      // 2. ID Match
      if (normalizedQuery.includes(faq.id)) {
        score += 60;
      }

      // 3. Keyword Scoring
      for (const kw of faq.keywords) {
        const normKw = isArabic ? this.normalizeArabic(kw) : this.normalizeEnglish(kw);
        if (normalizedQuery.includes(normKw)) {
          score += 35;
        } else {
          // Token overlap check
          const kwTokens = normKw.split(' ');
          for (const token of queryTokens) {
            if (kwTokens.includes(token)) {
              score += 15;
            }
          }
        }
      }

      // 4. Category relevance
      if (normCategory.includes(normalizedQuery) || normalizedQuery.includes(normCategory)) {
        score += 25;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }

    // High confidence threshold match
    if (bestMatch && highestScore >= 20) {
      return {
        reply: bestMatch.answer,
        category: bestMatch.category,
        suggestedFaqs: bestMatch.followUps || kb.defaultSuggestions.slice(0, 3),
        actionLinks: bestMatch.links,
      };
    }

    // Graceful Out-of-Scope Fallback
    return this.getFallbackResponse(activeLang);
  }

  private getFallbackResponse(lang: 'en' | 'ar'): AssistantResponse {
    const kb = this.knowledgeBase[lang];

    if (lang === 'ar') {
      return {
        reply:
          "عذراً، هذه المعلومة غير متوفرة حالياً في دليل منصة TimeValley.\n\nأنا متخصص في إرشادك حول جميع برامج وخدمات المنصة:\n• **الدبلومات المعتمدة (120 ساعة)**: برامج Venture Architect المعتمدة والموثقة.\n• **مطابقة المؤسسين والـ CTOs**: ربط الشركاء التقنيين والتنفيذيين قبل التأسيس.\n• **الاستثمار والتمويل الأولي**: تذاكر تمويل Pre-Seed من 50,000$ إلى 250,000$.\n• **الاستشارات الريادية وأدوات السوق**: جلسات استراتيجية مع د. وائل وحاسبات TAM/SAM ومصفوفة الأفكار.\n\nإذا كنت بحاجة لمعلومات مخصصة أو ترغب في التحدث مع فريق العمل، يسعدنا حجز استشارة مباشرة أو اختيار أحد الموضوعات أدناه.",
        category: "تنويه استفسار",
        suggestedFaqs: kb.defaultSuggestions.slice(0, 4),
        actionLinks: [
          { label: "حجز استشارة ريادية", url: "/consultations", icon: "💬" },
          { label: "استكشاف الدبلومات", url: "/diplomas", icon: "🎓" },
          { label: "مطابقة الشركاء", url: "/teams", icon: "🤝" },
        ],
      };
    }

    return {
      reply:
        "I apologize, but I don't have information regarding that specific inquiry in the TimeValley directory yet.\n\nI specialize in TimeValley ecosystem services, including:\n• **120h Accredited Diplomas**: Comprehensive Venture Architect masterclass.\n• **Co-Founder & CTO Matching**: Algorithmic pairing for technical & product leaders.\n• **Pre-Seed Capital**: Direct startup funding from $50,000 to $250,000.\n• **Strategic Advisory & Tools**: 1-on-1 sessions with Dr. Wael, Ideation Matrix & TAM/SAM calculators.\n\nIf you need direct assistance from our team or have custom inquiries, feel free to book a consultation below.",
      category: "Information Notice",
      suggestedFaqs: kb.defaultSuggestions.slice(0, 4),
      actionLinks: [
        { label: "Book Consultation", url: "/consultations", icon: "💬" },
        { label: "Explore Diplomas", url: "/diplomas", icon: "🎓" },
        { label: "Find Co-Founders", url: "/teams", icon: "🤝" },
      ],
    };
  }
}
