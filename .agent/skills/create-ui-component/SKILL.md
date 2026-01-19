---
name: Create UI Component
description: Create a new React UI component following the project's design system and architecture.
---

# Instructions

When the user asks to create a new UI component, follow these steps strictly to ensure consistency.

## 1. Determine Location
- All components reside in `src/components/`.
- Identify the appropriate category (folder) for the component:
  - `layout/`: For structural components (Navbar, Sidebar, etc.).
  - `comment/`: For feature-specific components (StudentCard, CommentGenerator, etc.).
  - `ui/`: For generic reusable components (Button, Input, Modal, etc.).
  - **New Category**: If no existing category fits, create a new logical folder name.

## 2. File Naming
- Use PascalCase for component filenames: `ComponentName.tsx`.
- Create a corresponding test file: `ComponentName.test.tsx`.
- Use named exports.

## 3. Code Standards
- **Framework**: React + TypeScript.
- **Styling**: Tailwind CSS (v4).
- **Icons**: `lucide-react`.
- **Utils**: Use `cn` from root `lib/utils` (or `src/lib/utils` if in a subfolder) for class merging if specific logic is needed (optional for simple components).

## 4. Component Structure Template
Use the following template as a base:

```tsx
import React from 'react';
import { cn } from '../../lib/utils'; // Adjust import path as needed

interface COMPONENT_NAMEProps {
    className?: string;
    // Add other props here
}

export function COMPONENT_NAME({ className, ...props }: COMPONENT_NAMEProps) {
    return (
        <div className={cn("base-styles", className)} {...props}>
            {/* Component Content */}
        </div>
    );
}
```

## 5. Test File Template
Create `[ComponentName].test.tsx` in the same directory:

```tsx
import { render, screen } from '@testing-library/react';
import { COMPONENT_NAME } from './COMPONENT_NAME';

describe('COMPONENT_NAME', () => {
    it('renders correctly', () => {
        render(<COMPONENT_NAME />);
        // Add more specific assertions here
    });
});
```

## 6. Verification
- Ensure the component is exported successfully.
- If the user asks for a newly created component to be integrated immediately, verify the parent file exists before modifying it.

# Examples

## Example 1: Simple Badge Component
**User**: "Create a Badge component."
**Action**: Create `src/components/ui/Badge.tsx`

```tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
    label: string;
    variant?: 'primary' | 'secondary';
    className?: string;
}

export function Badge({ label, variant = 'primary', className }: BadgeProps) {
    const variants = {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-200 text-gray-800'
    };

    return (
        <span className={cn("px-2 py-1 rounded text-xs font-semibold", variants[variant], className)}>
            {label}
        </span>
    );
}
```
