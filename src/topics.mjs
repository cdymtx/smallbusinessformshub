// src/topics.mjs
// Deterministic generator for 2000 content topics for Small Business Forms Hub.
// Uses a fixed-seed PRNG (mulberry32) so every build is reproducible.
// Exports: generateTopics(), SECTIONS, CLUSTERS, CALC_KEYS, AUTHORITIES

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32). Fixed seed => reproducible builds.
// ---------------------------------------------------------------------------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260716);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (arr, n) => {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
};
const ri = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

// ---------------------------------------------------------------------------
// Shared word banks
// ---------------------------------------------------------------------------
const ADJ = ['Standard', 'Simple', 'Professional', 'Customizable', 'Free', 'Editable', 'Printable', 'Basic', 'Comprehensive', 'Essential', 'Detailed', 'Modern', 'Blank', 'Fillable', 'Ready-to-Use', 'Clean'];
const AUDIENCE = ['Startups', 'Small Businesses', 'Freelancers', 'Agencies', 'Contractors', 'Consultants', 'Teams', 'Enterprises', 'Sole Proprietors', 'Nonprofits', 'Remote Teams', 'Service Providers'];
const VARIANT = ['2026 Edition', 'with Samples', 'Editable Version', 'PDF & Word', 'Excel Version', 'Google Sheets', 'Printable Format', 'US Letter', 'A4 Format'];
const USECASE = ['Quick Review', 'Fast Onboarding', 'Compliance', 'Audit Ready', 'Remote Work', 'Hybrid Teams', 'Scaling Teams', 'First-Time Founders', 'Growing Companies', 'Established Firms'];
const FORMS = ['Template', 'Form', 'Checklist', 'Worksheet', 'Contract', 'Agreement', 'Policy', 'Plan', 'Tracker', 'Sheet'];

const INDUSTRIES = ['Retail', 'SaaS', 'Manufacturing', 'Healthcare', 'Construction', 'Hospitality', 'E-commerce', 'Professional Services', 'Education', 'Real Estate', 'Finance', 'Nonprofit', 'Logistics', 'Media', 'Fitness', 'Food Service', 'Consulting', 'Agency', 'Startup', 'Legal Services'];
const FORMATS = ['Excel', 'Google Sheets', 'PDF', 'Word', 'CSV'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const USE_TIMES = ['5 min', '10 min', '15 min', '20 min', '30 min', '45 min', '60 min'];

// Authority sources (real .gov / .org sites)
export const AUTHORITIES = [
  { name: 'U.S. Small Business Administration', url: 'https://www.sba.gov', domain: 'SBA.gov' },
  { name: 'Internal Revenue Service', url: 'https://www.irs.gov', domain: 'IRS.gov' },
  { name: 'U.S. Department of Labor', url: 'https://www.dol.gov', domain: 'DOL.gov' },
  { name: 'Occupational Safety and Health Administration', url: 'https://www.osha.gov', domain: 'OSHA.gov' },
  { name: 'Federal Trade Commission', url: 'https://www.ftc.gov', domain: 'FTC.gov' },
  { name: 'U.S. Equal Employment Opportunity Commission', url: 'https://www.eeoc.gov', domain: 'EEOC.gov' },
  { name: 'SCORE', url: 'https://www.score.org', domain: 'SCORE.org' },
  { name: 'National Institute of Standards and Technology', url: 'https://www.nist.gov', domain: 'NIST.gov' },
  { name: 'U.S. Census Bureau', url: 'https://www.census.gov', domain: 'Census.gov' },
  { name: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov', domain: 'ConsumerFinance.gov' }
];

// Calculator registry keys (implemented in site.js). 32 calculators.
export const CALC_KEYS = [
  'profit-margin', 'pricing', 'loan-payment', 'paycheck', 'roi', 'depreciation',
  'break-even', 'inventory-turnover', 'aov', 'conversion-rate', 'cac', 'ltv',
  'cash-flow', 'tax-rate', 'discount', 'tip', 'overtime', 'commission',
  'rental-yield', 'cap-rate', 'mortgage', 'compound-interest', 'savings-goal',
  'dti', 'gross-margin', 'net-margin', 'ebitda', 'unit-economics', 'payback',
  'npv', 'irr', 'markup'
];

// ---------------------------------------------------------------------------
// 20 sections. Each has 6 clusters with a meaningful subject.
// ---------------------------------------------------------------------------
function mkClusters(map) {
  return map.map(([slug, name, subject, calcKeys]) => ({ slug, name, subject, calcKeys }));
}

export const SECTIONS = [
  { slug: 'legal-contracts', name: '法律合同模板', en: 'Legal Contracts', desc: 'Attorney-style contract, agreement, and policy templates for everyday business dealings.', clusters: mkClusters([
    ['nda', 'Non-Disclosure Agreements', 'NDA'],
    ['service-agreement', 'Service Agreements', 'Service Agreement'],
    ['employment-contract', 'Employment Contracts', 'Employment Contract'],
    ['partnership', 'Partnership Agreements', 'Partnership Agreement'],
    ['vendor-contract', 'Vendor Contracts', 'Vendor Contract'],
    ['lease-agreement', 'Lease Agreements', 'Lease Agreement'],
  ]) },
  { slug: 'business-plans', name: '商业计划与提案', en: 'Business Plans & Proposals', desc: 'Plan, pitch, and propose with structured business planning templates.', clusters: mkClusters([
    ['business-plan', 'Business Plans', 'Business Plan'],
    ['pitch-deck', 'Pitch Decks', 'Pitch Deck'],
    ['executive-summary', 'Executive Summaries', 'Executive Summary'],
    ['proposal', 'Business Proposals', 'Business Proposal'],
    ['strategic-plan', 'Strategic Plans', 'Strategic Plan'],
    ['grant-proposal', 'Grant Proposals', 'Grant Proposal'],
  ]) },
  { slug: 'hr-onboarding', name: '人事与入职表单', en: 'HR & Onboarding', desc: 'Onboarding, handbook, and employee lifecycle forms for HR teams.', clusters: mkClusters([
    ['onboarding-checklist', 'Onboarding Checklists', 'Onboarding Checklist'],
    ['employee-handbook', 'Employee Handbooks', 'Employee Handbook'],
    ['offer-letter', 'Offer Letters', 'Offer Letter'],
    ['performance-review', 'Performance Reviews', 'Performance Review'],
    ['timesheet', 'Timesheets', 'Timesheet'],
    ['leave-request', 'Leave Request Forms', 'Leave Request Form'],
  ]) },
  { slug: 'finance-accounting', name: '财务与会计表单', en: 'Finance & Accounting', desc: 'Invoices, statements, and budgeting worksheets for finance teams.', clusters: mkClusters([
    ['invoice', 'Invoices', 'Invoice Template'],
    ['balance-sheet', 'Balance Sheets', 'Balance Sheet'],
    ['income-statement', 'Income Statements', 'Income Statement'],
    ['cash-flow-statement', 'Cash Flow Statements', 'Cash Flow Statement'],
    ['expense-report', 'Expense Reports', 'Expense Report'],
    ['budget-worksheet', 'Budget Worksheets', 'Budget Worksheet'],
  ]) },
  { slug: 'sales-crm', name: '销售与CRM模板', en: 'Sales & CRM', desc: 'Pipeline, lead, and quote templates to keep sales teams organized.', clusters: mkClusters([
    ['sales-pipeline', 'Sales Pipelines', 'Sales Pipeline'],
    ['lead-tracker', 'Lead Trackers', 'Lead Tracker'],
    ['quote-template', 'Quote Templates', 'Quote Template'],
    ['sales-report', 'Sales Reports', 'Sales Report'],
    ['crm-template', 'CRM Templates', 'CRM Template'],
    ['follow-up', 'Follow-up Trackers', 'Follow-up Tracker'],
  ]) },
  { slug: 'marketing-branding', name: '市场与品牌模板', en: 'Marketing & Branding', desc: 'Calendars, guidelines, and campaign templates for marketing teams.', clusters: mkClusters([
    ['content-calendar', 'Content Calendars', 'Content Calendar'],
    ['brand-guidelines', 'Brand Guidelines', 'Brand Guidelines'],
    ['campaign-plan', 'Campaign Plans', 'Campaign Plan'],
    ['social-media', 'Social Media Plans', 'Social Media Plan'],
    ['press-release', 'Press Releases', 'Press Release'],
    ['style-guide', 'Style Guides', 'Style Guide'],
  ]) },
  { slug: 'operations-sop', name: '运营SOP与清单', en: 'Operations & SOP', desc: 'Standard operating procedures, workflows, and operational checklists.', clusters: mkClusters([
    ['sop', 'Standard Operating Procedures', 'SOP'],
    ['process-checklist', 'Process Checklists', 'Process Checklist'],
    ['workflow', 'Workflow Templates', 'Workflow Template'],
    ['incident-report', 'Incident Reports', 'Incident Report'],
    ['audit-checklist', 'Audit Checklists', 'Audit Checklist'],
    ['quality-control', 'Quality Control Checklists', 'Quality Control Checklist'],
  ]) },
  { slug: 'real-estate-forms', name: '房产相关表单', en: 'Real Estate Forms', desc: 'Lease, purchase, and inspection forms for property professionals.', clusters: mkClusters([
    ['lease-application', 'Lease Applications', 'Lease Application'],
    ['purchase-agreement', 'Purchase Agreements', 'Purchase Agreement'],
    ['inspection-checklist', 'Inspection Checklists', 'Inspection Checklist'],
    ['rental-agreement', 'Rental Agreements', 'Rental Agreement'],
    ['property-management', 'Property Management Forms', 'Property Management Form'],
    ['disclosure-form', 'Disclosure Forms', 'Disclosure Form'],
  ]) },
  { slug: 'nonprofit-forms', name: '非营利组织表单', en: 'Nonprofit Forms', desc: 'Donation, volunteer, and governance forms for nonprofit organizations.', clusters: mkClusters([
    ['donation-form', 'Donation Forms', 'Donation Form'],
    ['volunteer-agreement', 'Volunteer Agreements', 'Volunteer Agreement'],
    ['grant-report', 'Grant Reports', 'Grant Report'],
    ['board-meeting', 'Board Meeting Minutes', 'Board Meeting Minutes'],
    ['fundraising-plan', 'Fundraising Plans', 'Fundraising Plan'],
    ['donor-tracker', 'Donor Trackers', 'Donor Tracker'],
  ]) },
  { slug: 'freelance-contracts', name: '自由职业合同', en: 'Freelance Contracts', desc: 'Contracts, SOWs, and invoices built for independent professionals.', clusters: mkClusters([
    ['freelance-agreement', 'Freelance Agreements', 'Freelance Agreement'],
    ['statement-of-work', 'Statements of Work', 'Statement of Work'],
    ['independent-contractor', 'Independent Contractor Agreements', 'Independent Contractor Agreement'],
    ['invoice-freelance', 'Freelance Invoices', 'Freelance Invoice'],
    ['proposal-freelance', 'Freelance Proposals', 'Freelance Proposal'],
    ['retainer-agreement', 'Retainer Agreements', 'Retainer Agreement'],
  ]) },
  { slug: 'inventory-management', name: '库存管理模板', en: 'Inventory Management', desc: 'Lists, trackers, and orders for stock and warehouse operations.', clusters: mkClusters([
    ['inventory-list', 'Inventory Lists', 'Inventory List'],
    ['stock-tracker', 'Stock Trackers', 'Stock Tracker'],
    ['purchase-order', 'Purchase Orders', 'Purchase Order'],
    ['inventory-audit', 'Inventory Audits', 'Inventory Audit'],
    ['reorder-sheet', 'Reorder Sheets', 'Reorder Sheet'],
    ['barcode-sheet', 'Barcode Sheets', 'Barcode Sheet'],
  ]) },
  { slug: 'project-management', name: '项目管理模板', en: 'Project Management', desc: 'Plans, charts, and registers for structured project delivery.', clusters: mkClusters([
    ['project-plan', 'Project Plans', 'Project Plan'],
    ['gantt-chart', 'Gantt Charts', 'Gantt Chart'],
    ['risk-register', 'Risk Registers', 'Risk Register'],
    ['status-report', 'Status Reports', 'Status Report'],
    ['task-tracker', 'Task Trackers', 'Task Tracker'],
    ['project-charter', 'Project Charters', 'Project Charter'],
  ]) },
  { slug: 'customer-service', name: '客户服务模板', en: 'Customer Service', desc: 'Complaints, feedback, and SLA templates for service teams.', clusters: mkClusters([
    ['complaint-form', 'Complaint Forms', 'Complaint Form'],
    ['feedback-form', 'Feedback Forms', 'Feedback Form'],
    ['refund-request', 'Refund Requests', 'Refund Request'],
    ['service-ticket', 'Service Tickets', 'Service Ticket'],
    ['satisfaction-survey', 'Satisfaction Surveys', 'Satisfaction Survey'],
    ['sla-template', 'SLA Templates', 'SLA Template'],
  ]) },
  { slug: 'ecommerce-templates', name: '电商运营模板', en: 'E-commerce Templates', desc: 'Listings, labels, and policies for online store operations.', clusters: mkClusters([
    ['product-listing', 'Product Listings', 'Product Listing'],
    ['shipping-label', 'Shipping Labels', 'Shipping Label'],
    ['return-policy', 'Return Policies', 'Return Policy'],
    ['packing-slip', 'Packing Slips', 'Packing Slip'],
    ['order-tracker', 'Order Trackers', 'Order Tracker'],
    ['abandoned-cart', 'Abandoned Cart Emails', 'Abandoned Cart Email'],
  ]) },
  { slug: 'food-beverage', name: '餐饮行业表单', en: 'Food & Beverage', desc: 'Recipes, menus, and cost sheets for restaurants and cafés.', clusters: mkClusters([
    ['recipe-card', 'Recipe Cards', 'Recipe Card'],
    ['menu-template', 'Menu Templates', 'Menu Template'],
    ['food-cost', 'Food Cost Sheets', 'Food Cost Sheet'],
    ['inventory-restaurant', 'Restaurant Inventory', 'Restaurant Inventory'],
    ['health-inspection', 'Health Inspection Checklists', 'Health Inspection Checklist'],
    ['prep-sheet', 'Prep Sheets', 'Prep Sheet'],
  ]) },
  { slug: 'construction-trades', name: '建筑施工表单', en: 'Construction & Trades', desc: 'Contracts, estimates, and safety forms for the trades industry.', clusters: mkClusters([
    ['contract-construction', 'Construction Contracts', 'Construction Contract'],
    ['estimate', 'Estimate Templates', 'Estimate Template'],
    ['change-order', 'Change Orders', 'Change Order'],
    ['safety-checklist', 'Safety Checklists', 'Safety Checklist'],
    ['material-list', 'Material Lists', 'Material List'],
    ['punch-list', 'Punch Lists', 'Punch List'],
  ]) },
  { slug: 'health-wellness', name: '健康健身表单', en: 'Health & Wellness', desc: 'Intake, waiver, and tracking forms for wellness professionals.', clusters: mkClusters([
    ['intake-form', 'Intake Forms', 'Intake Form'],
    ['waiver', 'Liability Waivers', 'Liability Waiver'],
    ['fitness-plan', 'Fitness Plans', 'Fitness Plan'],
    ['health-tracker', 'Health Trackers', 'Health Tracker'],
    ['consent-form', 'Consent Forms', 'Consent Form'],
    ['progress-log', 'Progress Logs', 'Progress Log'],
  ]) },
  { slug: 'education-training', name: '教育培训表单', en: 'Education & Training', desc: 'Lesson plans, outlines, and evaluation forms for educators.', clusters: mkClusters([
    ['lesson-plan', 'Lesson Plans', 'Lesson Plan'],
    ['training-outline', 'Training Outlines', 'Training Outline'],
    ['attendance-sheet', 'Attendance Sheets', 'Attendance Sheet'],
    ['quiz-template', 'Quiz Templates', 'Quiz Template'],
    ['syllabus', 'Syllabus Templates', 'Syllabus Template'],
    ['evaluation-form', 'Evaluation Forms', 'Evaluation Form'],
  ]) },
  { slug: 'calculators-tools', name: '业务计算器工具', en: 'Calculators & Tools', desc: 'Interactive business calculators for finance, pricing, and operations.', clusters: mkClusters([
    ['profitability', 'Profitability Calculators', 'Profit Margin Calculator', ['profit-margin','gross-margin','net-margin','markup','ebitda','roi']],
    ['pricing', 'Pricing & Sales Calculators', 'Pricing Calculator', ['pricing','aov','conversion-rate','discount','commission','cac','unit-economics','tip']],
    ['finance', 'Finance & Loan Calculators', 'Loan Payment Calculator', ['loan-payment','mortgage','compound-interest','savings-goal','payback','npv','irr','cash-flow']],
    ['payroll', 'Payroll & Tax Calculators', 'Paycheck Calculator', ['paycheck','overtime','tax-rate','dti']],
    ['inventory', 'Inventory & Operations Calculators', 'Inventory Turnover Calculator', ['inventory-turnover','depreciation','break-even']],
    ['valuation', 'Valuation Calculators', 'Valuation Calculator', ['rental-yield','cap-rate','ltv']],
  ]) },
  { slug: 'comparisons-roundups', name: '对比与合集页', en: 'Comparisons & Roundups', desc: 'Head-to-head comparisons and curated roundups of business tools.', clusters: mkClusters([
    ['best-of', 'Best-Of Roundups', 'Best Tools Roundup'],
    ['versus', 'Head-to-Head Comparisons', 'Comparison'],
    ['alternatives', 'Alternatives Roundups', 'Alternatives Roundup'],
    ['pricing-compare', 'Pricing Comparisons', 'Pricing Comparison'],
    ['feature-compare', 'Feature Comparisons', 'Feature Comparison'],
    ['industry-roundup', 'Industry Tool Roundups', 'Industry Tool Roundup'],
  ]) },
];

// ---------------------------------------------------------------------------
// Per-section field banks for template page field tables.
// ---------------------------------------------------------------------------
const FIELD_BANKS = {
  'legal-contracts': ['Party A Legal Name', 'Party B Legal Name', 'Effective Date', 'Term Length', 'Jurisdiction', 'Governing Law', 'Signatures', 'Witness Name', 'Consideration', 'Confidentiality Scope', 'Termination Clause', 'Dispute Resolution', 'Force Majeure', 'Amendment Procedure'],
  'business-plans': ['Company Name', 'Mission Statement', 'Target Market', 'Revenue Model', 'Funding Ask', 'Use of Funds', 'Founders', 'Market Size (TAM)', 'Competitive Advantage', 'Milestones', 'Financial Projections', 'Exit Strategy', 'Team Bios', 'Go-to-Market Plan'],
  'hr-onboarding': ['Employee Name', 'Job Title', 'Start Date', 'Department', 'Manager Name', 'Salary', 'Benefits Enrollment', 'Emergency Contact', 'Tax Withholding', 'Direct Deposit', 'Equipment Issued', 'Policy Acknowledgment', 'Review Date', 'Work Location'],
  'finance-accounting': ['Invoice Number', 'Bill To', 'Date', 'Due Date', 'Line Items', 'Subtotal', 'Tax Rate', 'Total Due', 'Payment Terms', 'Account Number', 'Chart of Accounts', 'Period', 'Currency', 'Notes'],
  'sales-crm': ['Deal Name', 'Account', 'Contact Name', 'Stage', 'Value', 'Close Date', 'Probability', 'Owner', 'Next Step', 'Source', 'Competitors', 'Decision Makers', 'Pain Points', 'Budget'],
  'marketing-branding': ['Campaign Name', 'Channel', 'Audience', 'Publish Date', 'Asset Type', 'Owner', 'Status', 'KPI', 'Budget', 'Hashtags', 'CTA', 'Landing Page', 'Persona', 'Funnel Stage'],
  'operations-sop': ['Process Name', 'Owner', 'Version', 'Objective', 'Prerequisites', 'Step Number', 'Action', 'Responsible Role', 'Tools Required', 'Safety Notes', 'Quality Check', 'Revision Date', 'Approver', 'Frequency'],
  'real-estate-forms': ['Property Address', 'Landlord', 'Tenant', 'Lease Term', 'Monthly Rent', 'Security Deposit', 'Square Footage', 'Move-in Date', 'Utilities', 'Pets Policy', 'Maintenance Contact', 'Inspection Date', 'Condition Notes', 'Signatures'],
  'nonprofit-forms': ['Donor Name', 'Donation Amount', 'Date', 'Payment Method', 'Tax ID', 'Program', 'Receipt Number', 'Volunteer Role', 'Hours', 'Event Name', 'Grantor', 'Reporting Period', 'Board Members', 'Mission Alignment'],
  'freelance-contracts': ['Freelancer Name', 'Client Name', 'Project Scope', 'Deliverables', 'Rate', 'Payment Schedule', 'Timeline', 'Revisions Included', 'IP Ownership', 'Kill Fee', 'Expenses', 'Confidentiality', 'Termination', 'Signatures'],
  'inventory-management': ['SKU', 'Product Name', 'Category', 'Quantity on Hand', 'Reorder Point', 'Unit Cost', 'Supplier', 'Location', 'Barcode', 'Lead Time', 'Safety Stock', 'Last Counted', 'Status', 'Notes'],
  'project-management': ['Project Name', 'Sponsor', 'Start Date', 'End Date', 'Milestones', 'Deliverables', 'Resources', 'Budget', 'Risk Level', 'Status', 'Dependencies', 'Task Owner', 'Priority', 'Completion %'],
  'customer-service': ['Ticket ID', 'Customer Name', 'Contact', 'Issue Category', 'Priority', 'Assigned To', 'Status', 'Created Date', 'Resolved Date', 'Resolution', 'SLA Deadline', 'Satisfaction Score', 'Channel', 'Notes'],
  'ecommerce-templates': ['Product Title', 'SKU', 'Price', 'Stock', 'Weight', 'Dimensions', 'Category', 'Images', 'Description', 'Variants', 'Shipping Class', 'SEO Title', 'Tags', 'Status'],
  'food-beverage': ['Recipe Name', 'Yield', 'Prep Time', 'Cook Time', 'Ingredients', 'Quantities', 'Unit Cost', 'Selling Price', 'Allergens', 'Station', 'Chef', 'Batch Size', 'Shelf Life', 'Notes'],
  'construction-trades': ['Project Name', 'Contractor', 'Client', 'Scope of Work', 'Start Date', 'Completion Date', 'Total Price', 'Draw Schedule', 'Materials', 'Labor Hours', 'Permits', 'Site Address', 'Warranty', 'Signatures'],
  'health-wellness': ['Client Name', 'Date of Birth', 'Contact', 'Emergency Contact', 'Medical History', 'Goals', 'Allergies', 'Medications', 'Session Date', 'Trainer/Practitioner', 'Waiver Signed', 'Progress Metrics', 'Notes', 'Next Appointment'],
  'education-training': ['Course Name', 'Instructor', 'Date', 'Duration', 'Objectives', 'Materials', 'Activities', 'Assessment', 'Attendees', 'Location', 'Prerequisites', 'CEU Credits', 'Feedback Score', 'Resources'],
  'calculators-tools': ['Input Variable 1', 'Input Variable 2', 'Time Period', 'Currency', 'Rate', 'Result Metric', 'Assumptions', 'Notes', 'Scenario Name', 'Comparison Baseline'],
  'comparisons-roundups': ['Tool Name', 'Pricing', 'Free Tier', 'Key Features', 'Integrations', 'Ease of Use', 'Best For', 'Limitations', 'Rating', 'Website', 'Support', 'Deployment', 'Verdict', 'Notes'],
};

// Section-relevant calculator key pools (for calculator-type pages in mixed sections)
const SECTION_CALC_POOL = {
  'legal-contracts': ['cac', 'ltv'],
  'business-plans': ['roi', 'break-even', 'npv', 'irr'],
  'hr-onboarding': ['paycheck', 'overtime', 'commission'],
  'finance-accounting': ['profit-margin', 'gross-margin', 'net-margin', 'ebitda', 'cash-flow', 'depreciation', 'tax-rate'],
  'sales-crm': ['conversion-rate', 'cac', 'ltv', 'commission', 'aov'],
  'marketing-branding': ['conversion-rate', 'cac', 'ltv', 'roi'],
  'operations-sop': ['break-even', 'inventory-turnover', 'payback'],
  'real-estate-forms': ['mortgage', 'rental-yield', 'cap-rate', 'roi'],
  'nonprofit-forms': ['roi', 'cac'],
  'freelance-contracts': ['pricing', 'markup', 'tax-rate', 'cash-flow'],
  'inventory-management': ['inventory-turnover', 'aov', 'unit-economics'],
  'project-management': ['payback', 'npv', 'irr', 'roi'],
  'customer-service': ['conversion-rate', 'cac', 'ltv'],
  'ecommerce-templates': ['aov', 'conversion-rate', 'cac', 'ltv', 'discount'],
  'food-beverage': ['markup', 'profit-margin', 'pricing'],
  'construction-trades': ['markup', 'pricing', 'loan-payment', 'payback'],
  'health-wellness': ['pricing', 'markup', 'cash-flow'],
  'education-training': ['roi', 'payback', 'unit-economics'],
};

// ---------------------------------------------------------------------------
// Title generation
// ---------------------------------------------------------------------------
function titleForPattern(subject, cluster, type, idx) {
  // Deterministic title from a bank of patterns. Always includes the subject
  // so the slug stays meaningful and largely unique across clusters.
  const patterns = [
    () => `${pick(ADJ)} ${subject} ${pick(FORMS)}`,
    () => `${subject} ${pick(FORMS)} for ${pick(AUDIENCE)}`,
    () => `${subject} ${pick(FORMS)} (${pick(VARIANT)})`,
    () => `${pick(ADJ)} ${subject} ${pick(FORMS)} for ${pick(AUDIENCE)}`,
    () => `${subject} ${pick(FORMS)} — ${pick(USECASE)}`,
    () => `${pick(ADJ)} ${subject} ${pick(FORMS)} (${pick(VARIANT)})`,
    () => `${subject} ${pick(FORMS)} for ${pick(AUDIENCE)} (${pick(VARIANT)})`,
    () => `${pick(ADJ)} ${subject} ${pick(FORMS)}: ${pick(USECASE)}`,
    () => `${subject} ${pick(FORMS)}: ${pick(ADJ)} Edition for ${pick(AUDIENCE)}`,
    () => `${pick(ADJ)} ${subject} ${pick(FORMS)} — ${pick(USECASE)}`,
  ];
  // Section 20 (comparisons-roundups) overrides with comparison/roundup titles
  if (type === 'comparison') {
    const a = pick(['Excel', 'Google Sheets', 'Notion', 'Airtable', 'QuickBooks', 'Shopify', ' monday.com', 'Asana', 'Trello', 'HubSpot', 'Salesforce', 'Zoho']);
    const b = pick(['Smartsheet', 'ClickUp', 'Wave', 'Xero', 'WooCommerce', 'BigCommerce', 'Wix', 'Squarespace', 'Pipedrive', 'Freshsales', 'Zendesk', 'Intercom']);
    return `${a.trim()} vs ${b} ${pick(['Comparison', 'Feature Comparison', 'Pricing Comparison', '— Which Is Better?', 'for Small Business', 'Head-to-Head'])}`;
  }
  if (type === 'roundup') {
    return `Top ${ri(8, 15)} ${subject.replace(/s$/, '')} ${pick(['Tools', 'Templates', 'Apps', 'Software', 'Resources', 'Options', 'Picks for 2026', 'for Small Business'])}`;
  }
  if (type === 'calculator') {
    return `${subject} ${pick(['Calculator', 'Tool', 'Estimator', '— Free Online Tool', 'for Small Business', 'Worksheet'])}`;
  }
  return patterns[idx % patterns.length]();
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

// ---------------------------------------------------------------------------
// Content hints per type
// ---------------------------------------------------------------------------
const CONTENT_BLOCKS = ['Overview', 'Key Components', 'When to Use', 'Common Mistakes', 'Best Practices', 'Required Fields', 'Legal Notes', 'Practical Scenario'];

function genFields(section, n) {
  const bank = FIELD_BANKS[section] || FIELD_BANKS['legal-contracts'];
  const chosen = pickN(bank, Math.min(n, bank.length));
  const types = ['Text', 'Number', 'Date', 'Currency', 'Dropdown', 'Checkbox', 'Email', 'Phone', 'Textarea', 'URL'];
  return chosen.map((name) => ({
    name,
    type: pick(types),
    required: rng() > 0.35,
    desc: fieldDesc(name)
  }));
}

function fieldDesc(name) {
  const d = {
    'Party A Legal Name': 'Full legal name of the first contracting party.',
    'Effective Date': 'Date the agreement becomes legally binding.',
    'Signatures': 'Authorized signatures of all participating parties.',
  };
  return d[name] || `Enter the ${name.toLowerCase()} accurately for compliance.`;
}

function genSteps(subject, n) {
  const verbs = ['Identify', 'Gather', 'Draft', 'Review', 'Customize', 'Approve', 'Implement', 'Audit', 'Document', 'Schedule'];
  const objs = ['all required information', 'the relevant stakeholders', 'the template fields', 'against local regulations', 'with your legal counsel', 'the document for your business', 'a review cadence', 'the final version', 'distribution to the team', 'training for users'];
  const steps = [];
  for (let i = 0; i < n; i++) {
    steps.push(`${verbs[i % verbs.length]} ${objs[i % objs.length]} for your ${subject.toLowerCase()}.`);
  }
  return steps;
}

function genRoundupItems(subject, n) {
  const tools = ['Excel', 'Google Sheets', 'Notion', 'Airtable', 'Smartsheet', 'ClickUp', 'Asana', ' monday.com', 'Trello', 'HubSpot', 'Zoho', 'QuickBooks', 'Wave', 'Xero', 'Shopify', 'WooCommerce', 'Pipedrive', 'Freshsales', 'Zendesk', 'Intercom', 'Canva', 'Figma'];
  const items = [];
  const pool = pickN(tools, Math.min(n, tools.length));
  for (const t of pool) {
    items.push({
      name: t.trim(),
      rating: (ri(35, 50) / 10).toFixed(1),
      best: pick(['Small teams', 'Budget-conscious users', 'Scaling startups', 'Enterprises', 'Solo operators', 'Technical users', 'Non-technical users', 'Collaboration-heavy teams']),
      note: `Strong choice for ${subject.toLowerCase()} workflows with ${pick(['generous free tier', 'robust integrations', 'strong automation', 'excellent templates', 'good reporting', 'active community'])}.`
    });
  }
  return items;
}

function genCompareRows(subject) {
  const rows = ['Pricing', 'Free Tier', 'Ease of Use', 'Key Features', 'Integrations', 'Reporting', 'Automation', 'Mobile App', 'Support', 'Scalability', 'Security', 'Onboarding'];
  return rows.map((r) => ({
    label: r,
    a: pick(['Excellent', 'Good', 'Limited', 'Yes', 'No', 'Add-on', 'Standard', 'Premium only']),
    b: pick(['Excellent', 'Good', 'Limited', 'Yes', 'No', 'Add-on', 'Standard', 'Premium only'])
  }));
}

const CALC_META = {
  'profit-margin': { label: 'Profit Margin', inputs: [{ k: 'revenue', label: 'Revenue ($)', def: 10000 }, { k: 'cost', label: 'Cost ($)', def: 7000 }], out: 'Profit Margin (%)' },
  'pricing': { label: 'Product Pricing', inputs: [{ k: 'cost', label: 'Unit Cost ($)', def: 25 }, { k: 'markup', label: 'Markup (%)', def: 60 }], out: 'Suggested Price ($)' },
  'loan-payment': { label: 'Loan Payment', inputs: [{ k: 'principal', label: 'Principal ($)', def: 50000 }, { k: 'rate', label: 'Annual Rate (%)', def: 8 }, { k: 'years', label: 'Term (years)', def: 5 }], out: 'Monthly Payment ($)' },
  'paycheck': { label: 'Paycheck', inputs: [{ k: 'salary', label: 'Annual Salary ($)', def: 60000 }, { k: 'rate', label: 'Tax Rate (%)', def: 22 }], out: 'Net Monthly Pay ($)' },
  'roi': { label: 'Return on Investment', inputs: [{ k: 'gain', label: 'Net Gain ($)', def: 8000 }, { k: 'cost', label: 'Investment Cost ($)', def: 5000 }], out: 'ROI (%)' },
  'depreciation': { label: 'Straight-Line Depreciation', inputs: [{ k: 'cost', label: 'Asset Cost ($)', def: 30000 }, { k: 'salvage', label: 'Salvage Value ($)', def: 5000 }, { k: 'life', label: 'Useful Life (years)', def: 5 }], out: 'Annual Depreciation ($)' },
  'break-even': { label: 'Break-Even Point', inputs: [{ k: 'fixed', label: 'Fixed Costs ($)', def: 20000 }, { k: 'price', label: 'Unit Price ($)', def: 50 }, { k: 'vc', label: 'Variable Cost per Unit ($)', def: 20 }], out: 'Break-Even Units' },
  'inventory-turnover': { label: 'Inventory Turnover', inputs: [{ k: 'cogs', label: 'COGS ($)', def: 80000 }, { k: 'avg', label: 'Average Inventory ($)', def: 20000 }], out: 'Turnover Ratio' },
  'aov': { label: 'Average Order Value', inputs: [{ k: 'revenue', label: 'Revenue ($)', def: 25000 }, { k: 'orders', label: 'Number of Orders', def: 500 }], out: 'AOV ($)' },
  'conversion-rate': { label: 'Conversion Rate', inputs: [{ k: 'conversions', label: 'Conversions', def: 120 }, { k: 'visitors', label: 'Visitors', def: 6000 }], out: 'Conversion Rate (%)' },
  'cac': { label: 'Customer Acquisition Cost', inputs: [{ k: 'spend', label: 'Marketing Spend ($)', def: 5000 }, { k: 'customers', label: 'New Customers', def: 100 }], out: 'CAC ($)' },
  'ltv': { label: 'Customer Lifetime Value', inputs: [{ k: 'arpu', label: 'ARPU ($)', def: 50 }, { k: 'lifespan', label: 'Lifespan (years)', def: 3 }], out: 'LTV ($)' },
  'cash-flow': { label: 'Operating Cash Flow', inputs: [{ k: 'net', label: 'Net Income ($)', def: 40000 }, { k: 'depreciation', label: 'Depreciation ($)', def: 5000 }, { k: 'wc', label: 'Change in Working Capital ($)', def: -3000 }], out: 'Cash Flow ($)' },
  'tax-rate': { label: 'Effective Tax Rate', inputs: [{ k: 'tax', label: 'Tax Paid ($)', def: 12000 }, { k: 'income', label: 'Taxable Income ($)', def: 60000 }], out: 'Tax Rate (%)' },
  'discount': { label: 'Discount Price', inputs: [{ k: 'price', label: 'Original Price ($)', def: 100 }, { k: 'discount', label: 'Discount (%)', def: 20 }], out: 'Final Price ($)' },
  'tip': { label: 'Tip Calculator', inputs: [{ k: 'bill', label: 'Bill ($)', def: 50 }, { k: 'tip', label: 'Tip (%)', def: 18 }], out: 'Tip Amount ($)' },
  'overtime': { label: 'Overtime Pay', inputs: [{ k: 'rate', label: 'Hourly Rate ($)', def: 20 }, { k: 'ot', label: 'Overtime Hours', def: 10 }], out: 'Overtime Pay ($)' },
  'commission': { label: 'Commission', inputs: [{ k: 'sales', label: 'Sales ($)', def: 30000 }, { k: 'rate', label: 'Commission Rate (%)', def: 5 }], out: 'Commission ($)' },
  'rental-yield': { label: 'Rental Yield', inputs: [{ k: 'rent', label: 'Annual Rent ($)', def: 18000 }, { k: 'value', label: 'Property Value ($)', def: 250000 }], out: 'Gross Yield (%)' },
  'cap-rate': { label: 'Capitalization Rate', inputs: [{ k: 'noi', label: 'Net Operating Income ($)', def: 15000 }, { k: 'value', label: 'Property Value ($)', def: 250000 }], out: 'Cap Rate (%)' },
  'mortgage': { label: 'Mortgage Payment', inputs: [{ k: 'principal', label: 'Loan Amount ($)', def: 300000 }, { k: 'rate', label: 'Annual Rate (%)', def: 6.5 }, { k: 'years', label: 'Term (years)', def: 30 }], out: 'Monthly Payment ($)' },
  'compound-interest': { label: 'Compound Interest', inputs: [{ k: 'principal', label: 'Principal ($)', def: 10000 }, { k: 'rate', label: 'Annual Rate (%)', def: 7 }, { k: 'years', label: 'Years', def: 10 }], out: 'Future Value ($)' },
  'savings-goal': { label: 'Savings Goal', inputs: [{ k: 'goal', label: 'Goal ($)', def: 50000 }, { k: 'rate', label: 'Annual Rate (%)', def: 4 }, { k: 'years', label: 'Years', def: 5 }], out: 'Monthly Contribution ($)' },
  'dti': { label: 'Debt-to-Income Ratio', inputs: [{ k: 'debt', label: 'Monthly Debt ($)', def: 1500 }, { k: 'income', label: 'Monthly Income ($)', def: 5000 }], out: 'DTI (%)' },
  'gross-margin': { label: 'Gross Margin', inputs: [{ k: 'revenue', label: 'Revenue ($)', def: 10000 }, { k: 'cogs', label: 'COGS ($)', def: 6000 }], out: 'Gross Margin (%)' },
  'net-margin': { label: 'Net Margin', inputs: [{ k: 'revenue', label: 'Revenue ($)', def: 10000 }, { k: 'net', label: 'Net Income ($)', def: 1200 }], out: 'Net Margin (%)' },
  'ebitda': { label: 'EBITDA', inputs: [{ k: 'net', label: 'Net Income ($)', def: 20000 }, { k: 'interest', label: 'Interest ($)', def: 2000 }, { k: 'tax', label: 'Taxes ($)', def: 5000 }, { k: 'dep', label: 'Depreciation ($)', def: 3000 }, { k: 'amor', label: 'Amortization ($)', def: 1000 }], out: 'EBITDA ($)' },
  'unit-economics': { label: 'Unit Economics', inputs: [{ k: 'price', label: 'Price per Unit ($)', def: 50 }, { k: 'cost', label: 'Cost per Unit ($)', def: 30 }], out: 'Contribution Margin ($)' },
  'payback': { label: 'Payback Period', inputs: [{ k: 'cost', label: 'Investment ($)', def: 10000 }, { k: 'cash', label: 'Annual Cash Inflow ($)', def: 2500 }], out: 'Payback (years)' },
  'npv': { label: 'Net Present Value', inputs: [{ k: 'cashflow', label: 'Annual Cash Flow ($)', def: 3000 }, { k: 'rate', label: 'Discount Rate (%)', def: 8 }, { k: 'years', label: 'Years', def: 5 }, { k: 'initial', label: 'Initial Investment ($)', def: 10000 }], out: 'NPV ($)' },
  'irr': { label: 'Internal Rate of Return', inputs: [{ k: 'initial', label: 'Initial Investment ($)', def: 10000 }, { k: 'cashflow', label: 'Annual Cash Flow ($)', def: 2500 }, { k: 'years', label: 'Years', def: 5 }], out: 'IRR (%)' },
  'markup': { label: 'Markup', inputs: [{ k: 'cost', label: 'Cost ($)', def: 40 }, { k: 'price', label: 'Selling Price ($)', def: 100 }], out: 'Markup (%)' },
};

// ---------------------------------------------------------------------------
// FAQ generation
// ---------------------------------------------------------------------------
const FAQ_GENERAL = [
  { q: 'Is this template free to use?', a: 'Yes. The template is free to download and customize for your own business use. Always have a qualified professional review legal or financial documents before relying on them.' },
  { q: 'Which format is this available in?', a: 'The template ships as a CSV sample you can open in Excel, Google Sheets, or any spreadsheet app. Fields are labeled for easy import into other tools.' },
  { q: 'Does this replace professional advice?', a: 'No. These templates are reference tools only and do not constitute legal, financial, tax, or employment advice. Consult a licensed professional before use.' },
];

function genFaqTopic(subject, section, type) {
  const isCalc = type === 'calculator';
  const specific = isCalc ? [
    { q: `How do I use this ${subject.toLowerCase()}?`, a: `Enter your inputs in the calculator above and the result updates instantly. Adjust each field to model different scenarios and compare outcomes side by side.` },
    { q: `What inputs does this ${subject.toLowerCase()} need?`, a: `The calculator takes the inputs listed in the Key Components section. Fill each field with realistic figures to get a reliable estimate.` },
    { q: `Can I rely on the result for filing or reporting?`, a: `No. The calculator returns planning estimates using standard formulas. Confirm any figure you intend to report or file with your accountant or financial tooling.` },
  ] : [
    { q: `What fields should a ${subject.toLowerCase()} include?`, a: `A solid ${subject.toLowerCase()} typically captures parties, effective dates, key obligations, payment terms, signatures, and dispute-resolution clauses. Use the field table on this page as a starting checklist.` },
    { q: `How do I customize this ${subject.toLowerCase()} for my industry?`, a: `Start from the standard fields, then add industry-specific clauses (for example, confidentiality scope for services or payment milestones for construction). Keep language plain and consistent across documents.` },
    { q: `How often should I update my ${subject.toLowerCase()}?`, a: `Review at least annually, or whenever laws, rates, or business terms change. Version every revision and store the prior version for audit trails.` },
  ];
  const topic2 = isCalc
    ? { q: `How accurate is this ${subject}?`, a: `The calculator applies standard formulas and your inputs. It returns an estimate for planning; verify figures with your accountant or financial tooling before making decisions.` }
    : { q: `Can I edit the ${subject.toLowerCase()} in Google Sheets?`, a: `Yes. Import the CSV sample into Google Sheets, then adjust columns, formulas, and formatting to match your workflow. Share via link for team collaboration.` };
  return [...pickN(specific, 2), topic2, pick(FAQ_GENERAL)];
}

// Scenario text generation (varies by industry/difficulty/useTime)
function genScenario(subject, industry, difficulty, useTime, type) {
  const diffNote = difficulty === 'beginner' ? 'even if you are new to this kind of tool'
    : difficulty === 'advanced' ? 'including the edge cases experienced operators watch for'
    : 'with a balance of detail and usability';
  if (type === 'calculator') {
    return `Imagine a ${industry.toLowerCase()} business weighing a decision this week. Using this ${subject.toLowerCase()}, the owner enters a few inputs and reads off the result in about ${useTime}, ${diffNote}. The live output makes it easy to compare scenarios and move forward with a defensible number.`;
  }
  return `Imagine a ${industry.toLowerCase()} business onboarding a new client this week. Using this ${subject.toLowerCase()}, the owner completes the required fields in about ${useTime}, ${diffNote}. The structured layout helps avoid missed clauses and keeps the engagement compliant and professional.`;
}

// ---------------------------------------------------------------------------
// Type assignment per section
// ---------------------------------------------------------------------------
// Sections 1-18 (idx 0-17): per 100 pages -> 56 template, 22 tutorial, 6 calculator, 10 roundup, 6 comparison
// Section 19 (idx 18): all calculator
// Section 20 (idx 19): 60 roundup + 40 comparison
function typeForTopic(sectionIdx, posInSection) {
  if (sectionIdx === 18) return 'calculator';
  if (sectionIdx === 19) return posInSection < 60 ? 'roundup' : 'comparison';
  // pattern of 100: 56 t, 22 u, 6 c, 10 r, 6 p (interleaved to spread types)
  const pattern = [];
  for (let i = 0; i < 56; i++) pattern.push('template');
  for (let i = 0; i < 22; i++) pattern.push('tutorial');
  for (let i = 0; i < 6; i++) pattern.push('calculator');
  for (let i = 0; i < 10; i++) pattern.push('roundup');
  for (let i = 0; i < 6; i++) pattern.push('comparison');
  // shuffle deterministically with fixed seed offset
  const r2 = mulberry32(1000 + sectionIdx);
  for (let i = pattern.length - 1; i > 0; i--) {
    const j = Math.floor(r2() * (i + 1));
    [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
  }
  return pattern[posInSection % pattern.length];
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------
export function generateTopics() {
  const topics = [];
  const slugCount = new Map();
  let id = 0;

  for (let sIdx = 0; sIdx < SECTIONS.length; sIdx++) {
    const section = SECTIONS[sIdx];
    const clusters = section.clusters;
    // distribute 100 topics across 6 clusters: 4 clusters get 17, 2 get 16
    const counts = clusters.map((_, i) => (i < 100 % clusters.length || 100 % clusters.length === 0 ? Math.ceil(100 / clusters.length) : Math.floor(100 / clusters.length)));
    // ensure sum == 100
    let assigned = counts.reduce((a, b) => a + b, 0);
    let ci = 0;
    while (assigned < 100) { counts[ci % counts.length]++; assigned++; ci++; }
    while (assigned > 100) { counts[ci % counts.length] = Math.max(0, counts[ci % counts.length] - 1); assigned--; ci++; }

    let posInSection = 0;
    for (let cIdx = 0; cIdx < clusters.length; cIdx++) {
      const cluster = clusters[cIdx];
      const n = counts[cIdx];
      for (let k = 0; k < n; k++) {
        id++;
        const type = typeForTopic(sIdx, posInSection);
        posInSection++;
        // For calculator topics, bind subject to a specific registered calculator
        // so the interactive calculator rendered on the page matches the title.
        let calcKey = null, calcMeta = null;
        let subject = cluster.subject;
        if (type === 'calculator') {
          if (sIdx === 18 && cluster.calcKeys && cluster.calcKeys.length) {
            calcKey = cluster.calcKeys[k % cluster.calcKeys.length];
          } else {
            const pool = SECTION_CALC_POOL[section.slug] || CALC_KEYS;
            calcKey = pool[k % pool.length];
          }
          calcMeta = CALC_META[calcKey] || CALC_META['profit-margin'];
          if (calcMeta) subject = calcMeta.label;
        }
        let title;
        let attempts = 0;
        do {
          title = titleForPattern(subject, cluster, type, k + attempts);
          attempts++;
        } while (!title || title.length < 8 || title.length > 70);

        let slug = slugify(title);
        // de-duplicate slug site-wide
        if (slugCount.has(slug)) {
          const next = slugCount.get(slug) + 1;
          slugCount.set(slug, next);
          slug = `${slug}-${next}`;
        } else {
          slugCount.set(slug, 1);
        }

        const industry = pick(INDUSTRIES);
        const difficulty = pick(DIFFICULTIES);
        const useTime = pick(USE_TIMES);
        const format = pick(FORMATS);
        const keywords = pickN([...new Set([subject, cluster.name, section.en, industry, format, difficulty])], 5).map((s) => s.toLowerCase());

        // content blocks: pick 4-5 from 8 deterministically
        const blocks = pickN(CONTENT_BLOCKS, ri(4, 5));
        // ensure Practical Scenario present for scenario paragraph
        if (!blocks.includes('Practical Scenario')) blocks[blocks.length - 1] = 'Practical Scenario';

        // type-specific content
        let fields = [], steps = [], items = [], compareRows = [];
        if (type === 'template') {
          fields = genFields(section.slug, ri(6, 10));
        } else if (type === 'tutorial') {
          steps = genSteps(subject, ri(5, 8));
          fields = genFields(section.slug, ri(4, 6));
        } else if (type === 'roundup') {
          items = genRoundupItems(subject, ri(8, 15));
        } else if (type === 'comparison') {
          compareRows = genCompareRows(subject);
        }
        // calculator: calcKey/calcMeta already bound above to match the title

        const faqs = genFaqTopic(subject, section.slug, type);
        const scenario = genScenario(subject, industry, difficulty, useTime, type);
        const authorities = pickN(AUTHORITIES, ri(2, 3));

        const summary = type === 'calculator'
          ? `${title} — a free online calculator for ${industry.toLowerCase()} businesses. ${section.en} resource with live inputs and instant results.`
          : `${title} — a ${type} for ${industry.toLowerCase()} businesses. ${section.en} resource with structured fields and a ready-to-use sample.`;
        // description 150-160 chars
        const descTail = type === 'calculator'
          ? `Live inputs, instant results, and best practices for ${section.en.toLowerCase()}.`
          : `Structured fields, sample data, and best practices for ${section.en.toLowerCase()}.`;
        let description = `${title}: ${type === 'calculator' ? 'free online calculator' : 'free downloadable ' + format.toLowerCase() + ' ' + type} for ${industry.toLowerCase()} teams. ${descTail}`;
        if (description.length > 160) description = description.slice(0, 156).trimEnd() + '...';
        while (description.length < 150) description += ' Free to use.';
        if (description.length > 160) description = description.slice(0, 156).trimEnd() + '...';

        // title for <title> tag (50-60 chars, contains keyword, differs from H1)
        const kw = keywords[0] || subject.toLowerCase();
        let pageTitle = `${title} | ${section.en} | Small Business Forms Hub`;
        if (pageTitle.length > 60) pageTitle = pageTitle.slice(0, 57).trimEnd() + '...';

        topics.push({
          id,
          section: section.slug,
          sectionName: section.name,
          sectionEn: section.en,
          sectionDesc: section.desc,
          cluster: cluster.slug,
          clusterName: cluster.name,
          subject,
          type,
          topicTitle: title,
          pageTitle,
          h1: title,
          keywords,
          format,
          industry,
          difficulty,
          useTime,
          slug,
          summary,
          description,
          blocks,
          fields,
          steps,
          items,
          compareRows,
          calcKey,
          calcMeta,
          faqs,
          scenario,
          authorities,
        });
      }
    }
  }

  // sanity: exactly 2000
  if (topics.length !== 2000) {
    throw new Error(`Expected 2000 topics, got ${topics.length}`);
  }
  return topics;
}

export const ALL_CLUSTERS = SECTIONS.flatMap((s) => s.clusters.map((c) => ({ ...c, section: s.slug, sectionEn: s.en, sectionName: s.name })));
