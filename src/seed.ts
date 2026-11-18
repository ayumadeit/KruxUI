import type { Database as DatabaseType } from 'better-sqlite3';
import { getDb, initDatabase } from './db.js';

export function slugify(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

export interface SeedProp {
  name: string;
  type: 'text' | 'color' | 'range';
  defaultValue: string | number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface SeedComponent {
  name: string;
  category: string;
  description: string;
  props: SeedProp[];
}

export const SEED_COMPONENTS: SeedComponent[] = [
  {
    name: 'Goldeneye',
    category: 'Experimental',
    description: 'Interactive eye element that dynamically tracks cursor movements.',
    props: [
      { name: 'color', type: 'color', defaultValue: '#FFC93C' },
      { name: 'size', type: 'range', defaultValue: 150, min: 80, max: 220, step: 5, unit: 'px' }
    ]
  },
  {
    name: 'StatusDot',
    category: 'Atom',
    description: 'Pulsing indicator dot for real-time status and presence.',
    props: [
      { name: 'label', type: 'text', defaultValue: 'Online' },
      { name: 'color', type: 'color', defaultValue: '#C7FF4D' }
    ]
  },
  {
    name: 'ChatFAB',
    category: 'Conversation',
    description: 'Floating action button that expands into a conversational bubble.',
    props: [
      { name: 'message', type: 'text', defaultValue: 'Hi! How can I help?' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'Aurora',
    category: 'Background',
    description: 'Glowing ambient gradient mesh with shifting organic motion.',
    props: [
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' },
      { name: 'speed', type: 'range', defaultValue: 6, min: 2, max: 14, unit: 's' }
    ]
  },
  {
    name: 'PricingCard',
    category: 'Commerce',
    description: 'Tiered subscription pricing card with styled currency.',
    props: [
      { name: 'plan', type: 'text', defaultValue: 'Pro' },
      { name: 'price', type: 'range', defaultValue: 19, min: 0, max: 99, unit: '$' }
    ]
  },
  {
    name: 'SlippyWords',
    category: 'Text',
    description: 'Playful interactive text where individual letters slide on hover.',
    props: [
      { name: 'text', type: 'text', defaultValue: 'slip and slide' },
      { name: 'color', type: 'color', defaultValue: '#F5F5F5' }
    ]
  },
  {
    name: 'ASCIIHero',
    category: 'Hero',
    description: 'Animated retro ASCII sine-wave visualizer hero.',
    props: [
      { name: 'color', type: 'color', defaultValue: '#C7FF4D' },
      { name: 'speed', type: 'range', defaultValue: 8, min: 2, max: 20, unit: 'fps' }
    ]
  },
  {
    name: 'Popover',
    category: 'Overlay',
    description: 'Accessible contextual overlay anchored to an action trigger.',
    props: [
      { name: 'label', type: 'text', defaultValue: 'Toggle popover' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'GradientText',
    category: 'Atom',
    description: 'Continuous animated flowing multi-stop gradient typography.',
    props: [
      { name: 'text', type: 'text', defaultValue: 'Break the ordinary' },
      { name: 'speed', type: 'range', defaultValue: 4, min: 1, max: 10, unit: 's' }
    ]
  },
  {
    name: 'MockIDE',
    category: 'Surface',
    description: 'Stylized terminal code editor preview with window controls.',
    props: [
      { name: 'file', type: 'text', defaultValue: 'App.tsx' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'CommunityBadge',
    category: 'Social proof',
    description: 'Avatar stack social proof pill badge.',
    props: [
      { name: 'text', type: 'text', defaultValue: 'Join the community' },
      { name: 'color', type: 'color', defaultValue: '#C7FF4D' }
    ]
  },
  {
    name: 'FloatingSparkles',
    category: 'Background',
    description: 'Field of ambient animated drifting sparkle particles.',
    props: [
      { name: 'count', type: 'range', defaultValue: 10, min: 3, max: 24 },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'PromptHero',
    category: 'Hero',
    description: 'Interactive AI prompt input hero container with action submit.',
    props: [
      { name: 'placeholder', type: 'text', defaultValue: 'Describe an interface...' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'BeforeAfter',
    category: 'Experimental',
    description: 'Split-pane before and after visual comparison slider.',
    props: [
      { name: 'position', type: 'range', defaultValue: 50, min: 0, max: 100, unit: '%' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'WibblingSpinner',
    category: 'Atom',
    description: 'Dynamic rotating loading indicator with configurable speed.',
    props: [
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' },
      { name: 'speed', type: 'range', defaultValue: 1, min: 0.3, max: 3, step: 0.1, unit: 's' }
    ]
  },
  {
    name: 'LogoMarquee',
    category: 'Social proof',
    description: 'Continuous looping horizontal marquee for partner logos.',
    props: [
      { name: 'names', type: 'text', defaultValue: 'Northwind,Lumen,Vertex,Halo,Orbit' },
      { name: 'speed', type: 'range', defaultValue: 10, min: 3, max: 30, unit: 's' }
    ]
  },
  {
    name: 'QuestText',
    category: 'Text',
    description: 'RPG-inspired typewriter text display with replay capabilities.',
    props: [
      { name: 'text', type: 'text', defaultValue: 'A strange interface appears. Do you click it?' },
      { name: 'speed', type: 'range', defaultValue: 40, min: 10, max: 120, unit: 'ms' }
    ]
  },
  {
    name: 'NodeGraphBackground',
    category: 'Background',
    description: 'Interactive canvas network node graph with proximity lines.',
    props: [
      { name: 'count', type: 'range', defaultValue: 18, min: 6, max: 40 },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'StickyBanner',
    category: 'Surface',
    description: 'Sticky announcement banner with dismiss button.',
    props: [
      { name: 'text', type: 'text', defaultValue: 'v1.0 is out — break something.' },
      { name: 'color', type: 'color', defaultValue: '#C7FF4D' }
    ]
  },
  {
    name: 'ChatBubble',
    category: 'Conversation',
    description: 'Asymmetrical speech bubble component for chat dialogues.',
    props: [
      { name: 'text', type: 'text', defaultValue: 'Ship something strange today.' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'WordRoll',
    category: 'Text',
    description: 'Vertical rolling carousel text animation for cycling keywords.',
    props: [
      { name: 'words', type: 'text', defaultValue: 'ship,break,remix' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' },
      { name: 'speed', type: 'range', defaultValue: 1.5, min: 0.5, max: 4, step: 0.1, unit: 's' }
    ]
  },
  {
    name: 'EyebrowPill',
    category: 'Atom',
    description: 'Compact status pill badge for headers and categories.',
    props: [
      { name: 'text', type: 'text', defaultValue: 'New: v1.0' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'GlassCard',
    category: 'Surface',
    description: 'Modern translucent frosted-glass container with border glow.',
    props: [
      { name: 'title', type: 'text', defaultValue: 'Frosted glass' },
      { name: 'blur', type: 'range', defaultValue: 10, min: 0, max: 24, unit: 'px' }
    ]
  },
  {
    name: 'StatCounter',
    category: 'Data',
    description: 'Animated numerical metric counter with dynamic easing.',
    props: [
      { name: 'value', type: 'range', defaultValue: 2400, min: 0, max: 10000, step: 100 },
      { name: 'label', type: 'text', defaultValue: 'components shipped' }
    ]
  },
  {
    name: 'Temperature',
    category: 'Data',
    description: 'Color-reactive temperature bar gauge and readout.',
    props: [
      { name: 'value', type: 'range', defaultValue: 22, min: 0, max: 40, unit: '°C' }
    ]
  },
  {
    name: 'TokenStream',
    category: 'Text',
    description: 'Word-by-word fade-in stream mimicking language model generation.',
    props: [
      { name: 'text', type: 'text', defaultValue: 'Tokens arrive one at a time, like thought.' },
      { name: 'speed', type: 'range', defaultValue: 0.2, min: 0.05, max: 0.6, step: 0.05, unit: 's' }
    ]
  },
  {
    name: 'BigBack',
    category: 'Atom',
    description: 'Bold oversized navigation button returning user to top.',
    props: [
      { name: 'label', type: 'text', defaultValue: 'Back' },
      { name: 'color', type: 'color', defaultValue: '#F5F5F5' }
    ]
  },
  {
    name: 'Button',
    category: 'Atom',
    description: 'Tactile pressable button with click animation feedback.',
    props: [
      { name: 'label', type: 'text', defaultValue: 'Break it' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'LogoRow',
    category: 'Social proof',
    description: 'Horizontally aligned text badges representing brands.',
    props: [
      { name: 'names', type: 'text', defaultValue: 'Northwind,Lumen,Vertex,Halo' }
    ]
  },
  {
    name: 'Rotator',
    category: 'Experimental',
    description: 'Continuously revolving radial list of orbital tags.',
    props: [
      { name: 'items', type: 'text', defaultValue: 'React,Motion,Canvas,SVG,CSS,Type' },
      { name: 'speed', type: 'range', defaultValue: 12, min: 3, max: 30, unit: 's' },
      { name: 'color', type: 'color', defaultValue: '#C7FF4D' }
    ]
  },
  {
    name: 'WaitlistForm',
    category: 'Form',
    description: 'Inline newsletter or waitlist subscription form.',
    props: [
      { name: 'button', type: 'text', defaultValue: 'Join waitlist' },
      { name: 'color', type: 'color', defaultValue: '#FF4FA3' }
    ]
  },
  {
    name: 'Sparkle',
    category: 'Atom',
    description: 'Geometric pulsing star sparkle icon.',
    props: [
      { name: 'color', type: 'color', defaultValue: '#C7FF4D' },
      { name: 'size', type: 'range', defaultValue: 40, min: 16, max: 96, step: 2, unit: 'px' }
    ]
  },
  {
    name: 'Prompt',
    category: 'Conversation',
    description: 'Command-line prompt box with blinking cursor prompt.',
    props: [
      { name: 'text', type: 'text', defaultValue: 'build a landing page' },
      { name: 'color', type: 'color', defaultValue: '#C7FF4D' }
    ]
  }
];

export function seed(database?: DatabaseType): void {
  const db = database || getDb();

  const insertComponent = db.prepare(`
    INSERT INTO components (slug, name, category, description, status, version)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      description = excluded.description,
      status = excluded.status,
      version = excluded.version
  `);

  const deleteComponentProps = db.prepare(`
    DELETE FROM props WHERE component_slug = ?
  `);

  const insertProp = db.prepare(`
    INSERT INTO props (component_slug, name, type, default_value, min, max, step, unit, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const runSeed = db.transaction(() => {
    for (const comp of SEED_COMPONENTS) {
      const slug = slugify(comp.name);
      insertComponent.run(slug, comp.name, comp.category, comp.description, 'beta', '0.1.0');

      deleteComponentProps.run(slug);

      comp.props.forEach((prop, index) => {
        insertProp.run(
          slug,
          prop.name,
          prop.type,
          String(prop.defaultValue),
          prop.min !== undefined ? prop.min : null,
          prop.max !== undefined ? prop.max : null,
          prop.step !== undefined ? prop.step : null,
          prop.unit || null,
          index
        );
      });
    }
  });

  runSeed();
  console.log(`Seeded ${SEED_COMPONENTS.length} components with props.`);
}

// Allow direct execution: `tsx src/seed.ts`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  initDatabase();
  seed();
}
