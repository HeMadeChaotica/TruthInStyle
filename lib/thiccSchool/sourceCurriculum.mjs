const chapter = (number, title, pages, objectives, workbookPages = '') => ({
  number,
  title,
  pages,
  objectives,
  workbookPages,
});

export const CPT_SOURCE = {
  title: 'FOUNDATIONS AND APPLICATIONS FOR A CERTIFIED PERSONAL TRAINER',
  edition: '11TH EDITION',
  published: 2025,
  textbookPages: 858,
  workbookPages: 104,
  workbookType: 'official',
  chapters: [
    chapter(1, 'HEALTH, FITNESS, AND PERSONAL TRAINING', '9-20', ['Trainer role and populations served', 'Required professional knowledge', 'Benefits of exercise and personal training']),
    chapter(2, 'PSYCHOLOGY OF BEHAVIOR CHANGE', '21-56', ['Stages and processes of change', 'Self-determination and motivation', 'Motivational interviewing and OARS', 'SMART outcome and process goals', 'Behavior-change scope of practice'], '3-7'),
    chapter(3, 'MOVEMENT SYSTEMS', '57-94', ['Nervous-system structure and function', 'Muscular-system structure and function', 'Skeletal-system structure and function', 'Connective tissues'], '8-14'),
    chapter(4, 'SUPPORTING SYSTEMS', '95-128', ['Circulatory, lymphatic, respiratory, endocrine, digestive, and integumentary systems', 'Internal and external respiration', 'Hormones and their functions', 'Digestive organs and functions'], '15-19'),
    chapter(5, 'CONCEPTS OF BIOMECHANICS', '129-180', ['Anatomical positions and movement terms', 'Planes of motion and joint actions', 'Newton laws, force, friction, torque, and stability', 'Levers and muscles as movers'], '20-37'),
    chapter(6, 'ENERGY AND METABOLISM', '181-202', ['Cell structures', 'ATP-PC, glycolytic, and oxidative energy systems', 'Energy-system overlap', 'Metabolism and energy balance'], '38-44'),
    chapter(7, 'CLIENT ASSESSMENTS', '203-262', ['Subjective screening and health history', 'Body-composition methods', 'Cardiorespiratory and muscular assessments', 'Static and dynamic posture', 'Movement assessment and interpretation'], '45-50'),
    chapter(8, 'ELEMENTS OF FITNESS', '263-284', ['Fitness-program goals', 'Warm-up and cooldown', 'Flexibility, core, balance, reactive, resistance, and cardiovascular elements', 'Components of a complete program'], '51-54'),
    chapter(9, 'PRINCIPLES OF PROGRAM DESIGN', '285-310', ['Acute training variables', 'Specificity, individual differences, and progressive overload', 'Periodization', 'Overreaching and overtraining'], '55-60'),
    chapter(10, 'CONCEPTS OF FLEXIBILITY TRAINING', '311-366', ['Benefits and acute variables of flexibility', 'Dynamic, static, and PNF methods', 'Special-population considerations', 'Self-myofascial release'], '61-63'),
    chapter(11, 'CONCEPTS OF CARDIOVASCULAR EXERCISE', '367-412', ['Benefits and training principles', 'Cardio acute variables and fitness measures', 'Modes, warm-up, and cooldown', 'Physiological and environmental considerations'], '64-68'),
    chapter(12, 'CONCEPTS OF RESISTANCE TRAINING', '413-462', ['Strength classifications and curves', 'Anaerobic adaptations and recovery', 'Resistance-training variables and equipment', 'Set and repetition schemes'], '69-72'),
    chapter(13, 'EXERCISE SELECTION AND TECHNIQUE', '463-520', ['Learning and communication styles', 'Cueing and injury prevention', 'Fundamental movement categories', 'Exercise technique, prime movers, regressions, and progressions'], '73-82'),
    chapter(14, 'PURPOSE-DRIVEN TRAINING MODEL', '521-556', ['Client purpose, preferences, and status', 'Client interview', 'Movement Observation Guide', 'Goal-based training guidelines', 'Feedback and real-time adjustment']),
    chapter(15, 'NUTRITION FOUNDATIONS', '557-616', ['Macronutrients and general intake guidance', 'Water, micronutrients, and antioxidants', 'Dietary Guidelines and food labels', 'Portions, diets, and eating patterns'], '83-87'),
    chapter(16, 'SUPPLEMENTATION', '617-652', ['Supplement definition and scope', 'Nutritional and performance supplements', 'Ergogenic aids', 'Botanical supplements'], '88-89'),
    chapter(17, 'CHRONIC CONDITIONS', '653-682', ['Hypertension', 'Diabetes', 'Arthritis', 'Coronary heart disease', 'Asthma and exercise considerations'], '90-93'),
    chapter(18, 'LIFESPAN POPULATIONS', '683-714', ['Youth training', 'Older-adult health and fitness', 'Pregnancy', 'Adaptive and accessible fitness'], '94-96'),
    chapter(19, 'BUSINESS AND MARKETING', '715-762', ['Personal-training service models', 'Business plans and diversified services', 'Marketing and leadership', 'Client life cycle and retention', 'Ethics and best practices'], '97-100'),
    chapter(20, 'SAFETY AND EMERGENCY SITUATIONS', '763-781', ['Fitness-floor ownership and injury prevention', 'CPR certification', 'Emergency equipment and protocols', 'Emergency-service activation and incident reporting'], '101-104'),
  ],
};

export const NUTRITION_SOURCE = {
  title: 'NUTRITION COACH',
  edition: 'FIRST EDITION, REV. 12/2025',
  published: 2025,
  textbookPages: 488,
  workbookType: 'generated',
  chapters: [
    chapter(1, 'NUTRITION', '9-20', ['Food selection', 'Functional foods', 'Cultural, economic, religious, and social determinants']),
    chapter(2, 'CELLS, ORGAN SYSTEMS, AND DIGESTION', '21-54', ['Animal-cell structure and function', 'Cell types and organ systems', 'Digestive anatomy and function']),
    chapter(3, 'METABOLISM AND ENERGY BALANCE', '55-76', ['Energy intake and expenditure', 'Cellular metabolism and ATP', 'Aerobic and anaerobic energy systems']),
    chapter(4, 'CARBOHYDRATES', '77-94', ['Carbohydrate types and fiber', 'Glycogen storage and use', 'Digestion, glycemic index, food sources, and athletes']),
    chapter(5, 'PROTEIN', '95-116', ['Protein and amino-acid terminology', 'Functions and physiological effects', 'Essential and nonessential amino acids', 'Digestion, quality, sources, and athletes']),
    chapter(6, 'FATS', '117-138', ['Lipid roles and classifications', 'Essential and nonessential fatty acids', 'Digestion, food sources, and intake guidance']),
    chapter(7, 'VITAMINS', '139-164', ['Fat- and water-soluble classifications', 'Functions and health effects', 'Food sources and intake guidance']),
    chapter(8, 'MINERALS', '165-192', ['Major and minor minerals', 'Physiological functions and health benefits', 'Electrolytes, sources, and intake guidance']),
    chapter(9, 'WATER AND HYDRATION', '193-208', ['Water structure and physiological roles', 'Absorption and excretion', 'Dietary sources', 'Hydration and athletic performance']),
    chapter(10, 'THE ROLE OF THE NUTRITION COACH', '209-226', ['Coach role and scope', 'Referral to licensed professionals', 'Effective coaching qualities', 'Ethics and HIPAA']),
    chapter(11, 'STAGES OF CHANGE AND MOTIVATIONAL INTERVIEWING', '227-252', ['Five stages of change', 'Motivation', 'Motivational interviewing', 'Effective coaching strategies']),
    chapter(12, 'CLIENT ASSESSMENT AND GOAL SETTING', '253-276', ['Nutrition-coach assessments', 'Health, exercise, diet, and intake forms', 'Goal setting and SMART goals']),
    chapter(13, 'BUSINESS IN NUTRITION COACHING', '277-294', ['Coaching service models', 'Business planning', 'Client acquisition and referrals', 'Common business mistakes']),
    chapter(14, 'DIETARY GUIDELINES', '295-306', ['Dietary Guidelines for Americans', 'USDA programs', 'Healthy eating patterns', 'MyPlate and Healthy Eating Plate']),
    chapter(15, 'PRODUCT AND SUPPLEMENT LABELS AND CLAIMS', '307-332', ['Food and supplement labels', 'FDA and FTC roles', 'Regulated claims', 'Organic agriculture']),
    chapter(16, 'SUPPLEMENTS', '333-344', ['Supplement delivery methods', 'Types and common uses', 'Scope of practice', 'Sports nutrition and weight management']),
    chapter(17, 'NAVIGATING SUCCESSFUL AND TRENDING DIETS', '345-374', ['Definition of diet', 'Trend versus fad diets', 'Common approaches', 'Attributes of sustainable diets']),
    chapter(18, 'SPECIAL NUTRITION SCENARIOS', '375-417', ['Health-management and lifespan scenarios', 'Food allergies and hypersensitivities', 'Scope limits and professional referral', 'Client discussion points']),
  ],
};

const modulePlan = (source, chapterNumbers) => ({
  sourceTitle: source.title,
  sourceEdition: source.edition,
  workbookType: source.workbookType || '',
  chapters: chapterNumbers.map((number) => source.chapters.find((item) => item.number === number)),
});

export const VERIFIED_MODULE_SOURCES = {
  cpt: {
    'cpt-1': modulePlan(CPT_SOURCE, [1, 2]),
    'cpt-2': modulePlan(CPT_SOURCE, [3, 4]),
    'cpt-3': modulePlan(CPT_SOURCE, [5]),
    'cpt-4': modulePlan(CPT_SOURCE, [6]),
    'cpt-5': modulePlan(CPT_SOURCE, [7, 8, 9]),
    'cpt-6': modulePlan(CPT_SOURCE, [10, 11]),
    'cpt-7': modulePlan(CPT_SOURCE, [12, 13]),
    'cpt-8': modulePlan(CPT_SOURCE, [14]),
    'cpt-9': modulePlan(CPT_SOURCE, [15, 16, 17, 18]),
    'cpt-10': modulePlan(CPT_SOURCE, [19, 20]),
  },
  nutrition: {
    'nutrition-1': modulePlan(NUTRITION_SOURCE, [1]),
    'nutrition-2': modulePlan(NUTRITION_SOURCE, [2]),
    'nutrition-3': modulePlan(NUTRITION_SOURCE, [3]),
    'nutrition-4': modulePlan(NUTRITION_SOURCE, [4, 5, 6]),
    'nutrition-5': modulePlan(NUTRITION_SOURCE, [7, 8]),
    'nutrition-6': modulePlan(NUTRITION_SOURCE, [9, 10, 11]),
    'nutrition-7': modulePlan(NUTRITION_SOURCE, [12, 13]),
    'nutrition-8': modulePlan(NUTRITION_SOURCE, [14, 15]),
    'nutrition-9': modulePlan(NUTRITION_SOURCE, [16, 17]),
    'nutrition-10': modulePlan(NUTRITION_SOURCE, [18]),
  },
};

export const getVerifiedModuleSource = (courseId, sectionId) => VERIFIED_MODULE_SOURCES[courseId]?.[sectionId] || null;
